import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/dispatch/bids/[id]/reject - Reject a bid
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Get the bid to find the order
    const bidResult = await pool.query(
      `SELECT order_id, carrier_name FROM carrier_bids WHERE id = $1`,
      [id]
    );

    if (bidResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Bid not found' },
        { status: 404 }
      );
    }

    const bid = bidResult.rows[0];

    // Update the bid status
    await pool.query(
      `UPDATE carrier_bids SET status = 'REJECTED', notes = COALESCE(notes || ' | ', '') || $1
       WHERE id = $2`,
      [reason ? `Rejected: ${reason}` : 'Rejected', id]
    );

    // Log the action
    await pool.query(
      `INSERT INTO dispatch_actions (order_id, action_type, performed_by, notes)
       VALUES ($1, 'REJECT_BID', 'SYSTEM', $2)`,
      [bid.order_id, `Rejected bid from ${bid.carrier_name}${reason ? `: ${reason}` : ''}`]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting bid:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reject bid' },
      { status: 500 }
    );
  }
}
