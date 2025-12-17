import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const client = await pool.connect();
    
    try {
      // Parallelize queries for maximum speed
      const [
        summaryRes,
        trendRes,
        categoryRes,
        driverRes,
        laneRes,
        distRes,
        alertsRes
      ] = await Promise.all([
        // 1. Summary Stats (Last 30 Days)
        client.query(`
          SELECT 
            COALESCE(SUM(revenue), 0) as total_revenue,
            COALESCE(SUM(total_cost), 0) as total_cost,
            COALESCE(SUM(miles), 0) as total_miles,
            COUNT(*) FILTER (WHERE margin_pct >= 15) as profitable_trips,
            COUNT(*) FILTER (WHERE margin_pct < 15 AND margin_pct >= 0) as at_risk_trips
          FROM trip_costs
          WHERE created_at > NOW() - INTERVAL '30 days'
        `),

        // 2. Revenue Trend (Last 8 Weeks)
        client.query(`
          SELECT 
            TO_CHAR(DATE_TRUNC('week', created_at), 'Mon DD') as label,
            SUM(revenue) as revenue,
            SUM(total_cost) as cost,
            SUM(miles) as miles,
            CASE WHEN SUM(revenue) > 0 THEN ((SUM(revenue) - SUM(total_cost)) / SUM(revenue)) * 100 ELSE 0 END as "marginPercent"
          FROM trip_costs
          WHERE created_at > NOW() - INTERVAL '8 weeks'
          GROUP BY DATE_TRUNC('week', created_at)
          ORDER BY DATE_TRUNC('week', created_at) ASC
        `),

        // 3. Margin by Category (Driver Type)
        client.query(`
          SELECT 
            driver_type as category,
            SUM(revenue) as revenue,
            CASE WHEN SUM(revenue) > 0 THEN ((SUM(revenue) - SUM(total_cost)) / SUM(revenue)) * 100 ELSE 0 END as "marginPercent"
          FROM trip_costs
          WHERE created_at > NOW() - INTERVAL '30 days'
          GROUP BY driver_type
        `),

        // 4. Driver Performance (Top 10)
        client.query(`
          SELECT 
            d.driver_name as "driverName",
            tc.driver_id as "driverId",
            COUNT(*) as trips,
            SUM(tc.revenue) as revenue,
            AVG(tc.margin_pct) as "marginPercent"
          FROM trip_costs tc
          JOIN driver_profiles d ON tc.driver_id::text = d.driver_id::text
          WHERE tc.created_at > NOW() - INTERVAL '30 days'
          GROUP BY tc.driver_id, d.driver_name
          ORDER BY revenue DESC
          LIMIT 10
        `),

        // 5. Lane Performance (Top 10)
        client.query(`
          SELECT 
            CONCAT(t.pickup_location, ' -> ', t.dropoff_location) as lane,
            COUNT(*) as trips,
            SUM(tc.revenue) as revenue,
            SUM(tc.miles) as miles,
            AVG(tc.margin_pct) as "marginPercent"
          FROM trip_costs tc
          JOIN trips t ON tc.order_id::text = t.order_id::text
          WHERE tc.created_at > NOW() - INTERVAL '30 days'
          GROUP BY t.pickup_location, t.dropoff_location
          ORDER BY revenue DESC
          LIMIT 10
        `),

        // 6. Margin Distribution
        client.query(`
          SELECT 
            FLOOR(margin_pct / 5) * 5 as band,
            COUNT(*) as trips
          FROM trip_costs
          WHERE created_at > NOW() - INTERVAL '30 days'
          GROUP BY FLOOR(margin_pct / 5) * 5
          ORDER BY band ASC
        `),

        // 7. Active Alerts
        client.query(`
          SELECT 
            id,
            exception_type as title,
            message as description,
            severity,
            created_at
          FROM trip_exceptions
          WHERE resolved = false
          ORDER BY created_at DESC
          LIMIT 5
        `)
      ]);

      const summaryRow = summaryRes.rows[0];
      const totalRevenue = parseFloat(summaryRow.total_revenue);
      const totalCost = parseFloat(summaryRow.total_cost);
      const totalMiles = parseFloat(summaryRow.total_miles);

      const analytics = {
        summary: {
          periodLabel: "Last 30 Days",
          totalRevenue,
          totalCost,
          totalMiles,
          marginPercent: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
          avgRatePerMile: totalMiles > 0 ? totalRevenue / totalMiles : 0,
          avgCostPerMile: totalMiles > 0 ? totalCost / totalMiles : 0,
          profitableTrips: parseInt(summaryRow.profitable_trips),
          atRiskTrips: parseInt(summaryRow.at_risk_trips),
        },
        revenueTrend: trendRes.rows.map(row => ({
          ...row,
          revenue: parseFloat(row.revenue),
          cost: parseFloat(row.cost),
          miles: parseFloat(row.miles),
          marginPercent: parseFloat(row.marginPercent)
        })),
        marginByCategory: categoryRes.rows.map(row => ({
          category: row.category || "Unknown",
          revenue: parseFloat(row.revenue),
          marginPercent: parseFloat(row.marginPercent)
        })),
        driverPerformance: driverRes.rows.map(row => ({
          ...row,
          trips: parseInt(row.trips),
          revenue: parseFloat(row.revenue),
          marginPercent: parseFloat(row.marginPercent)
        })),
        lanePerformance: laneRes.rows.map(row => ({
          ...row,
          trips: parseInt(row.trips),
          revenue: parseFloat(row.revenue),
          miles: parseFloat(row.miles),
          marginPercent: parseFloat(row.marginPercent)
        })),
        marginDistribution: distRes.rows.map(row => ({
          band: `${row.band}%`,
          trips: parseInt(row.trips)
        })),
        alerts: alertsRes.rows,
        updatedAt: new Date().toISOString()
      };

      return NextResponse.json(analytics);

    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Analytics aggregation error:", error);
    return NextResponse.json(
      { error: "Failed to generate analytics" },
      { status: 500 }
    );
  }
}

