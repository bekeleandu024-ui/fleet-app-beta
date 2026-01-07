import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * POST /api/trips/[id]/force-ping
 * 
 * Sends a request to the ISAAC ELD system to immediately refresh GPS location.
 * This wakes up the tablet and requests an immediate location update.
 * 
 * Dispatcher Action Flow:
 * 1. Dispatcher clicks "Force Ping" on TMS
 * 2. TMS sends API request to ISAAC
 * 3. ISAAC tablet wakes up (if screen-locked)
 * 4. Fresh GPS coordinates sent back to TMS
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;

    // Fetch trip details for ISAAC integration
    const tripResult = await pool.query(`
      SELECT 
        t.id,
        t.trip_number,
        t.driver_id,
        t.unit_id,
        d.isaac_device_id,
        d.name as driver_name,
        u.unit_number
      FROM trips t
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN units u ON t.unit_id = u.id
      WHERE t.id = $1
    `, [tripId]);

    if (tripResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      );
    }

    const trip = tripResult.rows[0];
    const isaacDeviceId = trip.isaac_device_id;

    // Log the force ping request
    await pool.query(`
      INSERT INTO trip_events (
        trip_id,
        event_type,
        event_timestamp,
        source,
        metadata
      ) VALUES ($1, 'FORCE_PING_REQUESTED', NOW(), 'DISPATCH_TMS', $2)
    `, [tripId, JSON.stringify({
      requestedBy: 'dispatcher',
      deviceId: isaacDeviceId,
      unitNumber: trip.unit_number,
    })]);

    // Simulate ISAAC API call for force ping
    // In production, this would call the actual ISAAC API:
    // await isaacApi.requestLocationUpdate(isaacDeviceId);
    
    let pingSuccess = true;
    let newPosition = null;
    let responseMessage = "Force ping request sent to ISAAC device";

    // Simulate ISAAC response (in production, this comes from webhook)
    if (isaacDeviceId) {
      // Simulate getting a fresh GPS position
      newPosition = await simulateIsaacPingResponse(tripId, trip);
      
      if (newPosition) {
        // Update trip with new position
        await pool.query(`
          UPDATE trips
          SET 
            current_lat = $1,
            current_lng = $2,
            current_speed = $3,
            current_heading = $4,
            last_ping_time = NOW(),
            eld_connected = true,
            updated_at = NOW()
          WHERE id = $5
        `, [
          newPosition.lat,
          newPosition.lng,
          newPosition.speed,
          newPosition.heading,
          tripId
        ]);

        // Record GPS ping in history
        await pool.query(`
          INSERT INTO gps_pings (
            trip_id,
            driver_id,
            unit_id,
            latitude,
            longitude,
            speed,
            heading,
            recorded_at,
            source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'FORCE_PING')
        `, [
          tripId,
          trip.driver_id,
          trip.unit_id,
          newPosition.lat,
          newPosition.lng,
          newPosition.speed,
          newPosition.heading
        ]);

        responseMessage = "Force ping successful - location updated";
      }
    } else {
      pingSuccess = false;
      responseMessage = "No ISAAC device linked to driver";
    }

    // Log the result
    await pool.query(`
      INSERT INTO trip_events (
        trip_id,
        event_type,
        event_timestamp,
        source,
        metadata
      ) VALUES ($1, $2, NOW(), 'ISAAC_ELD', $3)
    `, [
      tripId,
      pingSuccess ? 'FORCE_PING_SUCCESS' : 'FORCE_PING_FAILED',
      JSON.stringify({
        success: pingSuccess,
        newPosition,
        message: responseMessage,
      })
    ]);

    return NextResponse.json({
      success: pingSuccess,
      message: responseMessage,
      tripId,
      tripNumber: trip.trip_number,
      currentPosition: newPosition,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Force ping error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send force ping" },
      { status: 500 }
    );
  }
}

/**
 * Simulate ISAAC ELD ping response
 * In production, this would be replaced by actual ISAAC webhook handling
 */
async function simulateIsaacPingResponse(tripId: string, trip: any) {
  // Get current position or generate near last known
  const lastPosition = await pool.query(`
    SELECT latitude, longitude, speed, heading
    FROM gps_pings
    WHERE trip_id = $1
    ORDER BY recorded_at DESC
    LIMIT 1
  `, [tripId]);

  if (lastPosition.rows.length > 0) {
    const last = lastPosition.rows[0];
    // Simulate slight movement
    return {
      lat: parseFloat(last.latitude) + (Math.random() - 0.5) * 0.001,
      lng: parseFloat(last.longitude) + (Math.random() - 0.5) * 0.001,
      speed: Math.round(Math.random() * 60),
      heading: Math.round(Math.random() * 360),
    };
  }

  // Default position (Toronto area) if no history
  return {
    lat: 43.6532 + (Math.random() - 0.5) * 0.01,
    lng: -79.3832 + (Math.random() - 0.5) * 0.01,
    speed: Math.round(Math.random() * 60),
    heading: Math.round(Math.random() * 360),
  };
}
