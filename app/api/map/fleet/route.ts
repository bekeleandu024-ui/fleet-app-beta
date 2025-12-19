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
          t.pickup_lat,
          t.pickup_lng,
          t.dropoff_location,
          t.dropoff_lat,
          t.dropoff_lng,
          t.current_weight,
          t.utilization_percent,
          t.limiting_factor,
          d.driver_name,
          u.unit_number,
          u.max_weight,
          cc.status as customs_status,
          cc.border_crossing_point,
          cc.required_documents,
          cc.submitted_documents,
          cc.approved_at
        FROM trips t
        LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
        LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
        LEFT JOIN customs_clearances cc ON t.id = cc.trip_id
        WHERE t.status IN ('planned', 'planning', 'assigned', 'in_transit', 'en_route_to_pickup', 'at_pickup', 'departed_pickup', 'at_delivery')
      `;
      const result = await client.query(query);
      
      const fleetData = result.rows.map(row => ({
        id: row.id,
        driverId: row.driver_id,
        unitId: row.unit_id,
        status: row.status,
        location: row.pickup_location, 
        lat: row.last_known_lat || row.pickup_lat,
        lng: row.last_known_lng || row.pickup_lng,
        deliveryLocation: row.dropoff_location,
        deliveryLat: row.dropoff_lat,
        deliveryLng: row.dropoff_lng,
        lastUpdate: row.updated_at,
        driverName: row.driver_name || "Unknown Driver",
        unitNumber: row.unit_number || "N/A",
        currentWeight: row.current_weight ? parseFloat(row.current_weight) : 0,
        maxWeight: row.max_weight ? parseFloat(row.max_weight) : 45000,
        utilizationPercent: row.utilization_percent ? parseFloat(row.utilization_percent) : 0,
        limitingFactor: row.limiting_factor,
        speed: 0,
        customs: {
          status: row.customs_status || 'Pending',
          crossingPoint: row.border_crossing_point,
          requiredDocs: row.required_documents || [],
          submittedDocs: row.submitted_documents || [],
          isApproved: !!row.approved_at
        }
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
