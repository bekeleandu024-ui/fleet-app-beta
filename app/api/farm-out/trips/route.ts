import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/farm-out/trips - Fetch trips that are in brokerage/farm-out status
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      // Fetch trips where orders are in brokerage status
      // A trip is "brokerage" if it has no driver assigned OR if its orders have brokerage dispatch_status
      const result = await client.query(`
        SELECT 
          t.id,
          t.trip_number,
          t.order_id,
          t.order_ids,
          t.status as trip_status,
          t.driver_id,
          t.pickup_location,
          t.dropoff_location,
          t.pickup_window_start,
          t.delivery_window_start,
          t.created_at,
          t.updated_at,
          -- Aggregate order info
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', o.id,
              'orderNumber', o.order_number,
              'customerName', COALESCE(o.customer_name, UPPER(REPLACE(REPLACE(o.customer_id, 'cust-', ''), '-', ' '))),
              'customerId', o.customer_id,
              'pickupLocation', o.pickup_location,
              'dropoffLocation', o.dropoff_location,
              'pickupTime', o.pickup_time,
              'dropoffTime', o.dropoff_time,
              'dispatchStatus', o.dispatch_status,
              'equipmentType', o.equipment_type,
              'totalWeightLbs', COALESCE(o.total_weight_lbs, 0),
              'quotedRate', o.quoted_rate
            ))
            FROM orders o 
            WHERE o.id = ANY(t.order_ids)),
            '[]'::json
          ) as orders,
          -- Calculate totals
          (SELECT COALESCE(SUM(o.quoted_rate), 0) FROM orders o WHERE o.id = ANY(t.order_ids)) as total_rate,
          (SELECT COALESCE(SUM(o.total_weight_lbs), 0) FROM orders o WHERE o.id = ANY(t.order_ids)) as total_weight,
          -- Get bid info for first order (trips share bids across orders)
          (SELECT COUNT(*) FROM carrier_bids cb WHERE cb.order_id = t.order_id AND cb.status = 'PENDING') as bid_count,
          (SELECT MIN(cb.bid_amount) FROM carrier_bids cb WHERE cb.order_id = t.order_id AND cb.status = 'PENDING') as lowest_bid,
          -- Get dispatch status from primary order
          (SELECT o.dispatch_status FROM orders o WHERE o.id = t.order_id) as dispatch_status,
          (SELECT o.posted_to_carriers FROM orders o WHERE o.id = t.order_id) as posted_to_carriers,
          (SELECT o.posted_at FROM orders o WHERE o.id = t.order_id) as posted_at
        FROM trips t
        WHERE t.driver_id IS NULL
          OR EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = ANY(t.order_ids) 
            AND o.dispatch_status IN ('BROKERAGE_PENDING', 'POSTED_EXTERNAL', 'COVERED_EXTERNAL')
          )
        ORDER BY t.created_at DESC
      `);

      const trips = result.rows.map(row => ({
        id: row.id,
        tripNumber: row.trip_number,
        orderId: row.order_id,
        orderIds: row.order_ids || [],
        orders: row.orders || [],
        orderCount: (row.order_ids || []).length,
        tripStatus: row.trip_status,
        dispatchStatus: row.dispatch_status || 'BROKERAGE_PENDING',
        driverId: row.driver_id,
        pickupLocation: row.pickup_location,
        dropoffLocation: row.dropoff_location,
        pickupTime: row.pickup_window_start,
        dropoffTime: row.delivery_window_start,
        totalRate: parseFloat(row.total_rate) || 0,
        totalWeight: parseFloat(row.total_weight) || 0,
        bidCount: parseInt(row.bid_count) || 0,
        lowestBid: row.lowest_bid ? parseFloat(row.lowest_bid) : null,
        postedToCarriers: row.posted_to_carriers || false,
        postedAt: row.posted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return NextResponse.json({ success: true, data: trips });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching farm-out trips:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch farm-out trips' },
      { status: 500 }
    );
  }
}
