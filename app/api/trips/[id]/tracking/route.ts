import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";


// Helper to fetch route geometry from OSRM
async function fetchOsrmRoute(points: Array<{ lat: number; lng: number }>): Promise<Array<{ lat: number; lng: number }> | null> {
  if (points.length < 2) return null;

  try {
    // Construct coordinate string: "lon,lat;lon,lat;..."
    const coordinates = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      // OSRM returns [lon, lat] in GeoJSON
      return data.routes[0].geometry.coordinates.map((coord: number[]) => ({
        lat: coord[1],
        lng: coord[0]
      }));
    }
  } catch (error) {
    console.error("OSRM fetch error:", error);
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tripId } = await params;
  
  try {
    let trip: any = null;
    let homeBase: { lat: number; lng: number } | null = null;
    
    try {
      const tripResult = await pool.query(`
        SELECT t.id, t.trip_number, t.status, t.driver_id, t.unit_id,
          t.pickup_lat, t.pickup_lng, t.delivery_lat, t.delivery_lng,
          d.name as driver_name, d.phone as driver_phone, u.unit_number,
          y.latitude as yard_lat, y.longitude as yard_lng
        FROM trips t
        LEFT JOIN drivers d ON t.driver_id = d.id
        LEFT JOIN units u ON t.unit_id = u.id
        LEFT JOIN yards y ON u.yard_id = y.id
        WHERE t.id = $1
      `, [tripId]);

      if (tripResult.rows.length === 0) {
        return NextResponse.json(generateDemoTrackingData(tripId));
      }
      trip = tripResult.rows[0];
      
      // Set home base from yard if available
      if (trip.yard_lat && trip.yard_lng) {
        homeBase = { lat: parseFloat(trip.yard_lat), lng: parseFloat(trip.yard_lng) };
      }
    } catch (dbError: any) {
      console.error("Error fetching trip:", dbError.message);
      return NextResponse.json(generateDemoTrackingData(tripId));
    }

    let stops: any[] = [];
    try {
      const stopsResult = await pool.query(`
        SELECT id, stop_sequence as sequence, stop_type as type,
          location_name as location, latitude as lat, longitude as lng, status
        FROM trip_stops WHERE trip_id = $1 ORDER BY stop_sequence
      `, [tripId]);
      stops = stopsResult.rows;
    } catch (e) { console.log("trip_stops table not available"); }

    const pickupLat = trip.pickup_lat ? parseFloat(trip.pickup_lat) : null;
    const pickupLng = trip.pickup_lng ? parseFloat(trip.pickup_lng) : null;
    const deliveryLat = trip.delivery_lat ? parseFloat(trip.delivery_lat) : null;
    const deliveryLng = trip.delivery_lng ? parseFloat(trip.delivery_lng) : null;

    let currentPosition = null;
    if (pickupLat && pickupLng) {
      const baseLat = trip.status === "Completed" || trip.status === "At Delivery" 
        ? (deliveryLat || pickupLat) : pickupLat;
      const baseLng = trip.status === "Completed" || trip.status === "At Delivery"
        ? (deliveryLng || pickupLng) : pickupLng;
      
      currentPosition = {
        lat: baseLat + (Math.random() - 0.5) * 0.01,
        lng: baseLng + (Math.random() - 0.5) * 0.01,
        status: trip.status === "In Transit" ? "moving" : "stationary",
        speed: trip.status === "In Transit" ? Math.round(45 + Math.random() * 20) : 0,
        heading: Math.round(Math.random() * 360),
        lastPingTime: new Date().toISOString(),
        hosRemaining: 8.5, eldConnected: true,
      };
    }

    const geofences: any[] = [];
    if (stops.length > 0) {
      stops.filter((stop: any) => stop.lat && stop.lng).forEach((stop: any, idx: number) => {
        geofences.push({
          id: `geofence-${stop.id || idx}`, name: stop.location, type: (stop.type || "stop").toLowerCase(),
          coordinates: generateGeofencePolygon({ lat: parseFloat(stop.lat), lng: parseFloat(stop.lng) }, 100),
          bufferZone: generateHysteresisZone({ lat: parseFloat(stop.lat), lng: parseFloat(stop.lng) }, 100, 30),
        });
      });
    } else {
      if (pickupLat && pickupLng) {
        geofences.push({ id: "geofence-pickup", name: "Pickup", type: "pickup",
          coordinates: generateGeofencePolygon({ lat: pickupLat, lng: pickupLng }, 100),
          bufferZone: generateHysteresisZone({ lat: pickupLat, lng: pickupLng }, 100, 30) });
      }
      if (deliveryLat && deliveryLng) {
        geofences.push({ id: "geofence-delivery", name: "Delivery", type: "delivery",
          coordinates: generateGeofencePolygon({ lat: deliveryLat, lng: deliveryLng }, 100),
          bufferZone: generateHysteresisZone({ lat: deliveryLat, lng: deliveryLng }, 100, 30) });
      }
    }

    const breadcrumbs: any[] = [];
    if (currentPosition) {
      for (let i = 14; i >= 0; i--) {
        breadcrumbs.push({ lat: currentPosition.lat + (i * 0.0003), lng: currentPosition.lng - (i * 0.0004),
          timestamp: new Date(Date.now() - i * 60000).toISOString(), speed: 35 + Math.random() * 20 });
      }
    }

    // Build waypoints for route calculation
    const waypoints: Array<{ lat: number; lng: number }> = [];
    
    // Add home base as start point if available
    if (homeBase) {
      waypoints.push(homeBase);
    }
    
    // Add stops if available, otherwise fallback to pickup/delivery
    if (stops.length > 0) {
      stops.forEach(s => {
        if (s.lat && s.lng) {
          waypoints.push({ lat: parseFloat(s.lat), lng: parseFloat(s.lng) });
        }
      });
    } else {
      if (pickupLat && pickupLng) waypoints.push({ lat: pickupLat, lng: pickupLng });
      if (deliveryLat && deliveryLng) waypoints.push({ lat: deliveryLat, lng: deliveryLng });
    }

    // Calculate actual route path
    let routePath = [...waypoints]; // Default fallback to straight lines
    try {
      const realRoute = await fetchOsrmRoute(waypoints);
      if (realRoute) {
        routePath = realRoute;
      }
    } catch (routeError) {
      console.error("Failed to calculate route path:", routeError);
      // Fallback to straight lines is already set
    }

    if (!currentPosition && geofences.length === 0) {
      return NextResponse.json(generateDemoTrackingData(tripId, trip.trip_number));
    }

    return NextResponse.json({
      tripId, tripNumber: trip.trip_number, status: trip.status,
      driver: { id: trip.driver_id, name: trip.driver_name, phone: trip.driver_phone },
      unit: { id: trip.unit_id, number: trip.unit_number },
      currentPosition, breadcrumbs, geofences, homeBase, routePath,
      stops: stops.map((s: any) => ({ id: s.id, sequence: s.sequence, type: s.type, location: s.location,
        lat: s.lat ? parseFloat(s.lat) : null, lng: s.lng ? parseFloat(s.lng) : null, status: s.status })),
    });
  
  } catch (error: any) {
    console.error("Error fetching tracking data:", error);
    return NextResponse.json(generateDemoTrackingData(tripId));
  }
}

