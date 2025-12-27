import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { formatError } from "@/lib/api-errors";

/**
 * GET /api/trips/[id]/pod
 * Get complete POD package (all documents, signatures, photos, verification status)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await context.params;

    // Fetch trip details
    const tripResult = await pool.query(
      `SELECT * FROM trips WHERE id = $1`,
      [tripId]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 }
      );
    }

    // Fetch all related POD data in parallel
    const [documents, signatures, photos, verification] = await Promise.all([
      pool.query(
        `SELECT * FROM documents WHERE trip_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [tripId]
      ),
      pool.query(
        `SELECT * FROM signatures WHERE trip_id = $1 ORDER BY timestamp DESC`,
        [tripId]
      ),
      pool.query(
        `SELECT * FROM delivery_photos WHERE trip_id = $1 ORDER BY sequence ASC, timestamp DESC`,
        [tripId]
      ),
      pool.query(
        `SELECT * FROM pod_verification WHERE trip_id = $1`,
        [tripId]
      ),
    ]);

    const podPackage = {
      trip: tripResult.rows[0],
      documents: documents.rows,
      signatures: signatures.rows,
      photos: photos.rows,
      verification: verification.rows[0] || null,
      completeness: {
        hasDocuments: documents.rows.length > 0,
        hasSignatures: signatures.rows.length > 0,
        hasPhotos: photos.rows.length > 0,
        isPODComplete: verification.rows[0]?.has_pod || false,
        isBOLComplete: verification.rows[0]?.has_bol || false,
        hasDiscrepancies: verification.rows[0]?.has_discrepancies || false,
        verificationStatus: verification.rows[0]?.verification_status || 'pending',
      },
    };

    return NextResponse.json({
      success: true,
      podPackage,
    });
  } catch (error) {
    console.error("Error fetching POD package:", error);
    return NextResponse.json(
      { success: false, error: formatError(error) },
      { status: 500 }
    );
  }
}
