import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/dispatch/orders/[id]/assign - Assign driver/unit to order
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { driverId, unitId } = body;

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    // Get driver info
    const driverResult = await pool.query(
      `SELECT driver_name, unit_number FROM driver_profiles WHERE driver_id = $1`,
      [driverId]
    );

    if (driverResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Determine unit to assign
    let assignUnitId = unitId;
    if (!assignUnitId && driverResult.rows[0].unit_number) {
      // Try to find unit by driver's default unit number
      const unitResult = await pool.query(
        `SELECT unit_id FROM unit_profiles WHERE unit_number = $1`,
        [driverResult.rows[0].unit_number]
      );
      if (unitResult.rows.length > 0) {
        assignUnitId = unitResult.rows[0].unit_id;
      }
    }

    // Update the order
    await pool.query(
      `UPDATE orders SET 
        dispatch_status = 'FLEET_DISPATCH',
        assigned_driver_id = $1,
        assigned_unit_id = $2,
        updated_at = NOW()
      WHERE id = $3`,
      [driverId, assignUnitId, id]
    );

    // Log the action
    await pool.query(
      `INSERT INTO dispatch_actions (order_id, action_type, performed_by, notes)
       VALUES ($1, 'ASSIGN_DRIVER', 'SYSTEM', $2)`,
      [id, `Assigned to driver ${driverResult.rows[0].driver_name}`]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign order' },
      { status: 500 }
    );
  }
}
