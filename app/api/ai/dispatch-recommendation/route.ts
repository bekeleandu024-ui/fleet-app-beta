import { NextRequest, NextResponse } from "next/server";
import { getDispatchRecommendations } from "@/lib/fleet-ai";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { orderId, availableDriverIds } = await request.json();

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

    // Fetch available drivers
    let driverQuery = `
      SELECT d.*, 
             COALESCE(
               (SELECT COUNT(*) FROM trips t WHERE t.driver_id = d.id AND t.status NOT IN ('Completed', 'Cancelled')),
               0
             ) as active_trips
      FROM drivers d
      WHERE d.status = 'Active'
    `;
    
    if (availableDriverIds && availableDriverIds.length > 0) {
      driverQuery += ` AND d.id = ANY($1)`;
    }
    
    driverQuery += ` ORDER BY d.name`;

    const driverResult = await pool.query(
      driverQuery,
      availableDriverIds?.length > 0 ? [availableDriverIds] : []
    );

    // Fetch available units
    const unitResult = await pool.query(`
      SELECT u.*
      FROM units u
      WHERE u.status = 'Available' OR u.status = 'Active'
      ORDER BY u.unit_number
      LIMIT 20
    `);

    // Get costing rules
    const costingResult = await pool.query(`
      SELECT * FROM costing_rules 
      WHERE active = true
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const recommendations = await getDispatchRecommendations({
      order: {
        id: order.id,
        orderNumber: order.order_number,
        customer: order.customer_name,
        origin: `${order.pickup_city}, ${order.pickup_state}`,
        destination: `${order.delivery_city}, ${order.delivery_state}`,
        pickupDate: order.pickup_date,
        deliveryDate: order.delivery_date,
        revenue: order.revenue,
        commodity: order.commodity,
        weight: order.weight,
        equipment: order.equipment_type
      },
      availableDrivers: driverResult.rows.map((d: any) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        location: d.current_location,
        hosRemaining: d.hos_remaining,
        costPerMile: d.cost_per_mile,
        fuelRate: d.fuel_rate,
        borderCertified: d.border_certified,
        activeTrips: d.active_trips
      })),
      availableUnits: unitResult.rows.map((u: any) => ({
        id: u.id,
        unitNumber: u.unit_number,
        type: u.type,
        status: u.status,
        location: u.current_location
      })),
      costingRules: costingResult.rows[0] || null
    });

    return NextResponse.json(recommendations);
  } catch (error: any) {
    console.error("Dispatch recommendation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get dispatch recommendations" },
      { status: 500 }
    );
  }
}