function generateDemoTrackingData(tripId: string, tripNumber?: string) {
  const baseLat = 43.6532; const baseLng = -79.3832;
  const deliveryLat = baseLat + 0.015; const deliveryLng = baseLng + 0.02;
  const homeBaseLat = baseLat - 0.02; const homeBaseLng = baseLng - 0.025;
  
  const breadcrumbs = [];
  for (let i = 14; i >= 0; i--) {
    breadcrumbs.push({ lat: baseLat + 0.002 + (i * 0.0003), lng: baseLng - 0.003 - (i * 0.0004),
      timestamp: new Date(Date.now() - i * 60000).toISOString(), speed: 35 + Math.random() * 20 });
  }
  
  const homeBase = { lat: homeBaseLat, lng: homeBaseLng };
  const routePath = [
    homeBase,
    { lat: baseLat, lng: baseLng }, // pickup
    { lat: deliveryLat, lng: deliveryLng }, // delivery
  ];
  
  return {
    tripId, tripNumber: tripNumber || "DEMO-001", status: "In Transit",
    driver: { id: null, name: "Demo Driver", phone: null }, unit: { id: null, number: "DEMO-100" },
    currentPosition: { lat: baseLat + 0.002, lng: baseLng - 0.003, status: "moving", speed: 45,
      heading: 225, lastPingTime: new Date().toISOString(), hosRemaining: 7.5, eldConnected: true },
    breadcrumbs,
    homeBase,
    routePath,
    geofences: [
      { id: "geofence-pickup-demo", name: "Pickup Location", type: "pickup",
        coordinates: generateGeofencePolygon({ lat: baseLat, lng: baseLng }, 100),
        bufferZone: generateHysteresisZone({ lat: baseLat, lng: baseLng }, 100, 30) },
      { id: "geofence-delivery-demo", name: "Delivery Location", type: "delivery",
        coordinates: generateGeofencePolygon({ lat: deliveryLat, lng: deliveryLng }, 100),
        bufferZone: generateHysteresisZone({ lat: deliveryLat, lng: deliveryLng }, 100, 30) },
    ],
    stops: [],
  };
}

function generateGeofencePolygon(center: { lat: number; lng: number }, radiusMeters: number = 100) {
  const coords: Array<{ lat: number; lng: number }> = []; const earthRadius = 6371000; const points = 6;
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const variance = 0.85 + (Math.sin(angle * 3) + 1) * 0.15; const r = radiusMeters * variance;
    const dLat = (r * Math.cos(angle)) / earthRadius * (180 / Math.PI);
    const dLng = (r * Math.sin(angle)) / (earthRadius * Math.cos(center.lat * Math.PI / 180)) * (180 / Math.PI);
    coords.push({ lat: center.lat + dLat, lng: center.lng + dLng });
  }
  return coords;
}

function generateHysteresisZone(center: { lat: number; lng: number }, innerRadius: number = 100, bufferMeters: number = 30) {
  return generateGeofencePolygon(center, innerRadius + bufferMeters);
}
