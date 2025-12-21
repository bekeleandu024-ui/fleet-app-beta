import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { CustomsClearanceDetail } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          t.id as trip_id,
          t.trip_number,
          t.created_at as trip_created_at,
          t.planned_start,
          t.order_id,
          d.driver_name,
          u.unit_number,
          c.id as clearance_id,
          c.status,
          c.priority,
          c.border_crossing_point,
          c.crossing_direction,
          c.estimated_crossing_time,
          c.agent_name,
          c.flagged_at,
          c.docs_submitted_at,
          c.required_documents,
          c.submitted_documents,
          c.review_notes,
          c.rejection_reason,
          c.review_started_at,
          c.review_completed_at,
          c.approved_at,
          c.cleared_at
        FROM trips t
        LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
        LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
        LEFT JOIN customs_clearances c ON t.id = c.trip_id
      `;

      let searchId = id;
      let param = "";

      if (id.startsWith("temp-")) {
        param = id.replace("temp-", "");
        query += ` WHERE t.id = $1`;
      } else {
        param = id;
        query += ` WHERE c.id = $1`;
      }

      const result = await client.query(query, [param]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Customs clearance not found" },
          { status: 404 }
        );
      }

      const row = result.rows[0];
      
      // Fetch activity log
      let activityLog: any[] = [];
      if (row.clearance_id) {
        const activityRes = await client.query(
          `SELECT * FROM customs_activity_log WHERE clearance_id = $1 ORDER BY created_at DESC`,
          [row.clearance_id]
        );
        activityLog = activityRes.rows.map(r => ({
          id: r.id,
          action: r.action,
          actor: r.actor,
          actorType: r.actor_type,
          details: r.details,
          notes: r.notes,
          createdAt: new Date(r.created_at).toISOString()
        }));
      }

      // Construct detail object
      const detail: CustomsClearanceDetail = {
          id: row.clearance_id || `temp-${row.trip_id}`,
          tripId: row.trip_id,
          orderId: row.order_id || "unknown",
          tripNumber: row.trip_number || "UNKNOWN",
          driverName: row.driver_name || "Unknown Driver",
          unitNumber: row.unit_number || "N/A",
          status: row.status || "PENDING_DOCS",
          priority: row.priority || "NORMAL",
          borderCrossingPoint: row.border_crossing_point || "Laredo, TX",
          crossingDirection: row.crossing_direction || "US_TO_MX",
          estimatedCrossingTime: row.estimated_crossing_time 
            ? new Date(row.estimated_crossing_time).toISOString() 
            : (row.planned_start ? new Date(row.planned_start).toISOString() : new Date().toISOString()),
          assignedAgent: undefined,
          agentName: row.agent_name,
          reviewStartedAt: row.review_started_at ? new Date(row.review_started_at).toISOString() : undefined,
          reviewCompletedAt: row.review_completed_at ? new Date(row.review_completed_at).toISOString() : undefined,
          reviewNotes: row.review_notes,
          rejectionReason: row.rejection_reason,
          activityLog: activityLog,
          flaggedAt: row.flagged_at 
            ? new Date(row.flagged_at).toISOString() 
            : new Date(row.trip_created_at).toISOString(),
          docsSubmittedAt: row.docs_submitted_at ? new Date(row.docs_submitted_at).toISOString() : undefined,
          approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : undefined,
          clearedAt: row.cleared_at ? new Date(row.cleared_at).toISOString() : undefined,
          requiredDocuments: row.required_documents || ["COMMERCIAL_INVOICE", "BILL_OF_LADING"],
          submittedDocuments: row.submitted_documents || [],
      };

      return NextResponse.json(detail);

    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching customs detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch customs detail" },
      { status: 500 }
    );
  }
}
