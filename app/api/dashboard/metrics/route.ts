import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const client = await pool.connect();
    
    try {
      // 1. Orders Waiting (New or Planning)
      const ordersQuery = `
        SELECT COUNT(*) as count 
        FROM orders 
        WHERE status IN ('New', 'Planning', 'Pending')
      `;
      const ordersResult = await client.query(ordersQuery);
      const ordersWaiting = parseInt(ordersResult.rows[0].count);

      // 2. At-Risk Trips (High Risk or Delayed)
      const riskQuery = `
        SELECT COUNT(*) as count 
        FROM trips 
        WHERE status IN ('In Transit', 'En Route') 
        AND (risk_level = 'High' OR risk_level = 'Critical')
      `;
      const riskResult = await client.query(riskQuery);
      const atRiskTrips = parseInt(riskResult.rows[0].count);

      // 3. Active Drivers & Utilization
      const driversQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE is_active = true) as total_active,
          COUNT(*) as total_drivers
        FROM driver_profiles
      `;
      const driversResult = await client.query(driversQuery);
      const activeDrivers = parseInt(driversResult.rows[0].total_active || 0);
      const totalDrivers = parseInt(driversResult.rows[0].total_drivers || 0);
      const utilizationRate = totalDrivers > 0 ? (activeDrivers / totalDrivers) * 100 : 0;

      // 4. Financials (Last 30 Days)
      const financialsQuery = `
        SELECT 
          COALESCE(SUM(revenue), 0) as total_revenue,
          COALESCE(SUM(total_cost), 0) as total_cost,
          COALESCE(AVG(margin_pct), 0) as avg_margin
        FROM trip_costs
        WHERE created_at > NOW() - INTERVAL '30 days'
      `;
      const financialsResult = await client.query(financialsQuery);
      const totalRevenue = parseFloat(financialsResult.rows[0].total_revenue);
      const totalCost = parseFloat(financialsResult.rows[0].total_cost);
      const avgMargin = parseFloat(financialsResult.rows[0].avg_margin);

      // 5. On-Time Performance (Last 30 Days)
      const onTimeQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE on_time_delivery = true) as on_time_count,
          COUNT(*) as total_completed
        FROM trips
        WHERE status = 'Completed' 
        AND completed_at > NOW() - INTERVAL '30 days'
      `;
      const onTimeResult = await client.query(onTimeQuery);
      const onTimeCount = parseInt(onTimeResult.rows[0].on_time_count || 0);
      const totalCompleted = parseInt(onTimeResult.rows[0].total_completed || 0);
      const onTimePercent = totalCompleted > 0 ? (onTimeCount / totalCompleted) * 100 : 0;

      const metrics = {
        ordersWaiting,
        atRiskTrips,
        avgMargin,
        onTimePercent,
        activeDrivers,
        utilizationRate,
        totalRevenue,
        totalCost,
        netMargin: totalRevenue - totalCost,
      };

      return NextResponse.json(metrics);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

