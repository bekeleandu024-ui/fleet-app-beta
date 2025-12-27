import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { formatError } from "@/lib/api-errors";
import { verifyCustomerToken } from "@/lib/customer-auth";

/**
 * GET /api/portal/orders
 * List all orders for the authenticated customer
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyCustomerToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = `
      SELECT 
        o.*,
        t.id as trip_id,
        t.status as trip_status,
        t.driver_id,
        t.pickup_arrival,
        t.delivery_arrival,
        t.last_known_lat,
        t.last_known_lng,
        t.last_ping_at,
        d.driver_name,
        u.unit_number
      FROM orders o
      LEFT JOIN trips t ON t.order_id = o.id
      LEFT JOIN driver_profiles d ON d.driver_id = t.driver_id
      LEFT JOIN unit_profiles u ON u.unit_id = t.unit_id
      WHERE o.customer_id = $1
    `;
    
    const params: any[] = [user.customerId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    if (startDate) {
      paramCount++;
      query += ` AND o.created_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND o.created_at <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE customer_id = $1`,
      [user.customerId]
    );

    return NextResponse.json({
      success: true,
      orders: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit,
        offset,
        hasMore: offset + result.rows.length < parseInt(countResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: formatError(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal/orders
 * Create a new order (quote request)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyCustomerToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Create order
    const result = await pool.query(
      `INSERT INTO orders (
        customer_id, order_type, status, pickup_location, dropoff_location,
        pickup_time, dropoff_time, special_instructions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        user.customerId,
        body.orderType || 'standard',
        'New',
        body.pickupLocation,
        body.dropoffLocation,
        body.pickupTime || null,
        body.dropoffTime || null,
        body.specialInstructions || null,
      ]
    );

    // Create notification
    await pool.query(
      `INSERT INTO customer_notifications (
        customer_id, customer_user_id, order_id, notification_type,
        channel, title, message
      ) VALUES ($1, $2, $3, 'order_created', 'portal', 'Order Created', $4)`,
      [
        user.customerId,
        user.userId,
        result.rows[0].id,
        `Your order has been created and is pending review.`,
      ]
    );

    return NextResponse.json({
      success: true,
      order: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: formatError(error) },
      { status: 500 }
    );
  }
}
