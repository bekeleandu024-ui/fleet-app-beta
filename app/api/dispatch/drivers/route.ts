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
        dp.driver_category,
        dp.oo_zone AS region,
        COALESCE(dp.current_status::text, dp.status::text, 'Available') AS status,
        dp.hos_hours_remaining,
        dp.base_wage_cpm,
        dp.effective_wage_cpm,
        COALESCE(dp.is_active, true) AS is_active
      FROM driver_profiles dp
      LEFT JOIN unit_profiles up ON dp.driver_id = up.driver_id
      WHERE dp.is_active = true OR dp.is_active IS NULL
      ORDER BY dp.driver_name ASC
    `);

    const drivers = result.rows.map(row => ({
      driverId: row.driver_id,
      driverName: row.driver_name,
      unitNumber: row.unit_number,
      driverType: row.driver_type,
      driverCategory: row.driver_category,
      region: row.region,
      status: row.status,
      hosHoursRemaining: row.hos_hours_remaining,
      baseWageCpm: row.base_wage_cpm,
      effectiveWageCpm: row.effective_wage_cpm,
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
