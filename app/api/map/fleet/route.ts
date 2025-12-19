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
          u.region,
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

      const stagedQuery = `
        SELECT 
          u.unit_id,
          u.unit_number,
          u.region,
          u.max_weight,
          d.driver_name,
          d.driver_id,
          last_trip.dropoff_lat,
          last_trip.dropoff_lng,
          last_trip.dropoff_location,
          last_trip.completed_at
        FROM unit_profiles u
        LEFT JOIN driver_profiles d ON u.driver_id = d.driver_id
        LEFT JOIN LATERAL (
          SELECT dropoff_lat, dropoff_lng, dropoff_location, completed_at
          FROM trips t
          WHERE t.unit_id = u.unit_id AND t.status = 'completed'
          ORDER BY t.completed_at DESC
          LIMIT 1
        ) last_trip ON true
        WHERE u.is_active = true
        AND u.unit_id NOT IN (
          SELECT unit_id FROM trips WHERE status IN ('planned', 'planning', 'assigned', 'in_transit', 'en_route_to_pickup', 'at_pickup', 'departed_pickup', 'at_delivery') AND unit_id IS NOT NULL
        )
      `;
      const stagedResult = await client.query(stagedQuery);
      
      const activeFleetData = result.rows.map(row => ({
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
        region: row.region,
        customs: {
          status: row.customs_status || 'Pending',
          crossingPoint: row.border_crossing_point,
          requiredDocs: row.required_documents || [],
          submittedDocs: row.submitted_documents || [],
          isApproved: !!row.approved_at
        }
      }));

      const stagedFleetData = stagedResult.rows.map(row => ({
        id: row.unit_id,
        driverId: row.driver_id,
        unitId: row.unit_id,
        status: 'staged',
        location: row.dropoff_location || row.region || "Unknown",
        lat: row.dropoff_lat || 0,
        lng: row.dropoff_lng || 0,
        deliveryLocation: null,
        deliveryLat: null,
        deliveryLng: null,
        lastUpdate: row.completed_at,
        driverName: row.driver_name || "Unassigned",
        unitNumber: row.unit_number,
        currentWeight: 0,
        maxWeight: row.max_weight ? parseFloat(row.max_weight) : 45000,
        utilizationPercent: 0,
        limitingFactor: null,
        speed: 0,
        region: row.region,
        customs: null
      }));

      return NextResponse.json({ fleet: [...activeFleetData, ...stagedFleetData] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching fleet data:", error);
    return NextResponse.json({ error: "Failed to fetch fleet data" }, { status: 500 });
  }
}
