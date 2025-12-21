import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { CustomsClearanceListItem, CustomsResponse } from "@/lib/types";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          t.id as trip_id,
          t.trip_number,
          t.created_at as trip_created_at,
          t.planned_start,
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
          c.submitted_documents
        FROM trips t
        LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
        LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
        LEFT JOIN customs_clearances c ON t.id = c.trip_id
        WHERE t.status NOT IN ('closed', 'completed')
        ORDER BY t.created_at DESC
      `;

      const result = await client.query(query);
      
      const customsList: CustomsClearanceListItem[] = result.rows.map(row => {
        const requiredDocs = row.required_documents ? (row.required_documents as any[]).length : 4;
        const submittedDocs = row.submitted_documents ? (row.submitted_documents as any[]).length : 0;

        return {
          id: row.clearance_id || `temp-${row.trip_id}`,
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
          assignedAgent: row.agent_name,
          flaggedAt: row.flagged_at 
            ? new Date(row.flagged_at).toISOString() 
            : new Date(row.trip_created_at).toISOString(),
          docsSubmittedAt: row.docs_submitted_at ? new Date(row.docs_submitted_at).toISOString() : undefined,
          requiredDocsCount: requiredDocs,
          submittedDocsCount: submittedDocs,
        };
      });

      // Calculate stats
      const stats = {
        pendingDocs: customsList.filter(i => i.status === "PENDING_DOCS").length,
        underReview: customsList.filter(i => i.status === "UNDER_REVIEW").length,
        approved: customsList.filter(i => i.status === "APPROVED").length,
        urgent: customsList.filter(i => i.priority === "URGENT").length,
      };

      // Calculate filters
      const filters = {
        statuses: Array.from(new Set(customsList.map(i => i.status))) as any[],
        priorities: Array.from(new Set(customsList.map(i => i.priority))),
        crossingPoints: Array.from(new Set(customsList.map(i => i.borderCrossingPoint))),
        agents: Array.from(new Set(customsList.map(i => i.assignedAgent).filter(Boolean) as string[])),
      };

      const response: CustomsResponse = {
        stats,
        filters,
        data: customsList,
      };

      return NextResponse.json(response);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching customs clearances:", error);
    return NextResponse.json(
      { error: "Failed to fetch customs clearances" },
      { status: 500 }
    );
  }
}

