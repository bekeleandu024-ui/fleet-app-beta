import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * POST /api/trips/[id]/driver-confirm
 * 
 * Webhook endpoint for ISAAC to send driver confirmation events.
 * Called when driver taps "Confirm Arrival" on the ISAAC tablet.
 * 
 * Flow:
 * 1. Driver receives confirmation prompt on ISAAC tablet
 * 2. Driver taps "Confirm Arrival" button
 * 3. ISAAC sends webhook to this endpoint
 * 4. TMS updates trip status and starts detention clock
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const body = await request.json();
    
    const { 
      confirmationType, // 'ARRIVAL' | 'DEPARTURE' | 'LOADED' | 'UNLOADED'
      stopId,
      driverConfirmed,
      isaacDeviceId,
      latitude,
      longitude,
      timestamp,
      metadata = {}
    } = body;

    if (!confirmationType || driverConfirmed === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: confirmationType, driverConfirmed" },
        { status: 400 }
      );
    }

    // Fetch trip details
    const tripResult = await pool.query(`
      SELECT 
        t.id,
        t.trip_number,
        t.status,
        t.driver_id,
        d.name as driver_name
      FROM trips t
      LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = $1
    `, [tripId]);

    if (tripResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      );
    }

    const trip = tripResult.rows[0];

    // Get the pending confirmation
    const confirmationResult = await pool.query(`
      SELECT id, stop_id
      FROM driver_confirmations
      WHERE trip_id = $1 
        AND confirmation_type = $2 
        AND status = 'PENDING'
      ORDER BY requested_at DESC
      LIMIT 1
    `, [tripId, confirmationType]);

    const targetStopId = stopId || confirmationResult.rows[0]?.stop_id;

    // Get stop details
    let targetStop = null;
    if (targetStopId) {
      const stopResult = await pool.query(`
        SELECT id, stop_sequence, stop_type, location_name
        FROM trip_stops
        WHERE id = $1 AND trip_id = $2
      `, [targetStopId, tripId]);
      targetStop = stopResult.rows[0];
    }

    if (driverConfirmed) {
      // ═══════════════════════════════════════════════════════════════════
      // DRIVER CONFIRMED - Update trip and stop status
      // ═══════════════════════════════════════════════════════════════════
      
      let eventType: string;
      let newTripStatus: string;
      let stopUpdate: { status: string; column: string };

      switch (confirmationType) {
        case 'ARRIVAL':
          eventType = targetStop?.stop_type === 'Pickup' ? 'ARRIVED_PICKUP' : 'ARRIVED_DELIVERY';
          newTripStatus = targetStop?.stop_type === 'Pickup' ? 'At Pickup' : 'At Delivery';
          stopUpdate = { status: 'In Progress', column: 'arrived_at' };
          break;
        case 'DEPARTURE':
          eventType = targetStop?.stop_type === 'Pickup' ? 'LOADED_DEPART' : 'UNLOADED_COMPLETE';
          newTripStatus = 'In Transit';
          stopUpdate = { status: 'Completed', column: 'departed_at' };
          break;
        case 'LOADED':
          eventType = 'LOADED_DEPART';
          newTripStatus = 'In Transit';
          stopUpdate = { status: 'Completed', column: 'departed_at' };
          break;
        case 'UNLOADED':
          eventType = 'UNLOADED_COMPLETE';
          newTripStatus = 'Completed';
          stopUpdate = { status: 'Completed', column: 'departed_at' };
          break;
        default:
          eventType = 'DRIVER_CONFIRMATION';
          newTripStatus = trip.status;
          stopUpdate = { status: 'In Progress', column: 'updated_at' };
      }

      // Update stop status
      if (targetStopId) {
        await pool.query(`
          UPDATE trip_stops
          SET 
            status = $1,
            ${stopUpdate.column} = NOW(),
            arrival_source = 'DRIVER_CONFIRMED'
          WHERE id = $2
        `, [stopUpdate.status, targetStopId]);

        // Start detention clock on arrival
        if (confirmationType === 'ARRIVAL') {
          await pool.query(`
            INSERT INTO detention_tracking (
              trip_id,
              stop_id,
              started_at,
              free_time_minutes
            ) VALUES ($1, $2, NOW(), 120)
            ON CONFLICT (trip_id, stop_id) DO UPDATE SET started_at = NOW()
          `, [tripId, targetStopId]);
        }

        // End detention clock on departure
        if (confirmationType === 'DEPARTURE' || confirmationType === 'LOADED' || confirmationType === 'UNLOADED') {
          await pool.query(`
            UPDATE detention_tracking
            SET ended_at = NOW()
            WHERE trip_id = $1 AND stop_id = $2 AND ended_at IS NULL
          `, [tripId, targetStopId]);
        }
      }

      // Update trip status
      await pool.query(`
        UPDATE trips
        SET 
          status = $1,
          current_lat = COALESCE($2, current_lat),
          current_lng = COALESCE($3, current_lng),
          last_ping_time = NOW(),
          updated_at = NOW()
        WHERE id = $4
      `, [newTripStatus, latitude, longitude, tripId]);

      // Update confirmation record
      if (confirmationResult.rows.length > 0) {
        await pool.query(`
          UPDATE driver_confirmations
          SET 
            status = 'CONFIRMED',
            confirmed_at = NOW(),
            confirmed_lat = $1,
            confirmed_lng = $2
          WHERE id = $3
        `, [latitude, longitude, confirmationResult.rows[0].id]);
      }

      // Log the event
      await pool.query(`
        INSERT INTO trip_events (
          trip_id,
          event_type,
          event_timestamp,
          source,
          stop_sequence,
          location,
          latitude,
          longitude,
          metadata
        ) VALUES ($1, $2, NOW(), 'DRIVER_CONFIRMED', $3, $4, $5, $6, $7)
      `, [
        tripId,
        eventType,
        targetStop?.stop_sequence || 0,
        targetStop?.location_name || 'Unknown',
        latitude,
        longitude,
        JSON.stringify({
          ...metadata,
          isaacDeviceId,
          driverName: trip.driver_name,
          confirmationType,
        })
      ]);

      return NextResponse.json({
        success: true,
        message: `Driver confirmed ${confirmationType.toLowerCase()}`,
        tripId,
        tripNumber: trip.trip_number,
        newStatus: newTripStatus,
        stop: targetStop ? {
          id: targetStop.id,
          type: targetStop.stop_type,
          location: targetStop.location_name,
          status: stopUpdate.status,
        } : null,
        detentionClockStarted: confirmationType === 'ARRIVAL',
        timestamp: new Date().toISOString(),
      });
    } else {
      // ═══════════════════════════════════════════════════════════════════
      // DRIVER DECLINED - Log and notify dispatcher
      // ═══════════════════════════════════════════════════════════════════
      
      // Update confirmation record
      if (confirmationResult.rows.length > 0) {
        await pool.query(`
          UPDATE driver_confirmations
          SET 
            status = 'DECLINED',
            declined_at = NOW(),
            decline_reason = $1
          WHERE id = $2
        `, [metadata.reason || 'Driver declined', confirmationResult.rows[0].id]);
      }

      // Log the declined event
      await pool.query(`
        INSERT INTO trip_events (
          trip_id,
          event_type,
          event_timestamp,
          source,
          stop_sequence,
          location,
          metadata
        ) VALUES ($1, 'CONFIRMATION_DECLINED', NOW(), 'DRIVER_DECLINED', $2, $3, $4)
      `, [
        tripId,
        targetStop?.stop_sequence || 0,
        targetStop?.location_name || 'Unknown',
        JSON.stringify({
          confirmationType,
          reason: metadata.reason || 'Driver declined without reason',
          isaacDeviceId,
          driverName: trip.driver_name,
        })
      ]);

      return NextResponse.json({
        success: false,
        message: "Driver declined confirmation",
        tripId,
        tripNumber: trip.trip_number,
        reason: metadata.reason || 'No reason provided',
        requiresDispatcherAction: true,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error("Driver confirmation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process driver confirmation" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/trips/[id]/driver-confirm
 * 
 * Get pending confirmations for a trip
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;

    const result = await pool.query(`
      SELECT 
        dc.id,
        dc.confirmation_type,
        dc.requested_at,
        dc.status,
        dc.confirmed_at,
        dc.declined_at,
        dc.decline_reason,
        ts.stop_type,
        ts.location_name,
        ts.stop_sequence
      FROM driver_confirmations dc
      LEFT JOIN trip_stops ts ON dc.stop_id = ts.id
      WHERE dc.trip_id = $1
      ORDER BY dc.requested_at DESC
    `, [tripId]);

    return NextResponse.json({
      tripId,
      confirmations: result.rows.map((c: any) => ({
        id: c.id,
        type: c.confirmation_type,
        status: c.status,
        requestedAt: c.requested_at,
        confirmedAt: c.confirmed_at,
        declinedAt: c.declined_at,
        declineReason: c.decline_reason,
        stop: {
          type: c.stop_type,
          location: c.location_name,
          sequence: c.stop_sequence,
        },
      })),
      pendingCount: result.rows.filter((c: any) => c.status === 'PENDING').length,
    });
  } catch (error: any) {
    console.error("Get confirmations error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get confirmations" },
      { status: 500 }
    );
  }
}
