import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/dispatch/orders/[id]/kick - Kick order to brokerage
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Update the order
    await pool.query(
      `UPDATE orders SET 
        dispatch_status = 'BROKERAGE_PENDING',
        assigned_driver_id = NULL,
        assigned_unit_id = NULL,
        kicked_to_brokerage_at = NOW(),
        kick_reason = $1,
        updated_at = NOW()
      WHERE id = $2`,
      [reason || null, id]
    );

    // Log the action
    await pool.query(
      `INSERT INTO dispatch_actions (order_id, action_type, performed_by, notes)
       VALUES ($1, 'KICK_TO_BROKERAGE', 'SYSTEM', $2)`,
      [id, reason ? `Kicked to brokerage: ${reason}` : 'Kicked to brokerage']
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error kicking order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to kick order' },
      { status: 500 }
    );
  }
}
