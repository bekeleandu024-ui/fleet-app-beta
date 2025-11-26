import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { eventType, stopLabel, notes, lat, lon } = body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert event
      const insertEventQuery = `
        INSERT INTO trip_events (id, trip_id, event_type, status, source, payload, occurred_at, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `;
      const payload = { stopLabel, notes, lat, lon };
      const eventResult = await client.query(insertEventQuery, [
        id, 
        eventType, 
        'COMPLETED', 
        'DRIVER_APP', 
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
          [newStatus, id]
        );

        // Sync status to Order
        if (tripUpdateRes.rows.length > 0) {
          const orderId = tripUpdateRes.rows[0].order_id;
          if (orderId) {
            let orderStatus = null;
            // Map trip status to order status
            if (newStatus === 'in_transit') orderStatus = 'In Transit';
            else if (newStatus === 'completed') orderStatus = 'Delivered';
            else if (newStatus === 'at_pickup') orderStatus = 'In Transit'; // Once at pickup, it's started
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
      
      // Update specific timestamps and location
      if (eventType === 'TRIP_START') await client.query(`UPDATE trips SET actual_start = NOW() WHERE id = $1`, [id]);
      if (eventType === 'ARRIVED_PICKUP') await client.query(`UPDATE trips SET pickup_arrival = NOW() WHERE id = $1`, [id]);
      if (eventType === 'LEFT_PICKUP') await client.query(`UPDATE trips SET pickup_departure = NOW() WHERE id = $1`, [id]);
      if (eventType === 'ARRIVED_DELIVERY') await client.query(`UPDATE trips SET delivery_arrival = NOW() WHERE id = $1`, [id]);
      if (eventType === 'LEFT_DELIVERY') await client.query(`UPDATE trips SET delivery_departure = NOW() WHERE id = $1`, [id]);
      if (eventType === 'TRIP_FINISHED') await client.query(`UPDATE trips SET completed_at = NOW() WHERE id = $1`, [id]);

      if (lat && lon) {
        await client.query(`UPDATE trips SET last_known_lat = $1, last_known_lng = $2, last_ping_at = NOW() WHERE id = $3`, [lat, lon, id]);
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
