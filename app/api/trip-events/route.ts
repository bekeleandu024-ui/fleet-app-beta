import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// GET /api/trip-events?tripId=xxx - Fetch events for a trip
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get("tripId");
  const driver = searchParams.get("driver");
  const unit = searchParams.get("unit");
  const eventType = searchParams.get("eventType");
  const tripStatus = searchParams.get("tripStatus");

  try {
    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          te.*,
          t.status as trip_status,
          d.driver_name,
          u.unit_number
        FROM trip_events te
        JOIN trips t ON te.trip_id = t.id
        LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
        LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
        WHERE 1=1
      `;
      const params = [];
      if (tripId) {
        params.push(tripId);
        query += ` AND te.trip_id = $${params.length}`;
      }
      if (eventType) {
        params.push(eventType);
        query += ` AND te.event_type = $${params.length}`;
      }
      if (driver) {
        params.push(`%${driver}%`);
        query += ` AND d.driver_name ILIKE $${params.length}`;
      }
      if (unit) {
        params.push(`%${unit}%`);
        query += ` AND u.unit_number ILIKE $${params.length}`;
      }
      if (tripStatus === "active") {
        query += ` AND (t.status NOT IN ('closed', 'completed') OR t.status IS NULL)`;
      } else if (tripStatus === "closed") {
        query += ` AND t.status IN ('closed', 'completed')`;
      }

      query += ` ORDER BY te.occurred_at DESC LIMIT 100`;

      const result = await client.query(query, params);
      
      const events = result.rows.map(row => ({
        id: row.id,
        tripId: row.trip_id,
        eventType: row.event_type,
        timestamp: row.occurred_at,
        eventLabel: row.payload?.eventLabel || row.payload?.stopLabel || row.event_type,
        stopLabel: row.payload?.stopLabel || row.event_type,
        location: row.payload?.location,
        notes: row.payload?.notes,
        lat: row.payload?.lat,
        lon: row.payload?.lon,
        trip: {
          id: row.trip_id,
          driver: row.driver_name || "Unknown",
          unit: row.unit_number || "N/A",
          status: row.trip_status
        }
      }));

      return NextResponse.json({ events });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching trip events:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, eventType, eventLabel, location, coordinates, notes, actor, actorType } = body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert event
      const insertEventQuery = `
        INSERT INTO trip_events (id, trip_id, event_type, status, source, payload, occurred_at, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `;
      
      const payload = { 
        eventLabel, 
        location, 
        lat: coordinates?.lat, 
        lon: coordinates?.lon, 
        notes,
        actor,
        actorType
      };

      const eventResult = await client.query(insertEventQuery, [
        tripId, 
        eventType, 
        'COMPLETED', 
        'DISPATCHER_CONSOLE', 
        JSON.stringify(payload)
      ]);

      // Update trip status based on event
      let newStatus = null;
      if (eventType === 'TRIP_START') newStatus = 'in_transit';
      else if (eventType === 'TRIP_FINISHED') newStatus = 'completed';
      else if (eventType === 'ARRIVED_PICKUP') newStatus = 'at_pickup';
      else if (eventType === 'LEFT_PICKUP') newStatus = 'in_transit';
      else if (eventType === 'ARRIVED_DELIVERY') newStatus = 'at_delivery';
      else if (eventType === 'LEFT_DELIVERY') newStatus = 'completed'; 

      if (newStatus) {
        const tripUpdateRes = await client.query(
          `UPDATE trips SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING order_id`, 
          [newStatus, tripId]
        );

        // Sync status to Order
        if (tripUpdateRes.rows.length > 0) {
          const orderId = tripUpdateRes.rows[0].order_id;
          if (orderId) {
            let orderStatus = null;
            if (newStatus === 'in_transit') orderStatus = 'In Transit';
            else if (newStatus === 'completed') orderStatus = 'Delivered';
            else if (newStatus === 'at_pickup') orderStatus = 'In Transit';
            else if (newStatus === 'at_delivery') orderStatus = 'In Transit';

            if (orderStatus) {
              await client.query(
                `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`, 
                [orderStatus, orderId]
              );
            }
          }
        }
      }
      
      // Update specific timestamps
      if (eventType === 'TRIP_START') await client.query(`UPDATE trips SET actual_start = NOW() WHERE id = $1`, [tripId]);
      if (eventType === 'ARRIVED_PICKUP') await client.query(`UPDATE trips SET pickup_arrival = NOW() WHERE id = $1`, [tripId]);
      if (eventType === 'LEFT_PICKUP') await client.query(`UPDATE trips SET pickup_departure = NOW() WHERE id = $1`, [tripId]);
      if (eventType === 'ARRIVED_DELIVERY') await client.query(`UPDATE trips SET delivery_arrival = NOW() WHERE id = $1`, [tripId]);
      if (eventType === 'LEFT_DELIVERY') await client.query(`UPDATE trips SET delivery_departure = NOW() WHERE id = $1`, [tripId]);
      if (eventType === 'TRIP_FINISHED') await client.query(`UPDATE trips SET completed_at = NOW() WHERE id = $1`, [tripId]);

      if (coordinates?.lat && coordinates?.lon) {
        await client.query(`UPDATE trips SET last_known_lat = $1, last_known_lng = $2, last_ping_at = NOW() WHERE id = $3`, [coordinates.lat, coordinates.lon, tripId]);
      }

      await client.query('COMMIT');
      
      return NextResponse.json({ success: true, data: eventResult.rows[0] });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error creating trip event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create event" },
      { status: error.status || 500 }
    );
  }
}

