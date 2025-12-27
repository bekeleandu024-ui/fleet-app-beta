import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pool from "@/lib/db";
import { formatError } from "@/lib/api-errors";

const photoSchema = z.object({
  documentId: z.string().uuid().optional(),
  photoUrl: z.string().url(),
  photoType: z.enum(['cargo_loaded', 'cargo_unloaded', 'damage', 'seal', 'condition', 'location', 'odometer', 'other']),
  caption: z.string().optional(),
  sequence: z.number().default(0),
  geolocation: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number().optional(),
    address: z.string().optional(),
  }).optional(),
  exifData: z.record(z.any()).optional(),
  uploadedBy: z.string().uuid(),
});

/**
 * GET /api/trips/[id]/photos
 * Get all photos for a trip
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await context.params;
    const { searchParams } = new URL(request.url);
    const photoType = searchParams.get('type');

    let query = `
      SELECT * FROM delivery_photos
      WHERE trip_id = $1
    `;
    const params: any[] = [tripId];

    if (photoType) {
      query += ` AND photo_type = $2`;
      params.push(photoType);
    }

    query += ` ORDER BY sequence ASC, timestamp DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      photos: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { success: false, error: formatError(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trips/[id]/photos
 * Upload delivery photos
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await context.params;
    const body = await request.json();
    const data = photoSchema.parse(body);

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
      INSERT INTO delivery_photos (
        trip_id, document_id, photo_url, photo_type, caption,
        sequence, geolocation, exif_data, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        tripId,
        data.documentId || null,
        data.photoUrl,
        data.photoType,
        data.caption || null,
        data.sequence,
        data.geolocation ? JSON.stringify(data.geolocation) : null,
        data.exifData ? JSON.stringify(data.exifData) : null,
        data.uploadedBy,
      ]
    );

    // Update POD verification checklist
    await pool.query(
      `
      INSERT INTO pod_verification (trip_id, has_photos)
      VALUES ($1, true)
      ON CONFLICT (trip_id) 
      DO UPDATE SET has_photos = true
      `,
      [tripId]
    );

    // Log audit trail
    await pool.query(
      `
      INSERT INTO pod_audit_log (trip_id, action, actor_id, new_value)
      VALUES ($1, $2, $3, $4)
      `,
      [
        tripId,
        'photo_uploaded',
        data.uploadedBy,
        JSON.stringify({ photoType: data.photoType, caption: data.caption }),
      ]
    );

    return NextResponse.json({
      success: true,
      photo: result.rows[0],
    });
  } catch (error) {
    console.error("Error uploading photo:", error);
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
