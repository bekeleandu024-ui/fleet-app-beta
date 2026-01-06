import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: tripId } = await context.params;
  const { searchParams } = new URL(request.url);
  const comparisonType = searchParams.get("type") || "all";
  const pickup = searchParams.get("pickup");
  const dropoff = searchParams.get("dropoff");

  try {
    // Check if tripId is a UUID or trip_number
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tripId);
    const whereClause = isUUID ? 't.id = $1' : 't.trip_number = $1';

    // Get trip details first
    // Note: trip_costs has columns: margin_pct, profit, revenue_per_mile, cost_per_mile, total_miles
    // We calculate PPM as profit/total_miles
    const tripResult = await pool.query(
      `SELECT t.*, 
         tc.margin_pct, 
         tc.profit,
         tc.total_miles as tc_total_miles,
         tc.revenue_per_mile,
         tc.cost_per_mile,
         CASE WHEN tc.total_miles > 0 THEN tc.profit / tc.total_miles ELSE 0 END as ppm,
         dp.driver_type
       FROM trips t
       LEFT JOIN trip_costs tc ON t.id = tc.trip_id
       LEFT JOIN driver_profiles dp ON t.driver_id = dp.driver_id
       WHERE ${whereClause}`,
      [tripId]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const trip = tripResult.rows[0];
    const pickupLocation = pickup || trip.pickup_location;
    const dropoffLocation = dropoff || trip.dropoff_location;

    const response: Record<string, any> = {};

    // Lane average (same origin/destination)
    if (comparisonType === "all" || comparisonType === "lane") {
      const laneResult = await pool.query(
        `SELECT 
          AVG(tc.margin_pct) as lane_avg_margin,
          AVG(CASE WHEN tc.total_miles > 0 THEN tc.profit / tc.total_miles ELSE 0 END) as lane_avg_ppm,
          AVG(tc.revenue_per_mile) as lane_avg_rpm,
          COUNT(*) as lane_trip_count
        FROM trip_costs tc
        JOIN trips t ON tc.trip_id = t.id
        WHERE t.pickup_location = $1 
          AND t.dropoff_location = $2
          AND t.id != $3
          AND tc.margin_pct IS NOT NULL`,
        [pickupLocation, dropoffLocation, tripId]
      );

      response.lane = {
        avgMargin: parseFloat(laneResult.rows[0]?.lane_avg_margin) || 0,
        avgPpm: parseFloat(laneResult.rows[0]?.lane_avg_ppm) || 0,
        avgRpm: parseFloat(laneResult.rows[0]?.lane_avg_rpm) || 0,
        tripCount: parseInt(laneResult.rows[0]?.lane_trip_count) || 0,
      };
    }

    // Driver average (same driver)
    if (comparisonType === "all" || comparisonType === "driver") {
      if (trip.driver_id) {
        const driverResult = await pool.query(
          `SELECT 
            AVG(tc.margin_pct) as driver_avg_margin,
            AVG(CASE WHEN tc.total_miles > 0 THEN tc.profit / tc.total_miles ELSE 0 END) as driver_avg_ppm,
            AVG(tc.revenue_per_mile) as driver_avg_rpm,
            COUNT(*) as driver_trip_count
          FROM trip_costs tc
          JOIN trips t ON tc.trip_id = t.id
          WHERE t.driver_id = $1 
            AND t.id != $2
            AND tc.margin_pct IS NOT NULL`,
          [trip.driver_id, tripId]
        );

        response.driver = {
          avgMargin: parseFloat(driverResult.rows[0]?.driver_avg_margin) || 0,
          avgPpm: parseFloat(driverResult.rows[0]?.driver_avg_ppm) || 0,
          avgRpm: parseFloat(driverResult.rows[0]?.driver_avg_rpm) || 0,
          tripCount: parseInt(driverResult.rows[0]?.driver_trip_count) || 0,
        };
      } else {
        response.driver = null;
      }
    }

    // Driver type average (COM/RNR/OO)
    if (comparisonType === "all" || comparisonType === "driverType") {
      if (trip.driver_type) {
        const typeResult = await pool.query(
          `SELECT 
            AVG(tc.margin_pct) as type_avg_margin,
            AVG(CASE WHEN tc.total_miles > 0 THEN tc.profit / tc.total_miles ELSE 0 END) as type_avg_ppm,
            AVG(tc.revenue_per_mile) as type_avg_rpm,
            COUNT(*) as type_trip_count
          FROM trip_costs tc
          JOIN trips t ON tc.trip_id = t.id
          JOIN driver_profiles dp ON t.driver_id = dp.driver_id
          WHERE dp.driver_type = $1
            AND tc.margin_pct IS NOT NULL`,
          [trip.driver_type]
        );

        response.driverType = {
          type: trip.driver_type,
          avgMargin: parseFloat(typeResult.rows[0]?.type_avg_margin) || 0,
          avgPpm: parseFloat(typeResult.rows[0]?.type_avg_ppm) || 0,
          avgRpm: parseFloat(typeResult.rows[0]?.type_avg_rpm) || 0,
          tripCount: parseInt(typeResult.rows[0]?.type_trip_count) || 0,
        };
      } else {
        response.driverType = null;
      }
    }

    // Current trip metrics for comparison
    response.currentTrip = {
      margin: parseFloat(trip.margin_pct) || 0,
      ppm: parseFloat(trip.ppm) || 0,
      rpm: parseFloat(trip.revenue_per_mile) || 0,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    console.error("Error fetching trip comparison:", error);
    return NextResponse.json(
      { error: "Failed to fetch comparison data", details: error.message },
      { status: 500 }
    );
  }
}
