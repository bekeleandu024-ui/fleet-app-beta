import { NextRequest, NextResponse } from "next/server";
import { generateCustomerNotification } from "@/lib/fleet-ai";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { tripId, notificationType, details } = await request.json();

    if (!tripId || !notificationType) {
      return NextResponse.json(
        { error: "Trip ID and notification type are required" },
        { status: 400 }
      );
    }

    // Fetch trip and customer details
    const tripResult = await pool.query(`
      SELECT t.*, 
             o.customer_name, o.customer_email, o.customer_phone,
             d.name as driver_name
      FROM trips t
      LEFT JOIN orders o ON t.order_id = o.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = $1
    `, [tripId]);

    if (tripResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      );
    }

    const t = tripResult.rows[0];

    const notification = await generateCustomerNotification({
      trip: {
        id: t.id,
        tripNumber: t.trip_number,
        status: t.status,
        pickup: `${t.pickup_city}, ${t.pickup_state}`,
        delivery: `${t.delivery_city}, ${t.delivery_state}`,
        deliveryWindow: { start: t.delivery_window_start, end: t.delivery_window_end },
        driver: t.driver_name,
        eta: t.estimated_arrival
      },
      customer: {
        name: t.customer_name,
        email: t.customer_email,
        phone: t.customer_phone
      },
      notificationType,
      details
    });

    return NextResponse.json(notification);
  } catch (error: any) {
    console.error("Notification generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate notification" },
      { status: 500 }
    );
  }
}
