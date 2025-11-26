import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { TripListItem } from "@/lib/types";

// ...existing code...

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  try {
    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          t.*,
          d.driver_name,
          u.unit_number
        FROM trips t
        LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
        LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
      `;
      
      if (statusFilter === "closed") {
        query += ` WHERE t.status = 'closed'`;
      } else {
        query += ` WHERE t.status != 'closed' OR t.status IS NULL`;
      }
      
      query += ` ORDER BY t.created_at DESC`;

      console.log(`Fetching trips with statusFilter: ${statusFilter}`);

      const result = await client.query(query);
      
      console.log(`Found ${result.rows.length} trips`);

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
    closed: "Closed",
  };

  const driverName = row.driver_name || "Unknown Driver";
  const unitName = row.unit_number || "N/A";
  
  // Helper to safely convert date to ISO string
  const toISO = (date: any) => date ? new Date(date).toISOString() : new Date().toISOString();
  
  const eta = toISO(row.completed_at || row.planned_start);
  const duration = row.planned_miles ? Math.round((row.planned_miles / 50) * 10) / 10 : undefined;

  return {
    id: row.id,
    tripNumber: row.id.slice(0, 8).toUpperCase(),
    driver: driverName,
    unit: unitName,
    pickup: row.pickup_location || "Unknown",
    delivery: row.dropoff_location || "Unknown",
    eta,
    status: statusMap[row.status?.toLowerCase()] || row.status || "Unknown",
    exceptions: 0,
    lastPing: toISO(row.updated_at || row.created_at),
    orderId: row.order_id,
    driverId: row.driver_id,
    customer: "CORVEX", 
    pickupWindow: row.pickup_window_start ? new Date(row.pickup_window_start).toLocaleString() : undefined,
    distance: Number(row.planned_miles) || 0,
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


