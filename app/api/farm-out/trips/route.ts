import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/farm-out/trips - Fetch trips that are in brokerage/farm-out status
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      // Fetch trips where orders are in brokerage status
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
          t.pickup_departure,
          t.delivery_arrival,
          t.completed_at,
          t.created_at,
          t.updated_at,
          t.pod_url,
          -- Get order info via JOIN
          o.dispatch_status,
          o.posted_to_carriers,
          o.posted_at,
          o.billing_status,
          o.quoted_rate as total_rate,
          o.total_weight_lbs as total_weight,
          o.order_number,
          o.customer_name,
          o.customer_id,
          o.equipment_type,
          o.pickup_location as order_pickup,
          o.dropoff_location as order_dropoff,
          o.pickup_time,
          o.dropoff_time,
          -- Get bid info
          (SELECT COUNT(*) FROM carrier_bids cb WHERE cb.order_id = t.order_id AND cb.status = 'PENDING') as bid_count,
          (SELECT MIN(cb.bid_amount) FROM carrier_bids cb WHERE cb.order_id = t.order_id AND cb.status = 'PENDING') as lowest_bid,
          -- Get awarded carrier info
          (SELECT cb.carrier_name FROM carrier_bids cb WHERE cb.order_id = t.order_id AND cb.status = 'ACCEPTED' LIMIT 1) as carrier_name,
          (SELECT cb.bid_amount FROM carrier_bids cb WHERE cb.order_id = t.order_id AND cb.status = 'ACCEPTED' LIMIT 1) as awarded_amount
        FROM trips t
        LEFT JOIN orders o ON o.id = t.order_id
        WHERE t.driver_id IS NULL
          OR o.dispatch_status IN ('BROKERAGE_PENDING', 'POSTED_EXTERNAL', 'COVERED_EXTERNAL', 'IN_TRANSIT_EXTERNAL', 'DELIVERED_EXTERNAL', 'CLOSED_EXTERNAL')
        ORDER BY t.created_at DESC
      `);

      const trips = result.rows.map(row => ({
        id: row.id,
        tripNumber: row.trip_number,
        orderId: row.order_id,
        orderIds: row.order_ids || [],
        orders: [{
          id: row.order_id,
          orderNumber: row.order_number,
          customerName: row.customer_name || row.customer_id,
          customerId: row.customer_id,
          pickupLocation: row.order_pickup,
          dropoffLocation: row.order_dropoff,
          pickupTime: row.pickup_time,
          dropoffTime: row.dropoff_time,
          dispatchStatus: row.dispatch_status,
          equipmentType: row.equipment_type,
          totalWeightLbs: row.total_weight || 0,
          quotedRate: row.total_rate,
        }],
        orderCount: (row.order_ids || []).length || 1,
        tripStatus: row.trip_status,
        dispatchStatus: row.dispatch_status || 'BROKERAGE_PENDING',
        driverId: row.driver_id,
        pickupLocation: row.pickup_location || row.order_pickup,
        dropoffLocation: row.dropoff_location || row.order_dropoff,
        pickupTime: row.pickup_window_start || row.pickup_departure || row.pickup_time,
        dropoffTime: row.delivery_window_start || row.delivery_arrival || row.dropoff_time,
        totalRate: parseFloat(row.total_rate) || 0,
        totalWeight: parseFloat(row.total_weight) || 0,
        bidCount: parseInt(row.bid_count) || 0,
        lowestBid: row.lowest_bid ? parseFloat(row.lowest_bid) : null,
        postedToCarriers: row.posted_to_carriers || false,
        postedAt: row.posted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // Extended fields for workflow
        carrierName: row.carrier_name || null,
        awardedAmount: row.awarded_amount ? parseFloat(row.awarded_amount) : null,
        podUploaded: !!row.pod_url,
        billingStatus: row.billing_status || null,
        paymentStatus: null,
      }));

      return NextResponse.json({ success: true, data: trips });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching farm-out trips:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch farm-out trips', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
