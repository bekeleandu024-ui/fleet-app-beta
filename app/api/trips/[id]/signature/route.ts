import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pool from "@/lib/db";
import { formatError } from "@/lib/api-errors";

const signatureSchema = z.object({
  documentId: z.string().uuid().optional(),
  signatureType: z.enum(['pickup', 'delivery', 'witness', 'inspector']),
  signerName: z.string().min(1),
  signerRole: z.enum(['driver', 'receiver', 'shipper', 'warehouse', 'inspector', 'customs']),
  signerTitle: z.string().optional(),
  signerCompany: z.string().optional(),
  signatureData: z.string().min(1), // base64 encoded
  signatureFormat: z.string().default('png'),
  geolocation: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number().optional(),
  }).optional(),
  deviceInfo: z.object({
    deviceType: z.string().optional(),
    os: z.string().optional(),
    browser: z.string().optional(),
  }).optional(),
});

/**
 * GET /api/trips/[id]/signature
 * Get all signatures for a trip
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
        s.*,
        d.document_type,
        d.file_name
      FROM signatures s
      LEFT JOIN documents d ON d.id = s.document_id
      WHERE s.trip_id = $1
      ORDER BY s.timestamp DESC
      `,
      [tripId]
    );

    return NextResponse.json({
      success: true,
      signatures: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching signatures:", error);
    return NextResponse.json(
      { success: false, error: formatError(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trips/[id]/signature
 * Capture a new signature
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await context.params;
    const body = await request.json();
    const data = signatureSchema.parse(body);

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

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
      INSERT INTO signatures (
        trip_id, document_id, signature_type, signer_name, signer_role,
        signer_title, signer_company, signature_data, signature_format,
        geolocation, device_info, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
      `,
      [
        tripId,
        data.documentId || null,
        data.signatureType,
        data.signerName,
        data.signerRole,
        data.signerTitle || null,
        data.signerCompany || null,
        data.signatureData,
        data.signatureFormat,
        data.geolocation ? JSON.stringify(data.geolocation) : null,
        data.deviceInfo ? JSON.stringify(data.deviceInfo) : null,
        ipAddress,
        userAgent,
      ]
    );

    // Update POD verification checklist
    await pool.query(
      `
      INSERT INTO pod_verification (trip_id, has_signature)
      VALUES ($1, true)
      ON CONFLICT (trip_id) 
      DO UPDATE SET has_signature = true
      `,
      [tripId]
    );

    // Log audit trail
    await pool.query(
      `
      INSERT INTO pod_audit_log (trip_id, action, actor_name, new_value)
      VALUES ($1, $2, $3, $4)
      `,
      [
        tripId,
        'signature_captured',
        data.signerName,
        JSON.stringify({ signatureType: data.signatureType, signerRole: data.signerRole }),
      ]
    );

    return NextResponse.json({
      success: true,
      signature: result.rows[0],
    });
  } catch (error) {
    console.error("Error capturing signature:", error);
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
