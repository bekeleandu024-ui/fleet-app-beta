import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/dispatch/trailers - Fetch available trailers with location tracking
// Supports filtering by status, attachment status, and location
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status'); // Available, Loaded, Maintenance, Storage, Spotted
    const attachedFilter = searchParams.get('attached'); // true/false - whether trailer is attached to a unit
    const locationFilter = searchParams.get('location'); // Filter trailers at a specific city

    let query = `
      SELECT
        t.trailer_id,
        t.unit_number AS trailer_number,
        t.type AS trailer_type,
        t.status,
        t.current_city,
        t.current_state,
        t.current_location_id,
        t.current_location_updated_at,
        t.current_unit_id,
        t.domicile_location_id,
        domicile_loc.name AS domicile_name,
        domicile_loc.city AS domicile_city,
        domicile_loc.state AS domicile_state,
        curr_loc.name AS current_location_name,
        up.unit_number AS attached_unit_number,
        up.driver_id AS attached_driver_id
      FROM trailers t
      LEFT JOIN locations domicile_loc ON t.domicile_location_id = domicile_loc.id
      LEFT JOIN locations curr_loc ON t.current_location_id = curr_loc.id
      LEFT JOIN unit_profiles up ON t.current_unit_id = up.unit_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (statusFilter) {
      query += ` AND t.status = $${paramCount}`;
      params.push(statusFilter);
      paramCount++;
    }

    if (attachedFilter !== null) {
      if (attachedFilter === 'false') {
        query += ` AND t.current_unit_id IS NULL`;
      } else if (attachedFilter === 'true') {
        query += ` AND t.current_unit_id IS NOT NULL`;
      }
    }

    if (locationFilter) {
      query += ` AND t.current_city ILIKE $${paramCount}`;
      params.push(`%${locationFilter}%`);
      paramCount++;
    }

    query += ` ORDER BY t.unit_number ASC`;

    const result = await pool.query(query, params);

    const trailers = result.rows.map(row => ({
      trailerId: row.trailer_id,
      trailerNumber: row.trailer_number,
      trailerType: row.trailer_type,
      status: row.status,

      // Current location (operational)
      currentCity: row.current_city,
      currentState: row.current_state,
      currentLocationId: row.current_location_id,
      currentLocationName: row.current_location_name,
      currentLocationUpdatedAt: row.current_location_updated_at,

      // Domicile (administrative home)
      domicileLocationId: row.domicile_location_id,
      domicileName: row.domicile_name,
      domicileCity: row.domicile_city,
      domicileState: row.domicile_state,

      // Attachment status
      currentUnitId: row.current_unit_id,
      isAttached: !!row.current_unit_id,
      attachedTo: row.current_unit_id ? {
        unitNumber: row.attached_unit_number,
        driverId: row.attached_driver_id,
      } : null,
    }));

    return NextResponse.json({ success: true, data: trailers });
  } catch (error) {
    console.error('Error fetching trailers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trailers' },
      { status: 500 }
    );
  }
}
