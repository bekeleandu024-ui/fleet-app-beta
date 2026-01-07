import { NextRequest, NextResponse } from "next/server";
import { predictTripETA, scanTripsForExceptions } from "@/lib/fleet-ai";
import pool from "@/lib/db";

// GET /api/ai/trip-eta - Scan all active trips for exceptions
export async function GET() {
  try {
    // Fetch all active trips
    const tripsResult = await pool.query(`
      SELECT t.*, 
             d.name as driver_name, d.type as driver_type, d.hos_remaining,
             u.unit_number,
             o.customer_name, o.revenue
      FROM trips t
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN units u ON t.unit_id = u.id
      LEFT JOIN orders o ON t.order_id = o.id
      WHERE t.status IN ('Assigned', 'Dispatched', 'At Pickup', 'In Transit', 'At Delivery')
      ORDER BY t.delivery_window_start ASC
    `);

    const trips = tripsResult.rows.map((t: any) => ({
      id: t.id,
      tripNumber: t.trip_number,
      status: t.status,
      pickup: `${t.pickup_city}, ${t.pickup_state}`,
      delivery: `${t.delivery_city}, ${t.delivery_state}`,
      pickupWindow: { start: t.pickup_window_start, end: t.pickup_window_end },
      deliveryWindow: { start: t.delivery_window_start, end: t.delivery_window_end },
      driver: t.driver_name,
      driverType: t.driver_type,
      hosRemaining: t.hos_remaining,
      unit: t.unit_number,
      customer: t.customer_name,
      currentLat: t.current_lat,
      currentLng: t.current_lng,
      estimatedMiles: t.estimated_distance || t.estimated_miles,
      actualStart: t.actual_start
    }));

    const exceptionScan = await scanTripsForExceptions(trips);

    return NextResponse.json({
      totalActiveTrips: trips.length,
      ...exceptionScan
    });
  } catch (error: any) {
    console.error("Trip ETA scan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to scan trips" },
      { status: 500 }
    );
  }
}

// POST /api/ai/trip-eta - Get ETA prediction for specific trip
export async function POST(request: NextRequest) {
  try {
    const { tripId, currentLocation, weather, traffic, borderConditions } = await request.json();

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      );
    }

    // Fetch trip details
    const tripResult = await pool.query(`
      SELECT t.*, 
             d.name as driver_name, d.type as driver_type, d.hos_remaining,
             u.unit_number,
             o.customer_name, o.revenue
      FROM trips t
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN units u ON t.unit_id = u.id
      LEFT JOIN orders o ON t.order_id = o.id
      WHERE t.id = $1
    `, [tripId]);

    if (tripResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      );
    }

    const t = tripResult.rows[0];
    const trip = {
      id: t.id,
      tripNumber: t.trip_number,
      status: t.status,
      pickup: `${t.pickup_city}, ${t.pickup_state}`,
      delivery: `${t.delivery_city}, ${t.delivery_state}`,
      pickupWindow: { start: t.pickup_window_start, end: t.pickup_window_end },
      deliveryWindow: { start: t.delivery_window_start, end: t.delivery_window_end },
      driver: t.driver_name,
      driverType: t.driver_type,
      hosRemaining: t.hos_remaining,
      unit: t.unit_number,
      customer: t.customer_name,
      currentLat: currentLocation?.lat || t.current_lat,
      currentLng: currentLocation?.lng || t.current_lng,
      estimatedMiles: t.estimated_distance || t.estimated_miles,
      actualStart: t.actual_start
    };

    const prediction = await predictTripETA({
      trip,
      currentLocation,
      weather,
      traffic,
      borderConditions
    });

    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error("Trip ETA prediction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to predict ETA" },
      { status: 500 }
    );
  }
}
