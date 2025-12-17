import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const client = await pool.connect();
    
    try {
      // Optimized single query using CTEs
      const query = `
        WITH 
        order_stats AS (
          SELECT 
            COUNT(*) FILTER (WHERE status IN ('New', 'Planning', 'Pending')) as waiting_count
          FROM orders
        ),
        trip_stats AS (
          SELECT 
            COUNT(*) FILTER (WHERE status IN ('In Transit', 'En Route') AND risk_level IN ('High', 'Critical')) as risk_count,
            COUNT(*) FILTER (WHERE status = 'Completed' AND completed_at > NOW() - INTERVAL '30 days') as completed_30d,
            COUNT(*) FILTER (WHERE status = 'Completed' AND completed_at > NOW() - INTERVAL '30 days' AND on_time_delivery = true) as on_time_30d
          FROM trips
        ),
        driver_stats AS (
          SELECT 
            COUNT(*) as total_drivers,
            COUNT(*) FILTER (WHERE is_active = true) as active_drivers
          FROM driver_profiles
        ),
        financial_stats AS (
          SELECT 
            COALESCE(SUM(revenue), 0) as total_revenue,
            COALESCE(SUM(total_cost), 0) as total_cost
          FROM trip_costs
          WHERE created_at > NOW() - INTERVAL '30 days'
        )
        SELECT 
          o.waiting_count,
          t.risk_count,
          t.completed_30d,
          t.on_time_30d,
          d.total_drivers,
          d.active_drivers,
          f.total_revenue,
          f.total_cost
        FROM order_stats o, trip_stats t, driver_stats d, financial_stats f
      `;

      const result = await client.query(query);
      const row = result.rows[0];

      const totalRevenue = parseFloat(row.total_revenue);
      const totalCost = parseFloat(row.total_cost);
      const netMargin = totalRevenue - totalCost;
      const avgMargin = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : 0;

      const metrics = {
        ordersWaiting: parseInt(row.waiting_count),
        atRiskTrips: parseInt(row.risk_count),
        avgMargin,
        onTimePercent: parseInt(row.completed_30d) > 0 
          ? (parseInt(row.on_time_30d) / parseInt(row.completed_30d)) * 100 
          : 0,
        activeDrivers: parseInt(row.active_drivers),
        utilizationRate: parseInt(row.total_drivers) > 0 
          ? (parseInt(row.active_drivers) / parseInt(row.total_drivers)) * 100 
          : 0,
        totalRevenue,
        totalCost,
        netMargin,
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

