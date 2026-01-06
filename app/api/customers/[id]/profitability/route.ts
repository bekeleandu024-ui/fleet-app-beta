import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: customerId } = await context.params;

  try {
    // Get customer profitability summary - using actual column names
    const profitResult = await pool.query(
      `SELECT 
        o.customer_name,
        o.customer_id,
        COUNT(DISTINCT t.id) as total_trips,
        SUM(tc.revenue) as total_revenue,
        SUM(tc.total_cost) as total_cost,
        SUM(tc.profit) as total_profit,
        AVG(tc.margin_pct) as avg_margin,
        AVG(CASE WHEN tc.total_miles > 0 THEN tc.profit / tc.total_miles ELSE 0 END) as avg_ppm,
        MIN(t.created_at) as first_trip_date,
        MAX(t.created_at) as last_trip_date
      FROM orders o
      JOIN trips t ON t.order_id = o.id
      LEFT JOIN trip_costs tc ON t.id = tc.trip_id
      WHERE o.customer_id = $1
      GROUP BY o.customer_name, o.customer_id`,
      [customerId]
    );

    if (profitResult.rows.length === 0) {
      // Try without trips - get customer from orders
      const customerResult = await pool.query(
        `SELECT DISTINCT customer_name, customer_id, COUNT(*) as order_count
         FROM orders
         WHERE customer_id = $1
         GROUP BY customer_name, customer_id`,
        [customerId]
      );

      if (customerResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        customer: {
          id: customerResult.rows[0].customer_id,
          name: customerResult.rows[0].customer_name,
        },
        metrics: {
          totalTrips: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          avgMargin: 0,
          avgPpm: 0,
        },
        tier: "New",
        trend: "stable",
      });
    }

    const data = profitResult.rows[0];

    // Calculate recent trend (last 30 days vs previous 30 days)
    const trendResult = await pool.query(
      `SELECT 
        AVG(CASE WHEN t.created_at >= NOW() - INTERVAL '30 days' THEN tc.margin_pct END) as recent_margin,
        AVG(CASE WHEN t.created_at >= NOW() - INTERVAL '60 days' AND t.created_at < NOW() - INTERVAL '30 days' THEN tc.margin_pct END) as previous_margin
      FROM orders o
      JOIN trips t ON t.order_id = o.id
      LEFT JOIN trip_costs tc ON t.id = tc.trip_id
      WHERE o.customer_id = $1`,
      [customerId]
    );

    const trendData = trendResult.rows[0];
    const recentMargin = parseFloat(trendData.recent_margin) || 0;
    const previousMargin = parseFloat(trendData.previous_margin) || 0;
    
    let trend = "stable";
    if (recentMargin > previousMargin + 2) trend = "up";
    else if (recentMargin < previousMargin - 2) trend = "down";

    // Determine customer tier based on volume and profitability
    const totalTrips = parseInt(data.total_trips) || 0;
    const avgMargin = parseFloat(data.avg_margin) || 0;
    
    let tier = "Bronze";
    if (totalTrips >= 100 && avgMargin >= 15) tier = "Platinum";
    else if (totalTrips >= 50 && avgMargin >= 10) tier = "Gold";
    else if (totalTrips >= 20 && avgMargin >= 5) tier = "Silver";
    else if (totalTrips < 5) tier = "New";

    return NextResponse.json({
      customer: {
        id: data.customer_id,
        name: data.customer_name,
      },
      metrics: {
        totalTrips,
        totalRevenue: parseFloat(data.total_revenue) || 0,
        totalCost: parseFloat(data.total_cost) || 0,
        totalProfit: parseFloat(data.total_profit) || 0,
        avgMargin,
        avgPpm: parseFloat(data.avg_ppm) || 0,
        firstTripDate: data.first_trip_date,
        lastTripDate: data.last_trip_date,
      },
      tier,
      trend,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    console.error("Error fetching customer profitability:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer profitability", details: error.message },
      { status: 500 }
    );
  }
}
