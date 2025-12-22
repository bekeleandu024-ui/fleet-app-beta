import { NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * GET /api/optimize/data
 * Fetches pending/active trips with coordinates and available units for optimization
 */
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      // Fetch trips that have coordinates (any status except closed/completed)
      // Also include trips with location names that we can potentially geocode
      const tripsQuery = `
        SELECT 
          t.id,
          t.order_id,
          t.pickup_location,
          t.dropoff_location,
          t.pickup_lat,
          t.pickup_lng,
          t.dropoff_lat,
          t.dropoff_lng,
          t.status,
          t.driver_id,
          t.unit_id,
          o.customer_id
        FROM trips t
        LEFT JOIN orders o ON t.order_id = o.id
        WHERE t.status NOT IN ('completed', 'closed', 'cancelled')
          AND (
            -- Has full coordinates
            (t.pickup_lat IS NOT NULL AND t.pickup_lng IS NOT NULL 
             AND t.dropoff_lat IS NOT NULL AND t.dropoff_lng IS NOT NULL)
            OR
            -- Or has location names (can be geocoded)
            (t.pickup_location IS NOT NULL AND t.dropoff_location IS NOT NULL)
          )
        ORDER BY t.created_at DESC
        LIMIT 50
      `;

      const tripsResult = await client.query(tripsQuery);

      // Fetch available units/drivers
      const unitsQuery = `
        SELECT 
          u.unit_id,
          u.unit_number,
          d.driver_id,
          d.driver_name,
          d.driver_type,
          d.region
        FROM unit_profiles u
        LEFT JOIN driver_profiles d ON u.driver_id = d.driver_id
        WHERE u.is_active = true
        ORDER BY u.unit_number
      `;

      const unitsResult = await client.query(unitsQuery);

      // Also fetch trips that are unassigned (for optimization candidates)
      const unassignedTripsQuery = `
        SELECT 
          t.id,
          t.order_id,
          t.pickup_location,
          t.dropoff_location,
          t.pickup_lat,
          t.pickup_lng,
          t.dropoff_lat,
          t.dropoff_lng,
          t.status,
          o.customer_id
        FROM trips t
        LEFT JOIN orders o ON t.order_id = o.id
        WHERE (t.driver_id IS NULL OR t.unit_id IS NULL)
          AND t.status NOT IN ('completed', 'closed', 'cancelled')
          AND t.pickup_lat IS NOT NULL 
          AND t.pickup_lng IS NOT NULL
          AND t.dropoff_lat IS NOT NULL 
          AND t.dropoff_lng IS NOT NULL
        ORDER BY t.created_at DESC
        LIMIT 50
      `;

      const unassignedResult = await client.query(unassignedTripsQuery);

      // Transform trips into stops format for optimizer
      // Include BOTH pickup and delivery as separate stops for pickup-delivery optimization
      const validTrips = tripsResult.rows.filter(
        trip => trip.pickup_lat && trip.pickup_lng && trip.dropoff_lat && trip.dropoff_lng
      );

      // Create paired stops: pickup (demand +1) and delivery (demand -1)
      const stops: any[] = [];
      const pickupDeliveryPairs: { pickup_index: number; delivery_index: number }[] = [];

      validTrips.forEach((trip, tripIdx) => {
        const pickupIndex = stops.length;
        
        // Pickup stop (adds load to vehicle)
        stops.push({
          id: `pickup-${trip.id.slice(0, 8)}`,
          tripId: trip.id,
          orderId: trip.order_id,
          stop_type: 'pickup',
          location: trip.pickup_location,
          latitude: parseFloat(trip.pickup_lat),
          longitude: parseFloat(trip.pickup_lng),
          demand: 1, // Positive: picking up load
          customer: trip.customer_id || 'Unknown',
        });

        const deliveryIndex = stops.length;

        // Delivery stop (removes load from vehicle)
        stops.push({
          id: `delivery-${trip.id.slice(0, 8)}`,
          tripId: trip.id,
          orderId: trip.order_id,
          stop_type: 'delivery',
          location: trip.dropoff_location,
          latitude: parseFloat(trip.dropoff_lat),
          longitude: parseFloat(trip.dropoff_lng),
          demand: -1, // Negative: delivering/dropping load
          customer: trip.customer_id || 'Unknown',
        });

        // Record the pairing for optimizer constraints
        pickupDeliveryPairs.push({
          pickup_index: pickupIndex,
          delivery_index: deliveryIndex,
        });
      });

      // Also provide trips without coordinates (for info/geocoding)
      const tripsNeedingCoords = tripsResult.rows
        .filter(trip => !trip.pickup_lat || !trip.pickup_lng || !trip.dropoff_lat || !trip.dropoff_lng)
        .map(trip => ({
          id: trip.id,
          pickupLocation: trip.pickup_location,
          dropoffLocation: trip.dropoff_location,
          hasPickupCoords: !!(trip.pickup_lat && trip.pickup_lng),
          hasDropoffCoords: !!(trip.dropoff_lat && trip.dropoff_lng),
        }));

      // Transform units into vehicles format for optimizer  
      // Set capacity to 2 to allow each vehicle to handle ~2 trips at a time
      const vehicles = unitsResult.rows.map(unit => ({
        id: unit.unit_id,
        unitNumber: unit.unit_number,
        driverId: unit.driver_id,
        driverName: unit.driver_name || 'Unassigned',
        driverType: unit.driver_type || 'Company',
        region: unit.region || 'Unknown',
        capacity_limit: 2, // Each vehicle can carry up to 2 loads simultaneously
      }));

      // Calculate a sensible depot location (centroid of all pickup stops, or default)
      let depot = { latitude: 43.6532, longitude: -79.3832 }; // Default: Toronto
      const pickupStops = stops.filter(s => s.stop_type === 'pickup');
      if (pickupStops.length > 0) {
        const avgLat = pickupStops.reduce((sum, s) => sum + s.latitude, 0) / pickupStops.length;
        const avgLng = pickupStops.reduce((sum, s) => sum + s.longitude, 0) / pickupStops.length;
        depot = { latitude: avgLat, longitude: avgLng };
      }

      return NextResponse.json({
        stops,
        vehicles,
        depot,
        pickupDeliveryPairs,
        tripsNeedingCoords,
        unassignedTrips: unassignedResult.rows.length,
        totalTrips: tripsResult.rows.length,
        tripsWithCoords: validTrips.length,
        totalStops: stops.length,
        availableVehicles: vehicles.length,
        hasData: stops.length > 0 && vehicles.length > 0,
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching optimization data:", error);
    return NextResponse.json(
      { error: "Failed to fetch optimization data" },
      { status: 500 }
    );
  }
}
