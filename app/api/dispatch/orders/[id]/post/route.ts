import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/dispatch/orders/[id]/post - Post order to external carriers
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Update the order
    await pool.query(
      `UPDATE orders SET 
        dispatch_status = 'POSTED_EXTERNAL',
        posted_to_carriers = true,
        posted_at = NOW(),
        updated_at = NOW()
      WHERE id = $1`,
      [id]
    );

    // Log the action
    await pool.query(
      `INSERT INTO dispatch_actions (order_id, action_type, performed_by, notes)
       VALUES ($1, 'POST_TO_CARRIERS', 'SYSTEM', 'Posted to external load boards')`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error posting order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to post order' },
      { status: 500 }
    );
  }
}
