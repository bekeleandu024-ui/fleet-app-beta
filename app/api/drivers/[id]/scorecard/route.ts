import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: driverId } = await context.params;
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "90");

  try {
    // Get driver profile
    const driverResult = await pool.query(
      `SELECT driver_id, driver_name, driver_type, oo_zone, is_active
       FROM driver_profiles
       WHERE driver_id = $1`,
      [driverId]
    );

    if (driverResult.rows.length === 0) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    const driver = driverResult.rows[0];

    // Get on-time performance
    const onTimeResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE on_time_delivery = true) as on_time_count,
        COUNT(*) FILTER (WHERE on_time_delivery IS NOT NULL) as total_deliveries,
        COUNT(*) FILTER (WHERE on_time_pickup = true) as on_time_pickup_count,
        COUNT(*) FILTER (WHERE on_time_pickup IS NOT NULL) as total_pickups
       FROM trips
       WHERE driver_id = $1
         AND created_at >= NOW() - INTERVAL '${days} days'`,
      [driverId]
    );

    // Get financial metrics - using actual column names
    const financialResult = await pool.query(
      `SELECT 
        AVG(tc.margin_pct) as avg_margin,
        AVG(CASE WHEN tc.total_miles > 0 THEN tc.profit / tc.total_miles ELSE 0 END) as avg_ppm,
        AVG(tc.revenue_per_mile) as avg_rpm,
        SUM(tc.revenue) as total_revenue,
        SUM(tc.profit) as total_profit,
        COUNT(*) as trips_with_costs
       FROM trip_costs tc
       JOIN trips t ON tc.trip_id = t.id
       WHERE t.driver_id = $1
         AND t.created_at >= NOW() - INTERVAL '${days} days'`,
      [driverId]
    );

    // Get trip counts
    const tripCountResult = await pool.query(
      `SELECT 
        COUNT(*) as total_trips,
        COUNT(*) FILTER (WHERE status = 'completed' OR status = 'Completed' OR status = 'closed') as completed_trips
       FROM trips
       WHERE driver_id = $1
         AND created_at >= NOW() - INTERVAL '${days} days'`,
      [driverId]
    );

    // Get utilization
    const utilizationResult = await pool.query(
      `SELECT 
        AVG(utilization_percent) as avg_utilization
       FROM trips
       WHERE driver_id = $1
         AND utilization_percent IS NOT NULL
         AND created_at >= NOW() - INTERVAL '${days} days'`,
      [driverId]
    );

    // Calculate metrics
    const onTime = onTimeResult.rows[0];
    const financial = financialResult.rows[0];
    const trips = tripCountResult.rows[0];
    const utilization = utilizationResult.rows[0];

    const onTimeDeliveryRate =
      parseInt(onTime.total_deliveries) > 0
        ? (parseInt(onTime.on_time_count) / parseInt(onTime.total_deliveries)) * 100
        : null;

    const onTimePickupRate =
      parseInt(onTime.total_pickups) > 0
        ? (parseInt(onTime.on_time_pickup_count) / parseInt(onTime.total_pickups)) * 100
        : null;

    const avgMargin = parseFloat(financial.avg_margin) || 0;

    // Calculate letter grade based on metrics
    function calculateGrade(margin: number, onTime: number | null): string {
      let score = 0;
      
      // Margin scoring (50% weight)
      if (margin >= 20) score += 50;
      else if (margin >= 15) score += 40;
      else if (margin >= 10) score += 30;
      else if (margin >= 5) score += 20;
      else if (margin >= 0) score += 10;
      
      // On-time scoring (50% weight)
      if (onTime !== null) {
        if (onTime >= 95) score += 50;
        else if (onTime >= 90) score += 40;
        else if (onTime >= 85) score += 30;
        else if (onTime >= 75) score += 20;
        else score += 10;
      } else {
        score += 25; // Neutral if no data
      }
      
      if (score >= 90) return 'A';
      if (score >= 80) return 'B';
      if (score >= 65) return 'C';
      if (score >= 50) return 'D';
      return 'F';
    }

    const grade = calculateGrade(avgMargin, onTimeDeliveryRate);

    return NextResponse.json({
      driver: {
        id: driver.driver_id,
        name: driver.driver_name,
        type: driver.driver_type,
        isActive: driver.is_active,
      },
      metrics: {
        onTimeDeliveryRate,
        onTimePickupRate,
        avgMargin,
        avgPpm: parseFloat(financial.avg_ppm) || 0,
        avgRpm: parseFloat(financial.avg_rpm) || 0,
        totalRevenue: parseFloat(financial.total_revenue) || 0,
        totalProfit: parseFloat(financial.total_profit) || 0,
        totalTrips: parseInt(trips.total_trips) || 0,
        completedTrips: parseInt(trips.completed_trips) || 0,
        utilizationRate: parseFloat(utilization.avg_utilization) || 0,
      },
      grade,
      periodDays: days,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    console.error("Error fetching driver scorecard:", error);
    return NextResponse.json(
      { error: "Failed to fetch driver scorecard", details: error.message },
      { status: 500 }
    );
  }
}
