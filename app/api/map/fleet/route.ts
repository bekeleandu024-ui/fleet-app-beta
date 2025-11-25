import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          t.id,
          t.driver_id,
          t.unit_id,
          t.status,
          t.last_known_lat,
          t.last_known_lng,
          t.updated_at,
          t.pickup_location,
          t.dropoff_location,
          t.dropoff_lat,
          t.dropoff_lng,
          d.driver_name,
          u.unit_number
        FROM trips t
        LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
        LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
        WHERE t.status IN ('planned', 'planning', 'assigned', 'in_transit', 'en_route_to_pickup', 'at_pickup', 'departed_pickup', 'at_delivery')
      `;
      const result = await client.query(query);
      
      const fleetData = result.rows.map(row => ({
        id: row.id,
        driverId: row.driver_id,
        unitId: row.unit_id,
        status: row.status,
        location: row.pickup_location, 
        lat: row.last_known_lat,
        lng: row.last_known_lng,
        deliveryLocation: row.dropoff_location,
        deliveryLat: row.dropoff_lat,
        deliveryLng: row.dropoff_lng,
        lastUpdate: row.updated_at,
        driverName: row.driver_name || "Unknown Driver",
        unitNumber: row.unit_number || "N/A",
        speed: 0,
      }));

      return NextResponse.json({ fleet: fleetData });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching fleet data:", error);
    return NextResponse.json({ error: "Failed to fetch fleet data" }, { status: 500 });
  }
}
