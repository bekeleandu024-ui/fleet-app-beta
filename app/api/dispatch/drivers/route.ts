import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/dispatch/drivers - Fetch available drivers
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        driver_id,
        driver_name,
        unit_number,
        driver_type,
        region,
        status,
        CASE WHEN status = 'ACTIVE' OR status IS NULL THEN true ELSE false END AS is_active
      FROM driver_profiles
      ORDER BY driver_name ASC
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
