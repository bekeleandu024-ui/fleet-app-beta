import { NextRequest, NextResponse } from "next/server";
import { getFleetHealthSummary, rankOrdersByPriority } from "@/lib/fleet-ai";
import pool from "@/lib/db";

export async function GET() {
  try {
    // Fetch active trips
    const tripsResult = await pool.query(`
      SELECT t.*, 
             d.name as driver_name, d.type as driver_type,
             o.customer_name, o.revenue
      FROM trips t
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN orders o ON t.order_id = o.id
      WHERE t.status NOT IN ('Completed', 'Cancelled')
      ORDER BY t.created_at DESC
      LIMIT 50
    `);

    // Fetch pending orders
    const ordersResult = await pool.query(`
      SELECT o.*, 
             CASE WHEN t.id IS NOT NULL THEN 'assigned' ELSE 'unassigned' END as assignment_status
      FROM orders o
      LEFT JOIN trips t ON t.order_id = o.id
      WHERE o.status NOT IN ('Completed', 'Cancelled', 'Delivered')
      ORDER BY o.pickup_date ASC
      LIMIT 50
    `);

    // Fetch driver utilization
    const driversResult = await pool.query(`
      SELECT d.*, 
             COUNT(t.id) as active_trip_count
      FROM drivers d
      LEFT JOIN trips t ON t.driver_id = d.id AND t.status NOT IN ('Completed', 'Cancelled')
      WHERE d.status = 'Active'
      GROUP BY d.id
      ORDER BY d.name
      LIMIT 30
    `);

    // Get recent metrics for comparison
    const metricsResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'Completed') as completed_trips,
        COUNT(*) FILTER (WHERE status IN ('In Transit', 'At Delivery')) as active_trips,
        AVG(CASE WHEN revenue > 0 AND total_cost > 0 
            THEN ((revenue - total_cost) / revenue * 100) 
            ELSE NULL END) as avg_margin
      FROM trips
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);

    const fleetHealth = await getFleetHealthSummary({
      trips: tripsResult.rows.map((t: any) => ({
        id: t.id,
        tripNumber: t.trip_number,
        status: t.status,
        driver: t.driver_name,
        driverType: t.driver_type,
        customer: t.customer_name,
        revenue: t.revenue,
        pickup: `${t.pickup_city}, ${t.pickup_state}`,
        delivery: `${t.delivery_city}, ${t.delivery_state}`,
        deliveryWindow: t.delivery_window_start
      })),
      orders: ordersResult.rows.map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        customer: o.customer_name,
        status: o.status,
        assignmentStatus: o.assignment_status,
        pickupDate: o.pickup_date,
        revenue: o.revenue,
        origin: `${o.pickup_city}, ${o.pickup_state}`,
        destination: `${o.delivery_city}, ${o.delivery_state}`
      })),
      drivers: driversResult.rows.map((d: any) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        status: d.status,
        activeTrips: d.active_trip_count,
        location: d.current_location
      })),
      recentMetrics: metricsResult.rows[0]
    });

    // Also get priority-ranked orders
    const priorityOrders = await rankOrdersByPriority(
      ordersResult.rows
        .filter(o => o.assignment_status === 'unassigned')
        .map(o => ({
          id: o.id,
          orderNumber: o.order_number,
          customer: o.customer_name,
          pickupDate: o.pickup_date,
          revenue: o.revenue,
          status: o.status
        }))
    );

    return NextResponse.json({
      fleetHealth,
      priorityOrders: priorityOrders.slice(0, 10)
    });
  } catch (error: any) {
    console.error("Fleet health error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get fleet health" },
      { status: 500 }
    );
  }
}
