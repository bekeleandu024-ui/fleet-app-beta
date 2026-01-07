import { NextRequest, NextResponse } from "next/server";
import { calculateProfitabilityScore, getCustomerRateSuggestion } from "@/lib/fleet-ai";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { 
      origin, 
      destination, 
      customerRate, 
      customerId,
      customerName,
      commodity, 
      equipmentType, 
      accessorials 
    } = await request.json();

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Origin and destination are required" },
        { status: 400 }
      );
    }

    // Get historical data for this lane
    const historicalResult = await pool.query(`
      SELECT o.revenue, o.pickup_city, o.pickup_state, o.delivery_city, o.delivery_state,
             t.actual_miles, t.total_cost
      FROM orders o
      LEFT JOIN trips t ON t.order_id = o.id
      WHERE (o.pickup_city ILIKE $1 OR o.pickup_state ILIKE $1)
        AND (o.delivery_city ILIKE $2 OR o.delivery_state ILIKE $2)
      ORDER BY o.created_at DESC
      LIMIT 10
    `, [`%${origin.split(',')[0]}%`, `%${destination.split(',')[0]}%`]);

    // Calculate profitability
    const profitability = await calculateProfitabilityScore({
      origin,
      destination,
      customerRate,
      commodity,
      equipmentType,
      accessorials,
      historicalData: historicalResult.rows
    });

    // If customer provided, get rate suggestion
    let rateSuggestion = null;
    if (customerId || customerName) {
      // Get customer's historical orders
      const customerHistoryResult = await pool.query(`
        SELECT o.revenue, o.pickup_city, o.pickup_state, o.delivery_city, o.delivery_state,
               o.created_at
        FROM orders o
        WHERE ${customerId ? 'o.customer_id = $1' : 'o.customer_name ILIKE $1'}
        ORDER BY o.created_at DESC
        LIMIT 20
      `, [customerId || `%${customerName}%`]);

      rateSuggestion = await getCustomerRateSuggestion({
        customerId: customerId || "",
        customerName: customerName || "Unknown",
        origin,
        destination,
        historicalOrders: customerHistoryResult.rows
      });
    }

    return NextResponse.json({
      profitability,
      rateSuggestion
    });
  } catch (error: any) {
    console.error("Profitability calculation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate profitability" },
      { status: 500 }
    );
  }
}
