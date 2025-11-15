import { Router } from "express";
import type { Request, Response } from "express";

import { pool } from "../db/client";
import { TripStatus } from "../models/tracking";
import { updateTripStatus } from "../services/tripService";

const router = Router();

const CUSTOMS_STATUSES = [
  "PENDING_DOCS",
  "DOCS_SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CLEARED",
] as const;

const CUSTOMS_PRIORITIES = ["URGENT", "HIGH", "NORMAL", "LOW"] as const;

const toIsoString = (value: unknown | null | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
};

const buildTripNumber = (tripId: string | number | null | undefined) => {
  const normalized =
    typeof tripId === "string"
      ? tripId
      : typeof tripId === "number"
      ? String(tripId)
      : tripId ?? "";
  if (!normalized) {
    return "TRIP-UNKNOWN";
  }
  const sanitized = normalized.replace(/[^a-zA-Z0-9]/g, "");
  return `TRIP-${sanitized.slice(0, 8).padEnd(8, "0").toUpperCase()}`;
};

const parseJsonValue = (
  value: unknown
): Record<string, unknown> | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return undefined;
    }
  }
  return value as Record<string, unknown>;
};

router.get("/", async (_req: Request, res: Response) => {
  try {
    const [clearancesResult, agentsResult] = await Promise.all([
      pool.query(`
      SELECT
        cc.id,
        cc.trip_id,
        cc.order_id,
        cc.status,
        cc.priority,
        cc.border_crossing_point,
        cc.crossing_direction,
        cc.estimated_crossing_time,
        cc.assigned_agent_id,
        cc.agent_name,
        cc.flagged_at,
        cc.docs_submitted_at,
        cc.required_documents,
        cc.submitted_documents,
        dp.driver_name,
        u.unit_number,
        t.id AS trip_identifier
      FROM customs_clearances cc
      JOIN trips t ON cc.trip_id = t.id
      LEFT JOIN driver_profiles dp ON cc.driver_id = dp.driver_id
      LEFT JOIN unit_profiles u ON cc.unit_id = u.unit_id
      WHERE cc.status <> 'CLEARED'
      ORDER BY
        CASE cc.priority
          WHEN 'URGENT' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'NORMAL' THEN 3
          WHEN 'LOW' THEN 4
        END,
        cc.estimated_crossing_time ASC NULLS LAST
    `),
      pool.query<{ agent_name: string }>(
        `SELECT agent_name FROM customs_agents WHERE is_active = true ORDER BY agent_name`
      ),
    ]);

    const clearances = clearancesResult.rows.map((row) => {
      const requiredDocs = Array.isArray(row.required_documents)
        ? row.required_documents
        : [];
      const submittedDocs = Array.isArray(row.submitted_documents)
        ? row.submitted_documents
        : [];
      const status = typeof row.status === "string" ? row.status : "PENDING_DOCS";
      const priority = typeof row.priority === "string" ? row.priority : "NORMAL";
      const borderCrossingPoint = row.border_crossing_point ?? "Unknown Crossing";
      const crossingDirection = row.crossing_direction ?? "UNKNOWN_DIRECTION";

      return {
        id: String(row.id),
        tripNumber: buildTripNumber(row.trip_identifier ?? row.trip_id),
        driverName: row.driver_name ?? "Unassigned",
        unitNumber: row.unit_number ?? "Pending",
        status,
        priority,
        borderCrossingPoint,
        crossingDirection,
        estimatedCrossingTime: toIsoString(row.estimated_crossing_time) ?? "",
        assignedAgent: row.agent_name ?? undefined,
        flaggedAt: toIsoString(row.flagged_at) ?? new Date().toISOString(),
        docsSubmittedAt: toIsoString(row.docs_submitted_at),
        requiredDocsCount: requiredDocs.length,
        submittedDocsCount: submittedDocs.length,
      };
    });

    const stats = {
      pendingDocs: clearances.filter((c) => c.status === "PENDING_DOCS").length,
      underReview: clearances.filter((c) =>
        c.status === "UNDER_REVIEW" || c.status === "DOCS_SUBMITTED"
      ).length,
      approved: clearances.filter((c) => c.status === "APPROVED").length,
      urgent: clearances.filter((c) => c.priority === "URGENT").length,
    };

    const crossingPointSet = new Set<string>();
    for (const clearance of clearances) {
      if (clearance.borderCrossingPoint) {
        crossingPointSet.add(clearance.borderCrossingPoint);
      }
    }

    const agentSet = new Set<string>();
    for (const agentRow of agentsResult.rows) {
      if (agentRow.agent_name) {
        agentSet.add(agentRow.agent_name);
      }
    }
    for (const clearance of clearances) {
      if (clearance.assignedAgent) {
        agentSet.add(clearance.assignedAgent);
      }
    }

    const filters = {
      statuses: [...CUSTOMS_STATUSES],
      priorities: [...CUSTOMS_PRIORITIES],
      crossingPoints: Array.from(crossingPointSet).sort((a, b) => a.localeCompare(b)),
      agents: Array.from(agentSet).sort((a, b) => a.localeCompare(b)),
    };

    res.json({
      stats,
      filters,
      data: clearances,
    });
  } catch (error) {
    console.error("Error fetching customs clearances", error);
    res.status(500).json({ error: "Failed to fetch customs clearances" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clearanceResult = await pool.query(`
      SELECT
        cc.*,
        dp.driver_name,
        u.unit_number,
        t.id AS trip_identifier,
        t.pickup_location,
        t.dropoff_location
      FROM customs_clearances cc
      JOIN trips t ON cc.trip_id = t.id
      LEFT JOIN driver_profiles dp ON cc.driver_id = dp.driver_id
      LEFT JOIN unit_profiles u ON cc.unit_id = u.unit_id
      WHERE cc.id = $1
    `, [id]);

    if (!clearanceResult.rowCount) {
      res.status(404).json({ error: "Clearance not found" });
      return;
    }

    const clearance = clearanceResult.rows[0];

    const docsResult = await pool.query(
      `SELECT * FROM customs_documents WHERE clearance_id = $1 ORDER BY uploaded_at DESC`,
      [id]
    );

    const logResult = await pool.query(
      `SELECT * FROM customs_activity_log WHERE clearance_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    const requiredDocs = Array.isArray(clearance.required_documents)
      ? clearance.required_documents.map((doc: unknown) => String(doc).toUpperCase())
      : [];

    const allowedDocumentStatuses = ["UPLOADED", "VERIFIED", "REJECTED", "EXPIRED"] as const;

    const normalizeDocumentStatus = (value: unknown) => {
      const status = typeof value === "string" ? value.toUpperCase() : "UPLOADED";
      return allowedDocumentStatuses.includes(status as (typeof allowedDocumentStatuses)[number])
        ? status
        : "UPLOADED";
    };

    const normalizeActorType = (value: unknown) => {
      const actorType = typeof value === "string" ? value.toUpperCase() : "SYSTEM";
      return ["DRIVER", "AGENT", "SYSTEM"].includes(actorType)
        ? actorType
        : "SYSTEM";
    };

    res.json({
      id: String(clearance.id),
      tripId: clearance.trip_id ? String(clearance.trip_id) : "",
      orderId: clearance.order_id ? String(clearance.order_id) : "",
      tripNumber: buildTripNumber(clearance.trip_identifier ?? clearance.trip_id),
      driverName: clearance.driver_name ?? "Unassigned",
      unitNumber: clearance.unit_number ?? "Pending",
      status: clearance.status,
      priority: clearance.priority,
      borderCrossingPoint: clearance.border_crossing_point ?? "Unknown Crossing",
      crossingDirection: clearance.crossing_direction ?? "UNKNOWN_DIRECTION",
      estimatedCrossingTime: toIsoString(clearance.estimated_crossing_time) ?? "",
      actualCrossingTime: toIsoString(clearance.actual_crossing_time),
      requiredDocuments: requiredDocs,
      submittedDocuments: docsResult.rows.map((doc) => {
        const documentType = (doc.document_type ?? "OTHER").toString().toUpperCase();
        return {
          id: String(doc.id),
          documentType,
          documentName: doc.document_name,
          fileUrl: doc.file_url ?? undefined,
          fileSizeKb: doc.file_size_kb ?? undefined,
          fileType: doc.file_type ?? undefined,
          status: normalizeDocumentStatus(doc.status),
          verificationNotes: doc.verification_notes ?? undefined,
          uploadedBy: doc.uploaded_by ?? "DRIVER",
          uploadedAt: toIsoString(doc.uploaded_at) ?? new Date().toISOString(),
          verifiedBy: doc.verified_by ?? undefined,
          verifiedAt: toIsoString(doc.verified_at),
        };
      }),
      assignedAgent: clearance.assigned_agent_id
        ? String(clearance.assigned_agent_id)
        : undefined,
      agentName: clearance.agent_name ?? undefined,
      reviewStartedAt: toIsoString(clearance.review_started_at),
      reviewCompletedAt: toIsoString(clearance.review_completed_at),
      reviewNotes: clearance.review_notes ?? undefined,
      rejectionReason: clearance.rejection_reason ?? undefined,
      activityLog: logResult.rows.map((log) => ({
        id: String(log.id),
        action: typeof log.action === "string" ? log.action : "SYSTEM_EVENT",
        actor: log.actor ? String(log.actor) : "System",
        actorType: normalizeActorType(log.actor_type),
        details: parseJsonValue(log.details),
        notes: log.notes ?? undefined,
        createdAt: toIsoString(log.created_at) ?? new Date().toISOString(),
      })),
      flaggedAt: toIsoString(clearance.flagged_at) ?? new Date().toISOString(),
      docsSubmittedAt: toIsoString(clearance.docs_submitted_at),
      approvedAt: toIsoString(clearance.approved_at),
      clearedAt: toIsoString(clearance.cleared_at),
    });
  } catch (error) {
    console.error("Error fetching clearance detail", error);
    res.status(500).json({ error: "Failed to fetch clearance detail" });
  }
});

router.post("/:id/documents", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { documentType, documentName, fileUrl, fileSizeKb, fileType, uploadedBy } = req.body;

    if (!documentType || !documentName) {
      res.status(400).json({ error: "documentType and documentName are required" });
      return;
    }

    const insertResult = await pool.query(
      `INSERT INTO customs_documents (
        clearance_id, document_type, document_name, file_url,
        file_size_kb, file_type, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [id, documentType, documentName, fileUrl ?? null, fileSizeKb ?? null, fileType ?? null, uploadedBy ?? "DRIVER"]
    );

    const inserted = insertResult.rows[0];

    await pool.query(
      `INSERT INTO customs_activity_log (clearance_id, action, actor, actor_type, details)
       VALUES ($1, 'DOC_UPLOADED', $2, 'DRIVER', $3::jsonb)`,
      [id, uploadedBy ?? "Driver", JSON.stringify({ documentType, documentName })]
    );

    await pool.query(
      `UPDATE customs_clearances
       SET submitted_documents = COALESCE(submitted_documents, '[]'::jsonb) || $1::jsonb,
           updated_at = NOW()
       WHERE id = $2`,
      [
        JSON.stringify({
          id: inserted.id,
          documentType,
          documentName,
          uploadedAt: toIsoString(inserted.uploaded_at) ?? new Date().toISOString(),
        }),
        id,
      ]
    );

    res.json({
      id: inserted.id,
      documentType: inserted.document_type,
      documentName: inserted.document_name,
      fileUrl: inserted.file_url ?? undefined,
      fileSizeKb: inserted.file_size_kb ?? undefined,
      fileType: inserted.file_type ?? undefined,
      status: inserted.status,
      verificationNotes: inserted.verification_notes ?? undefined,
      uploadedBy: inserted.uploaded_by ?? "DRIVER",
      uploadedAt: toIsoString(inserted.uploaded_at) ?? new Date().toISOString(),
      verifiedBy: inserted.verified_by ?? undefined,
      verifiedAt: toIsoString(inserted.verified_at),
    });
  } catch (error) {
    console.error("Error uploading document", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

router.post("/:id/submit", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE customs_clearances
       SET status = 'DOCS_SUBMITTED', docs_submitted_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    await pool.query(
      `INSERT INTO customs_activity_log (clearance_id, action, actor, actor_type)
       VALUES ($1, 'DOCS_SUBMITTED', 'Driver', 'DRIVER')`,
      [id]
    );

    res.json({ success: true, message: "Documents submitted for review" });
  } catch (error) {
    console.error("Error submitting documents", error);
    res.status(500).json({ error: "Failed to submit documents" });
  }
});

router.post("/:id/assign-agent", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { agentId, agentName } = req.body;

    if (!agentId || !agentName) {
      res.status(400).json({ error: "agentId and agentName are required" });
      return;
    }

    await pool.query(
      `UPDATE customs_clearances
       SET assigned_agent_id = $1,
           agent_name = $2,
           status = 'UNDER_REVIEW',
           review_started_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [agentId, agentName, id]
    );

    await pool.query(
      `UPDATE customs_agents
       SET current_workload = LEAST(max_concurrent_reviews, current_workload + 1)
       WHERE id = $1`,
      [agentId]
    );

    await pool.query(
      `INSERT INTO customs_activity_log (clearance_id, action, actor, actor_type)
       VALUES ($1, 'ASSIGNED_AGENT', $2, 'SYSTEM')`,
      [id, agentName]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error assigning agent", error);
    res.status(500).json({ error: "Failed to assign agent" });
  }
});

router.post("/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { agentName, notes } = req.body;

    await pool.query(
      `UPDATE customs_clearances
       SET status = 'APPROVED',
           review_completed_at = NOW(),
           approved_at = NOW(),
           review_notes = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [notes ?? null, id]
    );

    await pool.query(
      `INSERT INTO customs_activity_log (clearance_id, action, actor, actor_type, notes)
       VALUES ($1, 'APPROVED', $2, 'AGENT', $3)`,
      [id, agentName ?? "Agent", notes ?? null]
    );

    res.json({ success: true, message: "Clearance approved" });
  } catch (error) {
    console.error("Error approving clearance", error);
    res.status(500).json({ error: "Failed to approve clearance" });
  }
});

router.post("/:id/reject", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { agentName, reason } = req.body;

    await pool.query(
      `UPDATE customs_clearances
       SET status = 'REJECTED',
           review_completed_at = NOW(),
           rejection_reason = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [reason ?? null, id]
    );

    await pool.query(
      `INSERT INTO customs_activity_log (clearance_id, action, actor, actor_type, notes)
       VALUES ($1, 'REJECTED', $2, 'AGENT', $3)`,
      [id, agentName ?? "Agent", reason ?? null]
    );

    res.json({ success: true, message: "Clearance rejected" });
  } catch (error) {
    console.error("Error rejecting clearance", error);
    res.status(500).json({ error: "Failed to reject clearance" });
  }
});

router.post("/:id/clear", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clearanceResult = await pool.query<{ trip_id: string }>(
      `SELECT trip_id FROM customs_clearances WHERE id = $1`,
      [id]
    );

    if (!clearanceResult.rowCount) {
      res.status(404).json({ error: "Clearance not found" });
      return;
    }

    const tripId = clearanceResult.rows[0].trip_id;

    await pool.query(
      `UPDATE customs_clearances
       SET status = 'CLEARED', cleared_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    try {
      await updateTripStatus(tripId, TripStatus.IN_TRANSIT, {
        triggeredBy: "customs",
        reason: "Customs clearance completed",
      });
    } catch (statusError) {
      console.warn("Unable to update trip status during customs clear", statusError);
      await pool.query(
        `UPDATE trips SET status = $1, updated_at = NOW() WHERE id = $2`,
        [TripStatus.IN_TRANSIT, tripId]
      );
    }

    await pool.query(
      `INSERT INTO customs_activity_log (clearance_id, action, actor, actor_type)
       VALUES ($1, 'CLEARED', 'System', 'SYSTEM')`,
      [id]
    );

    res.json({ success: true, message: "Truck cleared for border crossing" });
  } catch (error) {
    console.error("Error clearing truck", error);
    res.status(500).json({ error: "Failed to clear truck" });
  }
});

export default router;
