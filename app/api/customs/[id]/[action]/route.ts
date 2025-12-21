import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const { id, action } = await params;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure record exists
      let clearanceId = id;
      if (id.startsWith("temp-")) {
        const tripId = id.replace("temp-", "");
        const tripRes = await client.query('SELECT order_id, driver_id, unit_id FROM trips WHERE id = $1', [tripId]);
        const trip = tripRes.rows[0];
        
        if (!trip) {
             throw new Error("Trip not found");
        }

        const insertRes = await client.query(`
          INSERT INTO customs_clearances (
            id, trip_id, order_id, driver_id, unit_id, status, priority, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, 'PENDING_DOCS', 'NORMAL', NOW(), NOW()
          ) RETURNING id
        `, [tripId, trip.order_id, trip.driver_id, trip.unit_id]);
        clearanceId = insertRes.rows[0].id;
      }

      // Handle actions
      if (action === 'submit') {
        await client.query(`
          UPDATE customs_clearances 
          SET status = 'DOCS_SUBMITTED', docs_submitted_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, [clearanceId]);
      } else if (action === 'clear') {
        await client.query(`
          UPDATE customs_clearances 
          SET status = 'CLEARED', cleared_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, [clearanceId]);
      } else if (action === 'approve') {
        const body = await request.json();
        await client.query(`
          UPDATE customs_clearances 
          SET status = 'APPROVED', approved_at = NOW(), review_notes = $2, agent_name = $3, updated_at = NOW()
          WHERE id = $1
        `, [clearanceId, body.notes, body.agentName]);
      } else if (action === 'reject') {
        const body = await request.json();
        await client.query(`
          UPDATE customs_clearances 
          SET status = 'REJECTED', rejection_reason = $2, agent_name = $3, updated_at = NOW()
          WHERE id = $1
        `, [clearanceId, body.reason, body.agentName]);
      } else if (action === 'assign-agent') {
        const body = await request.json();
        await client.query(`
          UPDATE customs_clearances 
          SET agent_name = $2, updated_at = NOW()
          WHERE id = $1
        `, [clearanceId, body.agentName]);
      } else if (action === 'documents') {
         const body = await request.json();
         const newDoc = {
             id: randomUUID(),
             documentType: body.documentType,
             documentName: body.documentName,
             status: "UPLOADED",
             uploadedAt: new Date().toISOString()
         };
         
         await client.query(`
            UPDATE customs_clearances
            SET submitted_documents = COALESCE(submitted_documents, '[]'::jsonb) || $2::jsonb, updated_at = NOW()
            WHERE id = $1
         `, [clearanceId, JSON.stringify([newDoc])]);
      } else {
        throw new Error("Unsupported action");
      }

      // Log activity
      await client.query(`
        INSERT INTO customs_activity_log (
          id, clearance_id, action, actor, actor_type, notes, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, 'System', 'SYSTEM', $3, NOW()
        )
      `, [clearanceId, action.toUpperCase(), `Action ${action} performed`]);

      await client.query('COMMIT');
      
      return NextResponse.json({ success: true, id: clearanceId });

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Customs Action API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process customs action",
      },
      { status: 400 }
    );
  }
}
