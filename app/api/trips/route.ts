import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { TripListItem } from "@/lib/types";

// ...existing code...

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          t.*,
          d.driver_name,
          u.unit_number
        FROM trips t
        LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
        LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
        ORDER BY t.created_at DESC
      `;
      const result = await client.query(query);
      
      const trips = result.rows.map(transformTripRow);
      return NextResponse.json(buildTripsResponse(trips));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching trips from DB:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips" },
      { status: 500 }
    );
  }
}

function transformTripRow(row: any): TripListItem {
  const statusMap: Record<string, string> = {
    planned: "Assigned",
    assigned: "Assigned",
    in_transit: "In Transit",
    en_route_to_pickup: "In Transit",
    at_pickup: "At Pickup",
    departed_pickup: "In Transit",
    at_delivery: "At Delivery",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const driverName = row.driver_name || "Unknown Driver";
  const unitName = row.unit_number || "N/A";
  const eta = row.completed_at || row.planned_start || new Date().toISOString();
  const duration = row.planned_miles ? Math.round((row.planned_miles / 50) * 10) / 10 : undefined;

  return {
    id: row.id,
    tripNumber: row.id.slice(0, 8).toUpperCase(),
    driver: driverName,
    unit: unitName,
    pickup: row.pickup_location,
    delivery: row.dropoff_location,
    eta,
    status: statusMap[row.status?.toLowerCase()] || row.status || "Unknown",
    exceptions: 0,
    lastPing: row.updated_at,
    orderId: row.order_id,
    driverId: row.driver_id,
    customer: "CORVEX", 
    pickupWindow: row.pickup_window_start ? new Date(row.pickup_window_start).toLocaleString() : undefined,
    distance: row.planned_miles,
    duration: duration,
    latestStartTime: undefined, // Simplified
    commodity: "General",
    driverType: "RNR",
    totalCost: 0, // Simplified
    totalCpm: 0, // Simplified
    serviceLevel: "STANDARD",
  };
}

function buildTripsResponse(trips: TripListItem[]) {
  const active = trips.filter(t => t.status === "In Transit" || t.status === "Assigned").length;
  const late = 0;
  const exception = 0;

  return {
    stats: {
      active,
      late,
      exception,
    },
    filters: {
      statuses: Array.from(new Set(trips.map(t => t.status))).sort(),
      exceptions: ["Weather", "Mechanical", "Customer Hold"],
      dateRanges: ["Today", "48 Hours", "7 Days"],
    },
    data: trips,
  };
}


