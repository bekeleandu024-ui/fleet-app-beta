import { NextResponse } from "next/server";
import pool from "@/lib/db";

// PATCH /api/farm-out/trips/[id]/status - Update farm-out trip status/phase
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { phase, notes } = body;

    // Validate phase
    const validPhases = [
      "pending",
      "posted",
      "covered",
      "in_transit",
      "delivered",
      "closed",
    ];

    if (!validPhases.includes(phase)) {
      return NextResponse.json(
        { success: false, error: `Invalid phase: ${phase}` },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get current trip data
      const tripResult = await client.query(
        `SELECT t.*, o.dispatch_status, o.pod_url 
         FROM trips t 
         LEFT JOIN orders o ON o.id = t.order_id 
         WHERE t.id = $1`,
        [id]
      );

      if (tripResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "Trip not found" },
          { status: 404 }
        );
      }

      const trip = tripResult.rows[0];

      // Validate phase transitions
      const currentPhase = mapDispatchStatusToPhase(trip.dispatch_status);
      const isValidTransition = validatePhaseTransition(currentPhase, phase);

      if (!isValidTransition) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            success: false,
            error: `Invalid transition from ${currentPhase} to ${phase}`,
          },
          { status: 400 }
        );
      }

      // Special validation: Cannot close without POD
      if (phase === "closed" && !trip.pod_url) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            success: false,
            error: "Cannot close trip without POD document",
            requiresPOD: true,
          },
          { status: 400 }
        );
      }

      // Map phase to dispatch_status and trip status
      const { dispatchStatus, tripStatus } = mapPhaseToStatuses(phase);

      // Update trip status
      await client.query(
        `UPDATE trips SET 
          status = $1,
          updated_at = NOW()
         WHERE id = $2`,
        [tripStatus, id]
      );

      // Update order dispatch status
      if (trip.order_id) {
        await client.query(
          `UPDATE orders SET 
            dispatch_status = $1,
            status = $2,
            updated_at = NOW()
           WHERE id = $3`,
          [dispatchStatus, getOrderStatus(phase), trip.order_id]
        );
      }

      // Log the status change
      await client.query(
        `INSERT INTO dispatch_actions (order_id, action_type, performed_by, notes)
         VALUES ($1, $2, 'SYSTEM', $3)`,
        [
          trip.order_id,
          `FARM_OUT_${phase.toUpperCase()}`,
          notes || `Trip moved to ${phase}`,
        ]
      );

      // Update timestamps based on phase
      if (phase === "in_transit") {
        await client.query(
          `UPDATE trips SET pickup_departure = NOW() WHERE id = $1`,
          [id]
        );
      } else if (phase === "delivered") {
        await client.query(
          `UPDATE trips SET delivery_arrival = NOW() WHERE id = $1`,
          [id]
        );
      } else if (phase === "closed") {
        await client.query(
          `UPDATE trips SET completed_at = NOW() WHERE id = $1`,
          [id]
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        data: {
          tripId: id,
          previousPhase: currentPhase,
          newPhase: phase,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating trip status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update trip status" },
      { status: 500 }
    );
  }
}

// GET /api/farm-out/trips/[id]/status - Get detailed trip status info
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          t.id,
          t.trip_number,
          t.status as trip_status,
          t.pickup_departure,
          t.delivery_arrival,
          t.completed_at,
          o.dispatch_status,
          o.quoted_rate,
          o.pod_url,
          o.billing_status,
          cb.carrier_name,
          cb.bid_amount as awarded_amount,
          cb.status as bid_status
         FROM trips t
         LEFT JOIN orders o ON o.id = t.order_id
         LEFT JOIN carrier_bids cb ON cb.order_id = o.id AND cb.status = 'ACCEPTED'
         WHERE t.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Trip not found" },
          { status: 404 }
        );
      }

      const row = result.rows[0];
      const phase = mapDispatchStatusToPhase(row.dispatch_status);

      return NextResponse.json({
        success: true,
        data: {
          tripId: row.id,
          tripNumber: row.trip_number,
          phase,
          tripStatus: row.trip_status,
          dispatchStatus: row.dispatch_status,
          carrierName: row.carrier_name,
          awardedAmount: row.awarded_amount ? parseFloat(row.awarded_amount) : null,
          customerRate: row.quoted_rate ? parseFloat(row.quoted_rate) : 0,
          podUploaded: !!row.pod_url,
          podUrl: row.pod_url,
          billingStatus: row.billing_status,
          timestamps: {
            pickupDeparture: row.pickup_departure,
            deliveryArrival: row.delivery_arrival,
            completedAt: row.completed_at,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching trip status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trip status" },
      { status: 500 }
    );
  }
}

// Helper functions
function mapDispatchStatusToPhase(dispatchStatus: string): string {
  switch (dispatchStatus) {
    case "BROKERAGE_PENDING":
      return "pending";
    case "POSTED_EXTERNAL":
      return "posted";
    case "COVERED_EXTERNAL":
      return "covered";
    case "IN_TRANSIT_EXTERNAL":
      return "in_transit";
    case "DELIVERED_EXTERNAL":
      return "delivered";
    case "CLOSED_EXTERNAL":
      return "closed";
    default:
      return "pending";
  }
}

function mapPhaseToStatuses(phase: string): {
  dispatchStatus: string;
  tripStatus: string;
} {
  switch (phase) {
    case "pending":
      return { dispatchStatus: "BROKERAGE_PENDING", tripStatus: "pending" };
    case "posted":
      return { dispatchStatus: "POSTED_EXTERNAL", tripStatus: "posted" };
    case "covered":
      return { dispatchStatus: "COVERED_EXTERNAL", tripStatus: "assigned" };
    case "in_transit":
      return { dispatchStatus: "IN_TRANSIT_EXTERNAL", tripStatus: "in_transit" };
    case "delivered":
      return { dispatchStatus: "DELIVERED_EXTERNAL", tripStatus: "completed" };
    case "closed":
      return { dispatchStatus: "CLOSED_EXTERNAL", tripStatus: "closed" };
    default:
      return { dispatchStatus: "BROKERAGE_PENDING", tripStatus: "pending" };
  }
}

function getOrderStatus(phase: string): string {
  switch (phase) {
    case "in_transit":
      return "In Transit";
    case "delivered":
      return "Delivered";
    case "closed":
      return "Completed";
    default:
      return "Pending";
  }
}

function validatePhaseTransition(from: string, to: string): boolean {
  const transitions: Record<string, string[]> = {
    pending: ["posted"],
    posted: ["covered", "pending"], // Can go back to pending
    covered: ["in_transit", "posted"], // Can go back to posted
    in_transit: ["delivered"],
    delivered: ["closed", "in_transit"], // Can go back if needed
    closed: [], // Terminal state
  };

  return transitions[from]?.includes(to) ?? false;
}
