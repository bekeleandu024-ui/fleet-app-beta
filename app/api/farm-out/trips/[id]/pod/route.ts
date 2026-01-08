import { NextResponse } from "next/server";
import pool from "@/lib/db";

// POST /api/farm-out/trips/[id]/pod - Upload POD document
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const orderId = formData.get("orderId") as string;
    const documentType = formData.get("documentType") as string || "POD";
    const notes = formData.get("notes") as string || "";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Accepts JPEG, PNG, WebP, or PDF" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get trip and order info
      const tripResult = await client.query(
        `SELECT t.order_id, t.trip_number FROM trips t WHERE t.id = $1`,
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
      const targetOrderId = orderId || trip.order_id;

      // In a production system, you would:
      // 1. Upload the file to cloud storage (S3, GCS, Azure Blob, etc.)
      // 2. Get back a URL
      // For demo purposes, we'll generate a mock URL
      
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop() || "pdf";
      const mockPodUrl = `/uploads/pod/${id}_${timestamp}.${fileExtension}`;

      // Update the order with POD URL
      await client.query(
        `UPDATE orders SET 
          pod_url = $1,
          pod_uploaded_at = NOW(),
          pod_notes = $2,
          updated_at = NOW()
         WHERE id = $3`,
        [mockPodUrl, notes, targetOrderId]
      );

      // Insert document record (if documents table exists)
      try {
        await client.query(
          `INSERT INTO trip_documents (
            id, trip_id, order_id, document_type, file_name, 
            file_url, file_size, mime_type, uploaded_by, notes, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'SYSTEM', $8, NOW()
          )`,
          [
            id,
            targetOrderId,
            documentType,
            file.name,
            mockPodUrl,
            file.size,
            file.type,
            notes,
          ]
        );
      } catch (docError) {
        // Table might not exist, continue anyway
        console.log("trip_documents table not found, skipping document record");
      }

      // Log the action
      await client.query(
        `INSERT INTO dispatch_actions (order_id, action_type, performed_by, notes)
         VALUES ($1, 'POD_UPLOADED', 'SYSTEM', $2)`,
        [targetOrderId, `POD uploaded: ${file.name}`]
      );

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        data: {
          tripId: id,
          orderId: targetOrderId,
          podUrl: mockPodUrl,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error uploading POD:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload POD" },
      { status: 500 }
    );
  }
}

// GET /api/farm-out/trips/[id]/pod - Get POD status and info
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
          t.id as trip_id,
          t.trip_number,
          o.id as order_id,
          o.pod_url,
          o.pod_uploaded_at,
          o.pod_notes
         FROM trips t
         LEFT JOIN orders o ON o.id = t.order_id
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

      return NextResponse.json({
        success: true,
        data: {
          tripId: row.trip_id,
          tripNumber: row.trip_number,
          orderId: row.order_id,
          podUploaded: !!row.pod_url,
          podUrl: row.pod_url,
          podUploadedAt: row.pod_uploaded_at,
          podNotes: row.pod_notes,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching POD status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch POD status" },
      { status: 500 }
    );
  }
}
