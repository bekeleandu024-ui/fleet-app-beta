import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { randomUUID } from 'crypto';

// POST /api/dispatch/trips - Create a trip from draft and assign to resource
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tripId, orderIds, resourceId, resourceType } = body;

    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No orders provided' },
        { status: 400 }
      );
    }

    // Deduplicate order IDs
    const uniqueOrderIds = [...new Set(orderIds as string[])];

    // Generate a shared trip number
    const tripNumber = `TRP-${Date.now().toString(36).toUpperCase()}`;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch order details to populate trip fields
      const ordersResult = await client.query(`
        SELECT 
          id, 
          pickup_location, 
          dropoff_location,
          pickup_time,
          dropoff_time,
          total_weight_lbs,
          quoted_rate
        FROM orders 
        WHERE id = ANY($1)
      `, [uniqueOrderIds]);

      const orders = ordersResult.rows;
      if (orders.length === 0) {
        throw new Error('No orders found');
      }

      // Use first order for primary locations, aggregate totals
      const primaryOrder = orders[0];
      const totalWeight = orders.reduce((sum, o) => sum + (parseFloat(o.total_weight_lbs) || 0), 0);
      const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.quoted_rate) || 0), 0);

      // Create ONE trip for all orders (consolidated shipment)
      const newTripId = randomUUID();

      await client.query(`
        INSERT INTO trips (
          id,
          order_id,
          order_ids,
          trip_number,
          status,
          driver_id,
          pickup_location,
          dropoff_location,
          pickup_window_start,
          delivery_window_start,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3::uuid[], $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `, [
        newTripId,
        primaryOrder.id,  // Use first order as primary (for backwards compatibility)
        uniqueOrderIds,   // All order IDs in the consolidated trip
        tripNumber,
        'ASSIGNED',
        resourceType === 'driver' ? resourceId : null,
        primaryOrder.pickup_location || 'TBD',
        primaryOrder.dropoff_location || 'TBD',
        primaryOrder.pickup_time,
        primaryOrder.dropoff_time,
      ]);

      // Update ALL orders with the same trip assignment
      for (const orderId of uniqueOrderIds) {
        await client.query(`
          UPDATE orders 
          SET 
            dispatch_status = $1,
            assigned_driver_id = $2,
            updated_at = NOW()
          WHERE id = $3
        `, [
          resourceType === 'driver' ? 'FLEET_DISPATCH' : 'BROKERAGE_PENDING',
          resourceType === 'driver' ? resourceId : null,
          orderId,
        ]);
      }

      await client.query('COMMIT');

      return NextResponse.json({ 
        success: true, 
        data: { 
          tripId: newTripId,
          tripNumber,
          orderCount: uniqueOrderIds.length 
        } 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}

// GET /api/dispatch/trips - Fetch all active trips
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.trip_number,
        t.status,
        t.driver_id,
        d.driver_name,
        t.created_at,
        COUNT(o.id) AS order_count,
        SUM(COALESCE(o.total_weight_lbs, 0)) AS total_weight,
        SUM(COALESCE(o.quoted_rate, 0)) AS total_revenue
      FROM trips t
      LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
      LEFT JOIN orders o ON o.trip_id = t.id
      WHERE t.status IN ('ASSIGNED', 'IN_TRANSIT', 'PLANNING')
      GROUP BY t.id, t.trip_number, t.status, t.driver_id, d.driver_name, t.created_at
      ORDER BY t.created_at DESC
    `);

    const trips = result.rows.map(row => ({
      id: row.id,
      tripNumber: row.trip_number,
      status: row.status,
      driverId: row.driver_id,
      driverName: row.driver_name,
      createdAt: row.created_at,
      orderCount: parseInt(row.order_count) || 0,
      totalWeight: parseFloat(row.total_weight) || 0,
      totalRevenue: parseFloat(row.total_revenue) || 0,
    }));

    return NextResponse.json({ success: true, data: trips });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}
