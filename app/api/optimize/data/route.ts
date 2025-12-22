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
          o.customer_id,
          o.weight_lbs,
          o.volume_cuft
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

      // Fetch available units/drivers with capacity limits
      const unitsQuery = `
        SELECT 
          u.unit_id,
          u.unit_number,
          u.max_weight_lbs,
          u.max_volume_cuft,
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
          o.customer_id,
          o.weight_lbs,
          o.volume_cuft
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
      const stopLocationMap: Record<string, { pickup: string; delivery: string; customer: string }> = {};

      validTrips.forEach((trip, tripIdx) => {
        const pickupIndex = stops.length;
        const tripIdShort = trip.id.slice(0, 8);
        
        // Use actual weight from order, or default to reasonable amount (in lbs)
        // Normalize to a scale where 45000 lbs (full truckload) = 45 capacity units
        const weightLbs = trip.weight_lbs || 15000; // Default ~15k lbs if missing
        const volumeCuft = trip.volume_cuft || 1000; // Default ~1000 cuft if missing
        
        // Calculate demand based on weight (primary) and volume (secondary)
        // Scale: 1000 lbs = 1 capacity unit, so 45000 lbs = 45 units
        const weightDemand = Math.ceil(weightLbs / 1000);
        const volumeDemand = Math.ceil(volumeCuft / 100);
        const demand = Math.max(weightDemand, volumeDemand); // Use the limiting factor
        
        // Helper to extract city from full address
        const extractCity = (addr: string) => {
          if (!addr) return 'Unknown';
          const parts = addr.split(',').map(p => p.trim());
          // Try to get city, state format (e.g., "Columbus, OH" or "Milwaukee, WI")
          if (parts.length >= 2) {
            return `${parts[parts.length - 3] || parts[0]}, ${parts[parts.length - 2]}`;
          }
          return parts[0] || 'Unknown';
        };

        const pickupCity = extractCity(trip.pickup_location);
        const deliveryCity = extractCity(trip.dropoff_location);
        
        // Store location mapping for display
        stopLocationMap[`pickup-${tripIdShort}`] = {
          pickup: pickupCity,
          delivery: deliveryCity,
          customer: trip.customer_id || 'Unknown'
        };
        stopLocationMap[`delivery-${tripIdShort}`] = {
          pickup: pickupCity,
          delivery: deliveryCity,
          customer: trip.customer_id || 'Unknown'
        };
        
        // Pickup stop (adds load to vehicle)
        stops.push({
          id: `pickup-${tripIdShort}`,
          tripId: trip.id,
          orderId: trip.order_id,
          stop_type: 'pickup',
          location: trip.pickup_location,
          pickupCity,
          deliveryCity,
          latitude: parseFloat(trip.pickup_lat),
          longitude: parseFloat(trip.pickup_lng),
          demand: demand, // Positive: picking up load (based on actual weight/volume)
          weight_lbs: weightLbs,
          volume_cuft: volumeCuft,
          customer: trip.customer_id || 'Unknown',
        });

        const deliveryIndex = stops.length;

        // Delivery stop (removes load from vehicle)
        stops.push({
          id: `delivery-${tripIdShort}`,
          tripId: trip.id,
          orderId: trip.order_id,
          stop_type: 'delivery',
          location: trip.dropoff_location,
          pickupCity,
          deliveryCity,
          latitude: parseFloat(trip.dropoff_lat),
          longitude: parseFloat(trip.dropoff_lng),
          demand: -demand, // Negative: delivering/dropping load
          weight_lbs: weightLbs,
          volume_cuft: volumeCuft,
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
      // Use real capacity limits from unit_profiles (scaled to match demand)
      const vehicles = unitsResult.rows.map(unit => ({
        id: unit.unit_id,
        unitNumber: unit.unit_number,
        driverId: unit.driver_id,
        driverName: unit.driver_name || 'Unassigned',
        driverType: unit.driver_type || 'Company',
        region: unit.region || 'Unknown',
        // Scale capacity to match demand units: 45000 lbs max = 45 capacity units
        capacity_limit: Math.ceil((unit.max_weight_lbs || 45000) / 1000), 
        max_weight_lbs: unit.max_weight_lbs || 45000,
        max_volume_cuft: unit.max_volume_cuft || 3000,
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
        stopLocationMap,
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
