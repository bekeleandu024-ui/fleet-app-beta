import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/dispatch/orders/[id]/unassign - Remove driver/unit assignment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Update the order
    await pool.query(
      `UPDATE orders SET 
        dispatch_status = 'NEW',
        assigned_driver_id = NULL,
        assigned_unit_id = NULL,
        updated_at = NOW()
      WHERE id = $1`,
      [id]
    );

    // Log the action
    await pool.query(
      `INSERT INTO dispatch_actions (order_id, action_type, performed_by, notes)
       VALUES ($1, 'UNASSIGN_DRIVER', 'SYSTEM', 'Driver unassigned')`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unassigning order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unassign order' },
      { status: 500 }
    );
  }
}
