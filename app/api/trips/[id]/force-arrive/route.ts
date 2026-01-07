import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * POST /api/trips/[id]/force-arrive
 * 
 * Manually triggers an arrival event when geofence detection fails.
 * This pushes a Predictive Task Prompt to the ISAAC tablet for driver confirmation.
 * 
 * Workflow:
 * 1. Dispatcher clicks "Force Arrive" on TMS map
 * 2. TMS calculates if truck is within proximity threshold of stop
 * 3. Confirmation prompt appears on ISAAC tablet
 * 4. Driver confirms → webhook sends event back to TMS
 * 5. TMS moves trip from "In Transit" to "At Stop" and starts detention clock
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const body = await request.json().catch(() => ({}));
    const { stopId, proximityThresholdMeters = 500 } = body;

    // Fetch trip and current position
    const tripResult = await pool.query(`
      SELECT 
        t.id,
        t.trip_number,
        t.status,
        t.driver_id,
        t.unit_id,
        t.current_lat,
        t.current_lng,
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

    // Fetch stops to determine which stop to mark as arrived
    const stopsResult = await pool.query(`
      SELECT 
        id,
        stop_sequence,
        stop_type,
        location_name,
        latitude,
        longitude,
        status,
        geofence_radius
      FROM trip_stops
      WHERE trip_id = $1
      ORDER BY stop_sequence
    `, [tripId]);

    const stops = stopsResult.rows;

    // Determine target stop (either specified or next pending stop)
    let targetStop = stopId 
      ? stops.find((s: any) => s.id === stopId)
      : stops.find((s: any) => s.status === 'Pending' || s.status === 'In Progress');

    if (!targetStop) {
      return NextResponse.json(
        { error: "No pending stop found to force arrive" },
        { status: 400 }
      );
    }

    // Calculate proximity if we have positions
    let isWithinProximity = true;
    let distanceMeters = null;

    if (trip.current_lat && trip.current_lng && targetStop.latitude && targetStop.longitude) {
      distanceMeters = calculateDistanceMeters(
        parseFloat(trip.current_lat),
        parseFloat(trip.current_lng),
        parseFloat(targetStop.latitude),
        parseFloat(targetStop.longitude)
      );
      
      isWithinProximity = distanceMeters <= proximityThresholdMeters;
    }

    // Log the force arrive request
    await pool.query(`
      INSERT INTO trip_events (
        trip_id,
        event_type,
        event_timestamp,
        source,
        stop_sequence,
        location,
        metadata
      ) VALUES ($1, 'FORCE_ARRIVE_REQUESTED', NOW(), 'DISPATCH_TMS', $2, $3, $4)
    `, [
      tripId,
      targetStop.stop_sequence,
      targetStop.location_name,
      JSON.stringify({
        stopId: targetStop.id,
        stopType: targetStop.stop_type,
        distanceFromStop: distanceMeters,
        proximityThreshold: proximityThresholdMeters,
        withinProximity: isWithinProximity,
        requestedBy: 'dispatcher',
      })
    ]);

    // Send confirmation prompt to ISAAC tablet
    const isaacDeviceId = trip.isaac_device_id;
    let promptSent = false;
    let promptMessage = "";

    if (isaacDeviceId) {
      // In production, this calls ISAAC API:
      // await isaacApi.sendPredictiveTaskPrompt(isaacDeviceId, {
      //   type: 'CONFIRM_ARRIVAL',
      //   stopName: targetStop.location_name,
      //   stopType: targetStop.stop_type,
      // });

      promptSent = true;
      promptMessage = `Confirmation prompt sent to driver ${trip.driver_name}`;
      
      // For now, we'll create a pending confirmation record
      await pool.query(`
        INSERT INTO driver_confirmations (
          trip_id,
          stop_id,
          confirmation_type,
          requested_at,
          status,
          isaac_device_id,
          metadata
        ) VALUES ($1, $2, 'ARRIVAL', NOW(), 'PENDING', $3, $4)
        ON CONFLICT (trip_id, stop_id, confirmation_type) 
        WHERE status = 'PENDING'
        DO UPDATE SET requested_at = NOW()
      `, [
        tripId,
        targetStop.id,
        isaacDeviceId,
        JSON.stringify({
          proximityCheck: isWithinProximity,
          distanceMeters,
          truckLat: trip.current_lat,
          truckLng: trip.current_lng,
        })
      ]);
    } else {
      promptMessage = "No ISAAC device linked - manual arrival recorded";
      
      // Without ISAAC, directly mark as arrived (dispatcher override)
      await pool.query(`
        UPDATE trip_stops
        SET 
          status = 'In Progress',
          arrived_at = NOW(),
          arrival_source = 'DISPATCHER_OVERRIDE'
        WHERE id = $1
      `, [targetStop.id]);

      // Update trip status
      const newStatus = targetStop.stop_type === 'Pickup' ? 'At Pickup' : 'At Delivery';
      await pool.query(`
        UPDATE trips
        SET 
          status = $1,
          updated_at = NOW()
        WHERE id = $2
      `, [newStatus, tripId]);

      // Start detention clock if applicable
      await pool.query(`
        INSERT INTO detention_tracking (
          trip_id,
          stop_id,
          started_at,
          free_time_minutes
        ) VALUES ($1, $2, NOW(), 120)
        ON CONFLICT (trip_id, stop_id) DO NOTHING
      `, [tripId, targetStop.id]);

      // Log arrival event
      await pool.query(`
        INSERT INTO trip_events (
          trip_id,
          event_type,
          event_timestamp,
          source,
          stop_sequence,
          location,
          metadata
        ) VALUES ($1, $2, NOW(), 'DISPATCHER_OVERRIDE', $3, $4, $5)
      `, [
        tripId,
        targetStop.stop_type === 'Pickup' ? 'ARRIVED_PICKUP' : 'ARRIVED_DELIVERY',
        targetStop.stop_sequence,
        targetStop.location_name,
        JSON.stringify({
          forced: true,
          reason: 'Geofence detection failed',
          overrideBy: 'dispatcher',
        })
      ]);
    }

    return NextResponse.json({
      success: true,
      message: promptMessage,
      tripId,
      tripNumber: trip.trip_number,
      stop: {
        id: targetStop.id,
        type: targetStop.stop_type,
        location: targetStop.location_name,
        sequence: targetStop.stop_sequence,
      },
      proximity: {
        distanceMeters,
        threshold: proximityThresholdMeters,
        withinRange: isWithinProximity,
      },
      confirmation: {
        promptSent,
        awaitingDriverConfirmation: promptSent,
        deviceId: isaacDeviceId,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Force arrive error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to force arrive" },
      { status: 500 }
    );
  }
}

/**
 * Calculate distance between two coordinates in meters
 */
function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
