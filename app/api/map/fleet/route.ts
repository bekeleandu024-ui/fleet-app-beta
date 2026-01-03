import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Geocode customer locations (Ontario locations)
const locationCoords: Record<string, { lat: number; lng: number }> = {
  'Guelph': { lat: 43.5448, lng: -80.2482 },
  'Kitchener': { lat: 43.4516, lng: -80.4925 },
  'Milton': { lat: 43.5183, lng: -79.8774 },
  'Brampton': { lat: 43.7315, lng: -79.7624 },
  'Markham': { lat: 43.8561, lng: -79.3370 },
  'Burlington': { lat: 43.3255, lng: -79.7990 },
  'Vaughan': { lat: 43.8361, lng: -79.4983 },
  'Toronto': { lat: 43.6532, lng: -79.3832 },
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
          c.name as location_name,
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
          c.name as location_name,
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
          name,
          full_address,
          city,
          has_trailer_pool,
          pool_count_empty
        FROM customers
        ORDER BY name
      `;
      const customersResult = await client.query(customersQuery);

      // 4. Get active trips (units that are actually in transit)
      const activeTripsQuery = `
        SELECT 
          t.id as trip_id,
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
          d.driver_name,
          u.unit_number
        FROM trips t
        LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
        LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
        WHERE t.status IN ('in_transit', 'en_route_to_pickup', 'at_pickup', 'departed_pickup', 'at_delivery')
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

      // Build active trips data
      const activeTrips = activeTripsResult.rows.map(row => ({
        id: row.trip_id,
        type: 'trip',
        status: row.status,
        unitNumber: row.unit_number,
        driverName: row.driver_name,
        lat: row.last_known_lat || row.pickup_lat || 0,
        lng: row.last_known_lng || row.pickup_lng || 0,
        location: row.pickup_location,
        deliveryLocation: row.dropoff_location,
        deliveryLat: row.dropoff_lat,
        deliveryLng: row.dropoff_lng,
        lastUpdate: row.updated_at,
      }));

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
          name: row.name,
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
