"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("../db/client");
const tracking_1 = require("../models/tracking");
const tripService_1 = require("../services/tripService");
const router = (0, express_1.Router)();
const DEFAULT_FILTERS = {
    statuses: ["PENDING_DOCS", "DOCS_SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"],
    priorities: ["URGENT", "HIGH", "NORMAL", "LOW"],
    crossingPoints: [
        "Ambassador Bridge",
        "Blue Water Bridge",
        "Peace Bridge",
        "Rainbow Bridge",
    ],
    agents: [
        "Buckland - John Smith",
        "Buckland - Sarah Johnson",
        "Livingston - Mike Davis",
    ],
};
const toIsoString = (value) => {
    if (!value) {
        return undefined;
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }
    return date.toISOString();
};
const buildTripNumber = (tripId) => `TRIP-${tripId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
router.get("/", async (_req, res) => {
    try {
        const result = await client_1.pool.query(`
      SELECT
        cc.id,
        cc.trip_id,
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
    `);
        const clearances = result.rows.map((row) => {
            const requiredDocs = Array.isArray(row.required_documents)
                ? row.required_documents
                : [];
            const submittedDocs = Array.isArray(row.submitted_documents)
                ? row.submitted_documents
                : [];
            return {
                id: row.id,
                tripNumber: buildTripNumber(row.trip_identifier ?? row.trip_id),
                driverName: row.driver_name ?? "Unassigned",
                unitNumber: row.unit_number ?? "Pending",
                status: row.status,
                priority: row.priority,
                borderCrossingPoint: row.border_crossing_point,
                crossingDirection: row.crossing_direction,
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
            underReview: clearances.filter((c) => c.status === "UNDER_REVIEW").length,
            approved: clearances.filter((c) => c.status === "APPROVED").length,
            urgent: clearances.filter((c) => c.priority === "URGENT").length,
        };
        res.json({
            stats,
            filters: DEFAULT_FILTERS,
            data: clearances,
        });
    }
    catch (error) {
        console.error("Error fetching customs clearances", error);
        res.status(500).json({ error: "Failed to fetch customs clearances" });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const clearanceResult = await client_1.pool.query(`
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
        const docsResult = await client_1.pool.query(`SELECT * FROM customs_documents WHERE clearance_id = $1 ORDER BY uploaded_at DESC`, [id]);
        const logResult = await client_1.pool.query(`SELECT * FROM customs_activity_log WHERE clearance_id = $1 ORDER BY created_at DESC`, [id]);
        const requiredDocs = Array.isArray(clearance.required_documents)
            ? clearance.required_documents
            : [];
        res.json({
            id: clearance.id,
            tripId: clearance.trip_id,
            orderId: clearance.order_id,
            tripNumber: buildTripNumber(clearance.trip_identifier ?? clearance.trip_id),
            driverName: clearance.driver_name ?? "Unassigned",
            unitNumber: clearance.unit_number ?? "Pending",
            status: clearance.status,
            priority: clearance.priority,
            borderCrossingPoint: clearance.border_crossing_point,
            crossingDirection: clearance.crossing_direction,
            estimatedCrossingTime: toIsoString(clearance.estimated_crossing_time) ?? "",
            actualCrossingTime: toIsoString(clearance.actual_crossing_time),
            requiredDocuments: requiredDocs,
            submittedDocuments: docsResult.rows.map((doc) => ({
                id: doc.id,
                documentType: doc.document_type,
                documentName: doc.document_name,
                fileUrl: doc.file_url ?? undefined,
                fileSizeKb: doc.file_size_kb ?? undefined,
                fileType: doc.file_type ?? undefined,
                status: doc.status,
                verificationNotes: doc.verification_notes ?? undefined,
                uploadedBy: doc.uploaded_by ?? "DRIVER",
                uploadedAt: toIsoString(doc.uploaded_at) ?? new Date().toISOString(),
                verifiedBy: doc.verified_by ?? undefined,
                verifiedAt: toIsoString(doc.verified_at),
            })),
            assignedAgent: clearance.assigned_agent_id ?? undefined,
            agentName: clearance.agent_name ?? undefined,
            reviewStartedAt: toIsoString(clearance.review_started_at),
            reviewCompletedAt: toIsoString(clearance.review_completed_at),
            reviewNotes: clearance.review_notes ?? undefined,
            rejectionReason: clearance.rejection_reason ?? undefined,
            activityLog: logResult.rows.map((log) => ({
                id: log.id,
                action: log.action,
                actor: log.actor ?? "System",
                actorType: log.actor_type ?? "SYSTEM",
                details: log.details ?? undefined,
                notes: log.notes ?? undefined,
                createdAt: toIsoString(log.created_at) ?? new Date().toISOString(),
            })),
            flaggedAt: toIsoString(clearance.flagged_at) ?? new Date().toISOString(),
            docsSubmittedAt: toIsoString(clearance.docs_submitted_at),
            approvedAt: toIsoString(clearance.approved_at),
            clearedAt: toIsoString(clearance.cleared_at),
        });
    }
    catch (error) {
        console.error("Error fetching clearance detail", error);
        res.status(500).json({ error: "Failed to fetch clearance detail" });
    }
});
router.post("/:id/documents", async (req, res) => {
    try {
        const { id } = req.params;
        const { documentType, documentName, fileUrl, fileSizeKb, fileType, uploadedBy } = req.body;
        if (!documentType || !documentName) {
            res.status(400).json({ error: "documentType and documentName are required" });
            return;
        }
        const insertResult = await client_1.pool.query(`INSERT INTO customs_documents (
        clearance_id, document_type, document_name, file_url,
        file_size_kb, file_type, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`, [id, documentType, documentName, fileUrl ?? null, fileSizeKb ?? null, fileType ?? null, uploadedBy ?? "DRIVER"]);
        const inserted = insertResult.rows[0];
        await client_1.pool.query(`INSERT INTO customs_activity_log (clearance_id, action, actor, actor_type, details)
       VALUES ($1, 'DOC_UPLOADED', $2, 'DRIVER', $3::jsonb)`, [id, uploadedBy ?? "Driver", JSON.stringify({ documentType, documentName })]);
        await client_1.pool.query(`UPDATE customs_clearances
       SET submitted_documents = COALESCE(submitted_documents, '[]'::jsonb) || $1::jsonb,
           updated_at = NOW()
       WHERE id = $2`, [
            JSON.stringify({
                id: inserted.id,
                documentType,
                documentName,
                uploadedAt: toIsoString(inserted.uploaded_at) ?? new Date().toISOString(),
            }),
            id,
        ]);
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
    }
    catch (error) {
        console.error("Error uploading document", error);
        res.status(500).json({ error: "Failed to upload document" });
    }
});
router.post("/:id/submit", async (req, res) => {
    try {
        const { id } = req.params;
        await client_1.pool.query(`UPDATE customs_clearances
       SET status = 'DOCS_SUBMITTED', docs_submitted_at = NOW(), updated_at = NOW()
       WHERE id = $1`, [id]);
        await client_1.pool.query(`INSERT INTO customs_activity_log (clearance_id, action, actor, actor_type)
       VALUES ($1, 'DOCS_SUBMITTED', 'Driver', 'DRIVER')`, [id]);
        res.json({ success: true, message: "Documents submitted for review" });
    }
    catch (error) {
        console.error("Error submitting documents", error);
        res.status(500).json({ error: "Failed to submit documents" });
    }
});
router.post("/:id/assign-agent", async (req, res) => {
    try {
        const { id } = req.params;
        const { agentId, agentName } = req.body;
        if (!agentId || !agentName) {
            res.status(400).json({ error: "agentId and agentName are required" });
            return;
        }
        await client_1.pool.query(`UPDATE customs_clearances
       SET assigned_agent_id = $1,
           agent_name = $2,
           status = 'UNDER_REVIEW',
           review_started_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`, [agentId, agentName, id]);
        await client_1.pool.query(`UPDATE customs_agents
       SET current_workload = LEAST(max_concurrent_reviews, current_workload + 1)
       WHERE id = $1`, [agentId]);
        await client_1.pool.query(`INSERT INTO customs_activity_log (clearance_id, action, actor, actor_type)
       VALUES ($1, 'ASSIGNED_AGENT', $2, 'SYSTEM')`, [id, agentName]);
        res.json({ success: true });
    }
    catch (error) {
        console.error("Error assigning agent", error);
        res.status(500).json({ error: "Failed to assign agent" });
    }
});
router.post("/:id/approve", async (req, res) => {
    try {
        const { id } = req.params;
        const { agentName, notes } = req.body;
        await client_1.pool.query(`UPDATE customs_clearances
       SET status = 'APPROVED',
           review_completed_at = NOW(),
           approved_at = NOW(),
           review_notes = $1,
           updated_at = NOW()
       WHERE id = $2`, [notes ?? null, id]);
        await client_1.pool.query(`INSERT INTO customs_activity_log (clearance_id, action, actor, actor_type, notes)
       VALUES ($1, 'APPROVED', $2, 'AGENT', $3)`, [id, agentName ?? "Agent", notes ?? null]);
        res.json({ success: true, message: "Clearance approved" });
    }
    catch (error) {
        console.error("Error approving clearance", error);
        res.status(500).json({ error: "Failed to approve clearance" });
    }
});
router.post("/:id/reject", async (req, res) => {
    try {
        const { id } = req.params;
        const { agentName, reason } = req.body;
        await client_1.pool.query(`UPDATE customs_clearances
       SET status = 'REJECTED',
           review_completed_at = NOW(),
           rejection_reason = $1,
           updated_at = NOW()
       WHERE id = $2`, [reason ?? null, id]);
        await client_1.pool.query(`INSERT INTO customs_activity_log (clearance_id, action, actor, actor_type, notes)
       VALUES ($1, 'REJECTED', $2, 'AGENT', $3)`, [id, agentName ?? "Agent", reason ?? null]);
        res.json({ success: true, message: "Clearance rejected" });
    }
    catch (error) {
        console.error("Error rejecting clearance", error);
        res.status(500).json({ error: "Failed to reject clearance" });
    }
});
router.post("/:id/clear", async (req, res) => {
    try {
        const { id } = req.params;
        const clearanceResult = await client_1.pool.query(`SELECT trip_id FROM customs_clearances WHERE id = $1`, [id]);
        if (!clearanceResult.rowCount) {
            res.status(404).json({ error: "Clearance not found" });
            return;
        }
        const tripId = clearanceResult.rows[0].trip_id;
        await client_1.pool.query(`UPDATE customs_clearances
       SET status = 'CLEARED', cleared_at = NOW(), updated_at = NOW()
       WHERE id = $1`, [id]);
        try {
            await (0, tripService_1.updateTripStatus)(tripId, tracking_1.TripStatus.IN_TRANSIT, {
                triggeredBy: "customs",
                reason: "Customs clearance completed",
            });
        }
        catch (statusError) {
            console.warn("Unable to update trip status during customs clear", statusError);
            await client_1.pool.query(`UPDATE trips SET status = $1, updated_at = NOW() WHERE id = $2`, [tracking_1.TripStatus.IN_TRANSIT, tripId]);
        }
        await client_1.pool.query(`INSERT INTO customs_activity_log (clearance_id, action, actor, actor_type)
       VALUES ($1, 'CLEARED', 'System', 'SYSTEM')`, [id]);
        res.json({ success: true, message: "Truck cleared for border crossing" });
    }
    catch (error) {
        console.error("Error clearing truck", error);
        res.status(500).json({ error: "Failed to clear truck" });
    }
});
exports.default = router;
