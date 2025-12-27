import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pool from "@/lib/db";
import { formatError } from "@/lib/api-errors";

const verifySchema = z.object({
  verificationStatus: z.enum(['approved', 'rejected', 'needs_review', 'incomplete']),
  verifiedBy: z.string().uuid(),
  verifiedByName: z.string(),
  discrepancies: z.array(z.object({
    type: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
  })).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  notifyCustomer: z.boolean().default(false),
});

/**
 * POST /api/trips/[id]/pod/verify
 * Verify POD completion and approve/reject
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await context.params;
    const body = await request.json();
    const data = verifySchema.parse(body);

    // Verify trip exists
    const tripCheck = await pool.query('SELECT id, status FROM trips WHERE id = $1', [tripId]);
    if (tripCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 }
      );
    }

    const hasDiscrepancies = (data.discrepancies?.length ?? 0) > 0;

    const result = await pool.query(
      `
      INSERT INTO pod_verification (
        trip_id, verification_status, verified_by, verified_by_name,
        verified_at, has_discrepancies, discrepancies, notes, 
        internal_notes, customer_notified, customer_notified_at,
        submitted_at, completed_at
      ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, NOW(), $11)
      ON CONFLICT (trip_id) 
      DO UPDATE SET
        verification_status = $2,
        verified_by = $3,
        verified_by_name = $4,
        verified_at = NOW(),
        has_discrepancies = $5,
        discrepancies = $6,
        notes = $7,
        internal_notes = $8,
        customer_notified = $9,
        customer_notified_at = $10,
        completed_at = $11
      RETURNING *
      `,
      [
        tripId,
        data.verificationStatus,
        data.verifiedBy,
        data.verifiedByName,
        hasDiscrepancies,
        data.discrepancies ? JSON.stringify(data.discrepancies) : '[]',
        data.notes || null,
        data.internalNotes || null,
        data.notifyCustomer,
        data.notifyCustomer ? new Date() : null,
        data.verificationStatus === 'approved' ? new Date() : null,
      ]
    );

    // If approved, update trip status
    if (data.verificationStatus === 'approved') {
      await pool.query(
        `UPDATE trips SET status = 'delivered' WHERE id = $1`,
        [tripId]
      );
    }

    // Log audit trail
    await pool.query(
      `
      INSERT INTO pod_audit_log (trip_id, action, actor_id, actor_name, new_value)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        tripId,
        'pod_verified',
        data.verifiedBy,
        data.verifiedByName,
        JSON.stringify({ 
          verificationStatus: data.verificationStatus,
          hasDiscrepancies,
          discrepancyCount: data.discrepancies?.length ?? 0,
        }),
      ]
    );

    // TODO: If notifyCustomer is true, trigger notification/email

    return NextResponse.json({
      success: true,
      verification: result.rows[0],
    });
  } catch (error) {
    console.error("Error verifying POD:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: formatError(error) },
      { status: 500 }
    );
  }
}
