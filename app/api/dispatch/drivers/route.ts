import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/dispatch/drivers - Fetch available drivers with their units
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        dp.driver_id,
        dp.driver_name,
        COALESCE(dp.unit_number, up.unit_number) AS unit_number,
        dp.driver_type,
        dp.region,
        COALESCE(dp.status, 'Available') AS status,
        true AS is_active
      FROM driver_profiles dp
      LEFT JOIN unit_profiles up ON dp.driver_id = up.driver_id
      ORDER BY dp.driver_name ASC
    `);

    const drivers = result.rows.map(row => ({
      driverId: row.driver_id,
      driverName: row.driver_name,
      unitNumber: row.unit_number,
      driverType: row.driver_type,
      region: row.region,
      status: row.status,
      isActive: row.is_active,
    }));

    return NextResponse.json({ success: true, data: drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}
