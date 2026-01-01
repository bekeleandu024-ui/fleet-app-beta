import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/dispatch/orders - Fetch orders for dispatch boards
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const board = searchParams.get('board'); // 'fleet' or 'brokerage'
    const status = searchParams.get('status'); // 'NEW' for demand pool

    let whereClause = '';
    
    if (status === 'NEW') {
      // Demand pool: Only NEW/unassigned orders (not yet dispatched to fleet or brokerage)
      whereClause = `WHERE (o.dispatch_status IS NULL OR o.dispatch_status = 'NEW') 
                     AND o.assigned_driver_id IS NULL 
                     AND o.awarded_carrier_id IS NULL`;
    } else if (board === 'fleet') {
      // Fleet board: NEW orders and FLEET_DISPATCH orders
      whereClause = `WHERE o.dispatch_status IN ('NEW', 'FLEET_DISPATCH', 'COVERED_INTERNAL')`;
    } else if (board === 'brokerage') {
      // Brokerage board: Orders kicked to brokerage or posted to carriers
      whereClause = `WHERE o.dispatch_status IN ('BROKERAGE_PENDING', 'POSTED_EXTERNAL', 'COVERED_EXTERNAL')`;
    } else {
      // All dispatchable orders
      whereClause = `WHERE o.dispatch_status IS NOT NULL`;
    }

    const result = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        COALESCE(o.customer_name, UPPER(REPLACE(REPLACE(o.customer_id, 'cust-', ''), '-', ' '))) AS customer_name,
        o.customer_id,
        o.pickup_location,
        o.dropoff_location,
        o.pickup_time,
        o.dropoff_time,
        COALESCE(o.dispatch_status, 'NEW') AS dispatch_status,
        o.equipment_type,
        o.total_weight_lbs,
        o.total_pallets,
        o.quoted_rate,
        o.estimated_cost AS target_rate,
        o.assigned_driver_id,
        d.driver_name AS assigned_driver_name,
        o.assigned_unit_id,
        u.unit_number AS assigned_unit_number,
        COALESCE(o.posted_to_carriers, false) AS posted_to_carriers,
        o.posted_at,
        o.kicked_to_brokerage_at,
        o.kick_reason,
        o.awarded_carrier_id,
        o.awarded_bid_id,
        COALESCE(bid_stats.bid_count, 0) AS bid_count,
        bid_stats.lowest_bid,
        o.created_at
      FROM orders o
      LEFT JOIN driver_profiles d ON o.assigned_driver_id = d.driver_id
      LEFT JOIN unit_profiles u ON o.assigned_unit_id = u.unit_id
      LEFT JOIN (
        SELECT 
          order_id,
          COUNT(*) AS bid_count,
          MIN(bid_amount) AS lowest_bid
        FROM carrier_bids
        WHERE status = 'PENDING'
        GROUP BY order_id
      ) bid_stats ON o.id = bid_stats.order_id
      ${whereClause}
      ORDER BY 
        CASE o.dispatch_status 
          WHEN 'NEW' THEN 1 
          WHEN 'FLEET_DISPATCH' THEN 2
          WHEN 'BROKERAGE_PENDING' THEN 3
          WHEN 'POSTED_EXTERNAL' THEN 4
          ELSE 5 
        END,
        o.pickup_time ASC NULLS LAST,
        o.created_at DESC
    `);

    // Transform to camelCase for frontend
    const orders = result.rows.map(row => ({
      id: row.id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      pickupLocation: row.pickup_location,
      dropoffLocation: row.dropoff_location,
      pickupTime: row.pickup_time,
      dropoffTime: row.dropoff_time,
      dispatchStatus: row.dispatch_status,
      equipmentType: row.equipment_type,
      totalWeightLbs: parseFloat(row.total_weight_lbs) || 0,
      totalPallets: parseInt(row.total_pallets) || 0,
      quotedRate: parseFloat(row.quoted_rate) || null,
      targetRate: parseFloat(row.target_rate) || null,
      assignedDriverId: row.assigned_driver_id,
      assignedDriverName: row.assigned_driver_name,
      assignedUnitId: row.assigned_unit_id,
      assignedUnitNumber: row.assigned_unit_number,
      postedToCarriers: row.posted_to_carriers || false,
      postedAt: row.posted_at,
      kickedToBrokerageAt: row.kicked_to_brokerage_at,
      kickReason: row.kick_reason,
      awardedCarrierId: row.awarded_carrier_id,
      awardedBidId: row.awarded_bid_id,
      bidCount: row.bid_count,
      lowestBid: parseFloat(row.lowest_bid) || null,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching dispatch orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
