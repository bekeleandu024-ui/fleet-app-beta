import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/dispatch/orders/[id]/unpost - Remove order from external carriers
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Update the order
    await pool.query(
      `UPDATE orders SET 
        dispatch_status = 'BROKERAGE_PENDING',
        posted_to_carriers = false,
        posted_at = NULL,
        updated_at = NOW()
      WHERE id = $1`,
      [id]
    );

    // Log the action
    await pool.query(
      `INSERT INTO dispatch_actions (order_id, action_type, performed_by, notes)
       VALUES ($1, 'UNPOST_FROM_CARRIERS', 'SYSTEM', 'Removed from external load boards')`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unposting order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unpost order' },
      { status: 500 }
    );
  }
}
