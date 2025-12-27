import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { formatError } from "@/lib/api-errors";

/**
 * GET /api/portal/orders/[orderId]/tracking
 * Get real-time tracking information for an order
 * Can be accessed with authentication or via share token
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token');

    // Verify access (either authenticated user or valid share token)
    let hasAccess = false;
    let customerId: string | null = null;

    if (shareToken) {
      // Verify share token
      const shareResult = await pool.query(
        `SELECT * FROM tracking_shares 
         WHERE share_token = $1 AND order_id = $2 
         AND is_active = TRUE
         AND (expires_at IS NULL OR expires_at > NOW())`,
        [shareToken, orderId]
      );

      if (shareResult.rows.length > 0) {
        hasAccess = true;
        
        // Update view count
        await pool.query(
          `UPDATE tracking_shares 
           SET view_count = view_count + 1, last_viewed_at = NOW()
           WHERE id = $1`,
          [shareResult.rows[0].id]
        );
      }
    } else {
      // Check authentication
      const authHeader = request.headers.get("authorization");
      if (authHeader) {
        // TODO: Verify customer auth token and get customerId
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch order and trip data
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const order = orderResult.rows[0];

    // Fetch active trip for this order
    const tripResult = await pool.query(
      `SELECT 
        t.*,
        d.driver_name,
        d.driver_type,
        u.unit_number,
        u.unit_type
       FROM trips t
       LEFT JOIN driver_profiles d ON d.driver_id = t.driver_id
       LEFT JOIN unit_profiles u ON u.unit_id = t.unit_id
       WHERE t.order_id = $1
       ORDER BY t.created_at DESC
       LIMIT 1`,
      [orderId]
    );

    const trip = tripResult.rows.length > 0 ? tripResult.rows[0] : null;

    // Fetch recent location history
    let locationHistory: any[] = [];
    if (trip) {
      const locationResult = await pool.query(
        `SELECT * FROM trip_locations 
         WHERE trip_id = $1 
         ORDER BY recorded_at DESC 
         LIMIT 50`,
        [trip.id]
      );
      locationHistory = locationResult.rows;
    }

    // Fetch trip events
    let events: any[] = [];
    if (trip) {
      const eventsResult = await pool.query(
        `SELECT * FROM trip_events 
         WHERE trip_id = $1 
         ORDER BY occurred_at DESC`,
        [trip.id]
      );
      events = eventsResult.rows;
    }

    // Calculate ETA
    let eta = null;
    if (trip && trip.delivery_window_end) {
      eta = trip.delivery_window_end;
    }

    // Build tracking response
    const tracking = {
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        pickupLocation: order.pickup_location,
        dropoffLocation: order.dropoff_location,
        pickupTime: order.pickup_time,
        dropoffTime: order.dropoff_time,
      },
      trip: trip ? {
        id: trip.id,
        status: trip.status,
        driver: trip.driver_name,
        unit: trip.unit_number,
        currentLocation: {
          lat: trip.last_known_lat,
          lng: trip.last_known_lng,
          lastUpdate: trip.last_ping_at,
        },
        timeline: {
          pickupArrival: trip.pickup_arrival,
          pickupDeparture: trip.pickup_departure,
          deliveryArrival: trip.delivery_arrival,
          deliveryDeparture: trip.delivery_departure,
          estimatedDelivery: eta,
        },
      } : null,
      locationHistory,
      events,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      tracking,
    });
  } catch (error) {
    console.error("Error fetching tracking:", error);
    return NextResponse.json(
      { success: false, error: formatError(error) },
      { status: 500 }
    );
  }
}
