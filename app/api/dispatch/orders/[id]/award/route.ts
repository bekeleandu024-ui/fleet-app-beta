import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/dispatch/orders/[id]/award - Award bid to a carrier
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { bidId } = body;

    if (!bidId) {
      return NextResponse.json(
        { success: false, error: 'Bid ID is required' },
        { status: 400 }
      );
    }

    // Get the bid details
    const bidResult = await pool.query(
      `SELECT carrier_id, carrier_name, bid_amount FROM carrier_bids WHERE id = $1`,
      [bidId]
    );

    if (bidResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Bid not found' },
        { status: 404 }
      );
    }

    const bid = bidResult.rows[0];

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update the bid status
      await client.query(
        `UPDATE carrier_bids SET status = 'ACCEPTED' WHERE id = $1`,
        [bidId]
      );

      // Reject all other pending bids
      await client.query(
        `UPDATE carrier_bids SET status = 'REJECTED' 
         WHERE order_id = $1 AND id != $2 AND status = 'PENDING'`,
        [id, bidId]
      );

      // Update the order
      await client.query(
        `UPDATE orders SET 
          dispatch_status = 'COVERED_EXTERNAL',
          awarded_carrier_id = $1,
          awarded_bid_id = $2,
          updated_at = NOW()
        WHERE id = $3`,
        [bid.carrier_id, bidId, id]
      );

      // Log the action
      await client.query(
        `INSERT INTO dispatch_actions (order_id, action_type, performed_by, notes)
         VALUES ($1, 'AWARD_BID', 'SYSTEM', $2)`,
        [id, `Awarded to ${bid.carrier_name} at $${bid.bid_amount}`]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error awarding bid:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to award bid' },
      { status: 500 }
    );
  }
}
