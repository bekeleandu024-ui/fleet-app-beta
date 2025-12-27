import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pool from "@/lib/db";
import { formatError } from "@/lib/api-errors";

const uploadDocumentSchema = z.object({
  documentType: z.enum(['BOL', 'POD', 'lumper_receipt', 'weight_ticket', 'inspection', 'customs', 'other']),
  fileUrl: z.string().url(),
  fileName: z.string().min(1),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  uploadedBy: z.string().uuid(),
  uploadedByType: z.enum(['driver', 'dispatcher', 'customer', 'system']),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/trips/[id]/documents
 * Get all documents for a trip
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await context.params;

    const result = await pool.query(
      `
      SELECT 
        d.*,
        COUNT(s.id) as signature_count
      FROM documents d
      LEFT JOIN signatures s ON s.document_id = d.id
      WHERE d.trip_id = $1 AND d.deleted_at IS NULL
      GROUP BY d.id
      ORDER BY d.created_at DESC
      `,
      [tripId]
    );

    return NextResponse.json({
      success: true,
      documents: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { success: false, error: formatError(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trips/[id]/documents
 * Upload a new document
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await context.params;
    const body = await request.json();
    const data = uploadDocumentSchema.parse(body);

    // Verify trip exists
    const tripCheck = await pool.query('SELECT id FROM trips WHERE id = $1', [tripId]);
    if (tripCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `
      INSERT INTO documents (
        trip_id, document_type, file_url, file_name, file_size, 
        mime_type, uploaded_by, uploaded_by_type, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        tripId,
        data.documentType,
        data.fileUrl,
        data.fileName,
        data.fileSize || null,
        data.mimeType || null,
        data.uploadedBy,
        data.uploadedByType,
        JSON.stringify(data.metadata || {}),
      ]
    );

    // Update POD verification checklist
    await updatePodChecklist(tripId, data.documentType);

    // Log audit trail
    await logAudit(tripId, 'document_uploaded', data.uploadedBy, {
      documentType: data.documentType,
      fileName: data.fileName,
    });

    return NextResponse.json({
      success: true,
      document: result.rows[0],
    });
  } catch (error) {
    console.error("Error uploading document:", error);
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

/**
 * DELETE /api/trips/[id]/documents
 * Soft delete a document (expects documentId in query params)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await context.params;
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      UPDATE documents 
      SET deleted_at = NOW()
      WHERE id = $1 AND trip_id = $2
      RETURNING *
      `,
      [documentId, tripId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { success: false, error: formatError(error) },
      { status: 500 }
    );
  }
}

// Helper function to update POD checklist
async function updatePodChecklist(tripId: string, documentType: string) {
  const updates: Record<string, boolean> = {};
  
  if (documentType === 'POD') updates.has_pod = true;
  if (documentType === 'BOL') updates.has_bol = true;
  if (documentType === 'weight_ticket') updates.has_weight_ticket = true;

  if (Object.keys(updates).length > 0) {
    const setClauses = Object.keys(updates).map((key, idx) => `${key} = $${idx + 2}`).join(', ');
    const values = Object.values(updates);
    
    await pool.query(
      `
      INSERT INTO pod_verification (trip_id, ${Object.keys(updates).join(', ')})
      VALUES ($1, ${values.map((_, idx) => `$${idx + 2}`).join(', ')})
      ON CONFLICT (trip_id) 
      DO UPDATE SET ${setClauses}
      `,
      [tripId, ...values]
    );
  }
}

// Helper function to log audit trail
async function logAudit(
  tripId: string,
  action: string,
  actorId: string,
  newValue: Record<string, any>
) {
  await pool.query(
    `
    INSERT INTO pod_audit_log (trip_id, action, actor_id, new_value)
    VALUES ($1, $2, $3, $4)
    `,
    [tripId, action, actorId, JSON.stringify(newValue)]
  );
}
