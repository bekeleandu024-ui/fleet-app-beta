import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/dispatch/units - Fetch available units with location tracking
// Supports filtering by status and location
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status'); // AVAILABLE, EN_ROUTE, DISPLACED, OUT_OF_SERVICE
    const nearLocation = searchParams.get('near'); // Filter units near a specific city

    let query = `
      SELECT
        up.unit_id,
        up.unit_number,
        up.driver_id,
        up.unit_type,
        COALESCE(up.max_weight_lbs, up.max_weight, 45000) AS max_weight,
        COALESCE(up.max_volume_cuft, up.max_cube, 3000) AS max_cube,
        COALESCE(up.linear_feet, 53) AS linear_feet,
        up.current_location,
        up.is_active,
        up.status,
        up.current_city,
        up.current_state,
        up.current_location_id,
        up.current_location_updated_at,
        up.home_base_id,
        up.default_trailer_id,
        home_loc.name AS home_base_name,
        home_loc.city AS home_base_city,
        home_loc.state AS home_base_state,
        curr_loc.name AS current_location_name,
        t.trailer_id,
        t.unit_number AS trailer_number,
        t.type AS trailer_type
      FROM unit_profiles up
      LEFT JOIN locations home_loc ON up.home_base_id = home_loc.id
      LEFT JOIN locations curr_loc ON up.current_location_id = curr_loc.id
      LEFT JOIN trailers t ON up.default_trailer_id = t.trailer_id
      WHERE up.is_active = true
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (statusFilter) {
      query += ` AND up.status = $${paramCount}`;
      params.push(statusFilter);
      paramCount++;
    }

    if (nearLocation) {
      query += ` AND up.current_city ILIKE $${paramCount}`;
      params.push(`%${nearLocation}%`);
      paramCount++;
    }

    query += ` ORDER BY up.unit_number ASC`;

    const result = await pool.query(query, params);

    const units = result.rows.map(row => ({
      unitId: row.unit_id,
      unitNumber: row.unit_number,
      driverId: row.driver_id,
      unitType: row.unit_type,
      maxWeight: row.max_weight,
      maxCube: row.max_cube,
      linearFeet: row.linear_feet,
      currentLocation: row.current_location, // Legacy field
      isActive: row.is_active,

      // New location tracking fields
      status: row.status || 'AVAILABLE',
      currentCity: row.current_city,
      currentState: row.current_state,
      currentLocationId: row.current_location_id,
      currentLocationName: row.current_location_name,
      currentLocationUpdatedAt: row.current_location_updated_at,

      // Home base information
      homeBaseId: row.home_base_id,
      homeBaseName: row.home_base_name,
      homeBaseCity: row.home_base_city,
      homeBaseState: row.home_base_state,

      // Default trailer
      defaultTrailerId: row.default_trailer_id,
      attachedTrailer: row.trailer_id ? {
        trailerId: row.trailer_id,
        trailerNumber: row.trailer_number,
        trailerType: row.trailer_type,
      } : null,
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
