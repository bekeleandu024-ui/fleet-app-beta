import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Geocode customer locations (Ontario + common destinations)
const locationCoords: Record<string, { lat: number; lng: number }> = {
  // Ontario
  'Guelph': { lat: 43.5448, lng: -80.2482 },
  'Kitchener': { lat: 43.4516, lng: -80.4925 },
  'Milton': { lat: 43.5183, lng: -79.8774 },
  'Brampton': { lat: 43.7315, lng: -79.7624 },
  'Markham': { lat: 43.8561, lng: -79.3370 },
  'Burlington': { lat: 43.3255, lng: -79.7990 },
  'Vaughan': { lat: 43.8361, lng: -79.4983 },
  'Toronto': { lat: 43.6532, lng: -79.3832 },
  'Mississauga': { lat: 43.5890, lng: -79.6441 },
  'Hamilton': { lat: 43.2557, lng: -79.8711 },
  'London': { lat: 42.9849, lng: -81.2453 },
  'Ottawa': { lat: 45.4215, lng: -75.6972 },
  'Windsor': { lat: 42.3149, lng: -83.0364 },
  'Cambridge': { lat: 43.3616, lng: -80.3144 },
  // Michigan
  'Detroit': { lat: 42.3314, lng: -83.0458 },
  // New York
  'Buffalo': { lat: 42.8864, lng: -78.8784 },
  // Ohio
  'Cleveland': { lat: 41.4993, lng: -81.6944 },
  // Illinois
  'Chicago': { lat: 41.8781, lng: -87.6298 },
  // Quebec
  'Montreal': { lat: 45.5017, lng: -73.5673 },
};

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      // 1. Get units at their current locations (from customers table)
      const unitsQuery = `
        SELECT 
          u.unit_id,
          u.unit_number,
          u.current_configuration,
          u.avg_fuel_consumption,
          u.current_location_id,
          c.customer_name as location_name,
          c.full_address as location_address,
          c.city as location_city,
          d.driver_id,
          d.driver_name,
          d.driver_category,
          d.current_status as driver_status,
          d.hos_hours_remaining,
          t.trailer_id as attached_trailer_id,
          t.unit_number as attached_trailer_number,
          t.type as attached_trailer_type
        FROM unit_profiles u
        LEFT JOIN customers c ON u.current_location_id = c.customer_id
        LEFT JOIN driver_profiles d ON u.unit_number = d.unit_number
        LEFT JOIN trailers t ON u.current_trailer_id = t.trailer_id
        WHERE u.is_active = true
      `;
      const unitsResult = await client.query(unitsQuery);

      // 2. Get trailers at their current locations
      const trailersQuery = `
        SELECT 
          t.trailer_id,
          t.unit_number as trailer_number,
          t.type as trailer_type,
          t.status as trailer_status,
          t.current_location_id,
          t.attached_unit_id,
          c.customer_name as location_name,
          c.full_address as location_address,
          c.city as location_city,
          u.unit_number as attached_to_unit
        FROM trailers t
        LEFT JOIN customers c ON t.current_location_id = c.customer_id
        LEFT JOIN unit_profiles u ON t.attached_unit_id = u.unit_id
      `;
      const trailersResult = await client.query(trailersQuery);

      // 3. Get customer facilities (for showing on map)
      const customersQuery = `
        SELECT 
          customer_id,
          customer_name,
          full_address,
          city,
          has_trailer_pool,
          pool_count_empty
        FROM customers
        ORDER BY customer_name
      `;
      const customersResult = await client.query(customersQuery);

      // 4. Get active trips (all non-closed/completed trips from the trip board)
      const activeTripsQuery = `
        SELECT 
          t.id as trip_id,
          t.trip_number,
          t.driver_id,
          t.unit_id,
          t.status,
          t.last_known_lat,
          t.last_known_lng,
          t.pickup_location,
          t.pickup_lat,
          t.pickup_lng,
          t.dropoff_location,
          t.dropoff_lat,
          t.dropoff_lng,
          t.updated_at,
          t.customer_name,
          t.planned_miles,
          d.driver_name,
          u.unit_number
        FROM trips t
        LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
        LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
        WHERE LOWER(COALESCE(t.status, '')) NOT IN ('closed', 'completed', 'cancelled')
      `;
      const activeTripsResult = await client.query(activeTripsQuery);

      // Build fleet data for units at yards/customer locations
      const unitsOnMap = unitsResult.rows.map((row, index) => {
        const cityCoords = locationCoords[row.location_city] || { lat: 43.5448, lng: -80.2482 };
        // Add small offset so markers don't overlap at same location
        const offset = 0.005 * (index % 10);
        const angleOffset = (index * 36) * (Math.PI / 180);
        
        return {
          id: row.unit_id,
          type: 'staged',
          status: row.driver_status || 'Available',
          unitNumber: row.unit_number,
          driverName: row.driver_name || 'Unassigned',
          driverId: row.driver_id,
          driverCategory: row.driver_category,
          hosHoursRemaining: parseFloat(row.hos_hours_remaining) || 11,
          configuration: row.current_configuration,
          fuelConsumption: parseFloat(row.avg_fuel_consumption) || 6.5,
          location: row.location_name || 'Home Base - Guelph - Main Yard',
          locationAddress: row.location_address,
          locationCity: row.location_city || 'Guelph',
          lat: cityCoords.lat + (offset * Math.cos(angleOffset)),
          lng: cityCoords.lng + (offset * Math.sin(angleOffset)),
          deliveryLocation: null,
          deliveryLat: null,
          deliveryLng: null,
          attachedTrailer: row.attached_trailer_id ? {
            id: row.attached_trailer_id,
            number: row.attached_trailer_number,
            type: row.attached_trailer_type
          } : null
        };
      });

      // Build active trips data - map statuses to display values
      const statusMap: Record<string, string> = {
        planned: "Assigned",
        assigned: "Assigned",
        in_transit: "In Transit",
        en_route_to_pickup: "In Transit",
        at_pickup: "At Pickup",
        departed_pickup: "In Transit",
        at_delivery: "At Delivery",
        delivered: "Delivered",
        brokerage_pending: "Pending Farm Out",
        posted_external: "Posted to Carriers",
        covered_external: "Covered (External)",
      };

      // Helper function to extract city from location string
      const extractCity = (location: string | null): string => {
        if (!location) return '';
        // Handle formats like "Guelph, ON" or "Toronto, Ontario"
        const parts = location.split(',');
        if (parts.length > 0) {
          return parts[0].trim();
        }
        return location.trim();
      };

      const activeTrips = activeTripsResult.rows.map((row, index) => {
        const displayStatus = statusMap[row.status?.toLowerCase()] || row.status || "Assigned";
        
        // Get coordinates from DB or fallback to geocoding by city name
        let lat = row.last_known_lat || row.pickup_lat;
        let lng = row.last_known_lng || row.pickup_lng;
        
        // If no coordinates, try to geocode from pickup location
        if (!lat || !lng) {
          const city = extractCity(row.pickup_location);
          const cityCoords = locationCoords[city];
          if (cityCoords) {
            // Add small offset so markers don't overlap
            const offset = 0.005 * (index % 10);
            const angleOffset = (index * 36) * (Math.PI / 180);
            lat = cityCoords.lat + (offset * Math.cos(angleOffset));
            lng = cityCoords.lng + (offset * Math.sin(angleOffset));
          } else {
            // Default to Guelph if no match
            lat = 43.5448;
            lng = -80.2482;
          }
        }
        
        return {
          id: row.trip_id,
          type: 'trip',
          status: displayStatus,
          tripNumber: row.trip_number || row.trip_id?.slice(0, 8)?.toUpperCase(),
          unitNumber: row.unit_number,
          driverName: row.driver_name || 'Unassigned',
          customer: row.customer_name,
          distance: row.planned_miles,
          lat,
          lng,
          location: row.pickup_location,
          locationCity: extractCity(row.pickup_location),
          deliveryLocation: row.dropoff_location,
          deliveryLat: row.dropoff_lat,
          deliveryLng: row.dropoff_lng,
          lastUpdate: row.updated_at,
        };
      });

      // Filter out units that are on active trips
      const activeUnitIds = new Set(activeTripsResult.rows.map(r => r.unit_id));
      const stagedUnits = unitsOnMap.filter(u => !activeUnitIds.has(u.id));

      // Build trailers data (only unattached trailers)
      const trailersOnMap = trailersResult.rows
        .filter(row => !row.attached_unit_id)
        .map((row, index) => {
          const cityCoords = locationCoords[row.location_city] || { lat: 43.5448, lng: -80.2482 };
          const offset = 0.003 * (index % 10);
          const angleOffset = ((index * 36) + 18) * (Math.PI / 180);
          
          return {
            id: row.trailer_id,
            type: 'trailer',
            status: row.trailer_status,
            trailerNumber: row.trailer_number,
            trailerType: row.trailer_type,
            location: row.location_name || 'Unknown',
            locationCity: row.location_city,
            lat: cityCoords.lat + (offset * Math.cos(angleOffset)),
            lng: cityCoords.lng + (offset * Math.sin(angleOffset)),
          };
        });

      // Build facilities data
      const facilities = customersResult.rows.map(row => {
        const cityCoords = locationCoords[row.city] || { lat: 43.5448, lng: -80.2482 };
        
        return {
          id: row.customer_id,
          type: 'facility',
          name: row.customer_name,
          address: row.full_address,
          city: row.city,
          hasTrailerPool: row.has_trailer_pool,
          poolCountEmpty: row.pool_count_empty,
          lat: cityCoords.lat,
          lng: cityCoords.lng,
        };
      });

      return NextResponse.json({ 
        fleet: [...activeTrips, ...stagedUnits],
        trailers: trailersOnMap,
        facilities: facilities,
        summary: {
          totalUnits: unitsResult.rows.length,
          activeTrips: activeTripsResult.rows.length,
          stagedUnits: stagedUnits.length,
          totalTrailers: trailersResult.rows.length,
          availableTrailers: trailersResult.rows.filter(t => t.trailer_status === 'Available').length,
          totalFacilities: customersResult.rows.length,
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching fleet data:", error);
    return NextResponse.json({ error: "Failed to fetch fleet data" }, { status: 500 });
  }
}
