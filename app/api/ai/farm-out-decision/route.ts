import { NextRequest, NextResponse } from "next/server";
import { analyzeFarmOutDecision } from "@/lib/fleet-ai";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { orderId, urgency = "flexible" } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch order details
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const order = orderResult.rows[0];

    // Check fleet capacity
    const capacityResult = await pool.query(`
      SELECT d.id, d.name, d.type, d.current_location, d.hos_remaining,
             COUNT(t.id) as active_trips
      FROM drivers d
      LEFT JOIN trips t ON t.driver_id = d.id AND t.status NOT IN ('Completed', 'Cancelled')
      WHERE d.status = 'Active'
      GROUP BY d.id
      HAVING COUNT(t.id) = 0 OR COUNT(t.id) < 2
      ORDER BY d.name
    `);

    // Fetch available carriers (if any)
    const carriersResult = await pool.query(`
      SELECT c.*, 
             AVG(cr.rate) as avg_rate,
             AVG(cr.on_time_percentage) as avg_on_time
      FROM carriers c
      LEFT JOIN carrier_rates cr ON cr.carrier_id = c.id
      WHERE c.status = 'Active'
      GROUP BY c.id
      ORDER BY c.name
      LIMIT 10
    `).catch(() => ({ rows: [] })); // Carriers table might not exist

    const decision = await analyzeFarmOutDecision({
      order: {
        id: order.id,
        orderNumber: order.order_number,
        customer: order.customer_name,
        origin: `${order.pickup_city}, ${order.pickup_state}`,
        destination: `${order.delivery_city}, ${order.delivery_state}`,
        pickupDate: order.pickup_date,
        deliveryDate: order.delivery_date,
        revenue: order.revenue,
        equipment: order.equipment_type
      },
      fleetCapacity: {
        availableDrivers: capacityResult.rows.length,
        drivers: capacityResult.rows.map((d: any) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          location: d.current_location,
          hosRemaining: d.hos_remaining,
          activeTrips: d.active_trips
        }))
      },
      carriers: carriersResult.rows.map((c: any) => ({
        id: c.id,
        name: c.name,
        avgRate: c.avg_rate,
        onTimePercentage: c.avg_on_time
      })),
      urgency
    });

    return NextResponse.json(decision);
  } catch (error: any) {
    console.error("Farm-out analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze farm-out decision" },
      { status: 500 }
    );
  }
}
