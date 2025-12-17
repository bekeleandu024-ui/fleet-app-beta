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
          u.unit_number,
          o.customer_id as customer_name
        FROM trips t
        LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
        LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
        LEFT JOIN orders o ON t.order_id = o.id
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
    customer: row.customer_name || "Unknown Customer", 
    pickupWindow: row.pickup_window_start ? new Date(row.pickup_window_start).toLocaleString() : undefined,
    distance: Number(row.planned_miles) || 0,
    duration: duration,
    commodity: "General",
    driverType: "RNR",
    totalCost: 0, // Simplified
    totalCpm: 0, // Simplified
    serviceLevel: "STANDARD",
    completedAt: (row.completed_at || row.delivery_departure || row.closed_at) 
      ? new Date(row.completed_at || row.delivery_departure || row.closed_at).toISOString() 
      : undefined,
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      orderId, 
      driverId, 
      unitId, 
      miles, 
      stops 
    } = body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Extract locations from stops
      const pickupStop = stops?.find((s: any) => s.stopType === 'Pickup');
      const deliveryStop = stops?.find((s: any) => s.stopType === 'Delivery');
      
      const pickupLocation = pickupStop?.name || "Unknown";
      const dropoffLocation = deliveryStop?.name || "Unknown";
      const plannedStart = pickupStop?.scheduledAt || new Date().toISOString();

      // Create Trip
      const tripRes = await client.query(`
        INSERT INTO trips (
          id,
          order_id,
          driver_id,
          unit_id,
          status,
          pickup_location,
          dropoff_location,
          planned_start,
          planned_miles,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          'assigned',
          $4,
          $5,
          $6,
          $7,
          NOW(),
          NOW()
        ) RETURNING id
      `, [
        orderId,
        driverId,
        unitId,
        pickupLocation,
        dropoffLocation,
        plannedStart,
        miles
      ]);

      const tripId = tripRes.rows[0].id;

      // Insert Stops
      if (stops && stops.length > 0) {
        for (const stop of stops) {
           await client.query(`
            INSERT INTO trip_stops (
              id,
              trip_id,
              sequence,
              type,
              location,
              window_start,
              created_at,
              updated_at
            ) VALUES (
              gen_random_uuid(),
              $1,
              $2,
              $3,
              $4,
              $5,
              NOW(),
              NOW()
            )
           `, [
             tripId,
             stop.sequence,
             stop.stopType,
             stop.name,
             stop.scheduledAt
           ]);
        }
      }

      // Update Order Status
      await client.query(`
        UPDATE orders 
        SET status = 'Planning', updated_at = NOW() 
        WHERE id = $1
      `, [orderId]);

      await client.query('COMMIT');

      return NextResponse.json({ success: true, id: tripId });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating trip:", error);
    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 }
    );
  }
}


