import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/dispatch/units - Fetch available units
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        unit_id,
        unit_number,
        driver_id,
        unit_type,
        COALESCE(max_weight_lbs, max_weight, 45000) AS max_weight,
        COALESCE(max_volume_cuft, max_cube, 3000) AS max_cube,
        COALESCE(linear_feet, 53) AS linear_feet,
        region,
        current_location,
        is_active
      FROM unit_profiles
      ORDER BY unit_number ASC
    `);

    const units = result.rows.map(row => ({
      unitId: row.unit_id,
      unitNumber: row.unit_number,
      driverId: row.driver_id,
      unitType: row.unit_type,
      maxWeight: row.max_weight,
      maxCube: row.max_cube,
      linearFeet: row.linear_feet,
      region: row.region,
      currentLocation: row.current_location,
      isActive: row.is_active,
    }));

    return NextResponse.json({ success: true, data: units });
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch units' },
      { status: 500 }
    );
  }
}
