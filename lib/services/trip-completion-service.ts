/**
 * Trip Completion Service
 *
 * Handles asset location updates when trips complete.
 * Updates unit and trailer locations based on trip parameters.
 *
 * Key Concepts:
 * - Rounder trips (is_rounder=true): Unit returns to home base after delivery
 * - Non-rounder trips (is_rounder=false): Unit stays DISPLACED at delivery location
 * - Drop trailer trips (drop_trailer=true): Trailer is SPOTTED at delivery location
 * - Attached trailer trips (drop_trailer=false): Trailer follows unit
 */

import pool from '@/lib/db';

export interface TripCompletionInput {
  trip_id: string;
  order_id: string;
  unit_id: string;
  trailer_id?: string | null;

  // Trip parameters
  is_rounder: boolean;
  drop_trailer: boolean;

  // Locations
  delivery_location_id?: string | null;
  delivery_city: string;
  delivery_state: string;

  unit_home_base_id?: string | null;
  trailer_domicile_id?: string | null;
}

export interface TripCompletionResult {
  success: boolean;
  trip_id: string;
  updates: {
    unit?: {
      unit_id: string;
      new_location_id?: string | null;
      new_location: string;
      new_status: 'AVAILABLE' | 'DISPLACED';
    };
    trailer?: {
      trailer_id: string;
      new_location_id?: string | null;
      new_location: string;
      new_status: 'Available' | 'Spotted';
      detached: boolean;
    };
  };
}

/**
 * Updates asset locations when a trip completes
 *
 * Logic:
 * 1. If is_rounder = true:
 *    - Unit returns to home_base_id (status: AVAILABLE)
 *    - If drop_trailer = true: Trailer stays SPOTTED at delivery
 *    - If drop_trailer = false: Trailer returns with unit to home base
 *
 * 2. If is_rounder = false:
 *    - Unit stays DISPLACED at delivery location
 *    - If drop_trailer = true: Trailer stays SPOTTED at delivery
 *    - If drop_trailer = false: Trailer stays with unit at delivery
 */
export async function completeTripAndUpdateAssets(
  input: TripCompletionInput
): Promise<TripCompletionResult> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result: TripCompletionResult = {
      success: false,
      trip_id: input.trip_id,
      updates: {},
    };

    // Determine unit final location and status
    let unitFinalLocationId: string | null;
    let unitFinalCity: string;
    let unitFinalState: string;
    let unitFinalStatus: 'AVAILABLE' | 'DISPLACED';

    if (input.is_rounder) {
      // ROUNDER: Unit returns to home base
      if (input.unit_home_base_id) {
        // Get home base details
        const homeBaseResult = await client.query(
          'SELECT id, city, state FROM locations WHERE id = $1',
          [input.unit_home_base_id]
        );

        if (homeBaseResult.rows[0]) {
          unitFinalLocationId = homeBaseResult.rows[0].id;
          unitFinalCity = homeBaseResult.rows[0].city;
          unitFinalState = homeBaseResult.rows[0].state;
        } else {
          // Fallback if home base not found
          unitFinalLocationId = null;
          unitFinalCity = input.delivery_city;
          unitFinalState = input.delivery_state;
        }
      } else {
        // No home base defined, default behavior
        unitFinalLocationId = input.delivery_location_id || null;
        unitFinalCity = input.delivery_city;
        unitFinalState = input.delivery_state;
      }
      unitFinalStatus = 'AVAILABLE';
    } else {
      // NON-ROUNDER: Unit stays at delivery location, marked as DISPLACED
      unitFinalLocationId = input.delivery_location_id || null;
      unitFinalCity = input.delivery_city;
      unitFinalState = input.delivery_state;
      unitFinalStatus = 'DISPLACED';
    }

    // Update unit location and status
    await client.query(
      `UPDATE unit_profiles
       SET current_location_id = $1,
           current_city = $2,
           current_state = $3,
           status = $4,
           current_location_updated_at = NOW()
       WHERE unit_id = $5`,
      [unitFinalLocationId, unitFinalCity, unitFinalState, unitFinalStatus, input.unit_id]
    );

    result.updates.unit = {
      unit_id: input.unit_id,
      new_location_id: unitFinalLocationId,
      new_location: `${unitFinalCity}, ${unitFinalState}`,
      new_status: unitFinalStatus,
    };

    // Update trailer if present
    if (input.trailer_id) {
      let trailerFinalLocationId: string | null;
      let trailerFinalCity: string;
      let trailerFinalState: string;
      let trailerFinalStatus: 'Available' | 'Spotted';
      let trailerDetached: boolean;

      if (input.drop_trailer) {
        // DROP TRAILER: Trailer stays at delivery location (SPOTTED)
        trailerFinalLocationId = input.delivery_location_id || null;
        trailerFinalCity = input.delivery_city;
        trailerFinalState = input.delivery_state;
        trailerFinalStatus = 'Spotted';
        trailerDetached = true;

        // Detach trailer from unit
        await client.query(
          `UPDATE trailers
           SET current_location_id = $1,
               current_city = $2,
               current_state = $3,
               status = $4,
               current_unit_id = NULL,
               current_location_updated_at = NOW()
           WHERE trailer_id = $5`,
          [trailerFinalLocationId, trailerFinalCity, trailerFinalState, trailerFinalStatus, input.trailer_id]
        );
      } else {
        // TRAILER FOLLOWS UNIT
        trailerFinalLocationId = unitFinalLocationId;
        trailerFinalCity = unitFinalCity;
        trailerFinalState = unitFinalState;
        trailerFinalStatus = 'Available';
        trailerDetached = false;

        // Trailer stays attached to unit
        await client.query(
          `UPDATE trailers
           SET current_location_id = $1,
               current_city = $2,
               current_state = $3,
               status = $4,
               current_unit_id = $5,
               current_location_updated_at = NOW()
           WHERE trailer_id = $6`,
          [trailerFinalLocationId, trailerFinalCity, trailerFinalState, trailerFinalStatus, input.unit_id, input.trailer_id]
        );
      }

      result.updates.trailer = {
        trailer_id: input.trailer_id,
        new_location_id: trailerFinalLocationId,
        new_location: `${trailerFinalCity}, ${trailerFinalState}`,
        new_status: trailerFinalStatus,
        detached: trailerDetached,
      };
    }

    // Update trip record to mark as completed
    await client.query(
      `UPDATE trips
       SET status = 'COMPLETED',
           completed_at = NOW()
       WHERE id = $1`,
      [input.trip_id]
    );

    await client.query('COMMIT');
    result.success = true;
    return result;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error completing trip and updating assets:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Retrieve current asset locations for a unit
 */
export async function getUnitAssetStatus(unit_id: string) {
  const result = await pool.query(
    `SELECT
       up.unit_id,
       up.unit_number,
       up.status,
       up.current_city,
       up.current_state,
       up.current_location_id,
       up.current_location_updated_at,
       up.home_base_id,
       home_loc.name AS home_base_name,
       home_loc.city AS home_base_city,
       home_loc.state AS home_base_state,
       curr_loc.name AS current_location_name,
       t.trailer_id,
       t.unit_number AS trailer_number,
       t.status AS trailer_status,
       t.current_location_id AS trailer_location_id
     FROM unit_profiles up
     LEFT JOIN locations home_loc ON up.home_base_id = home_loc.id
     LEFT JOIN locations curr_loc ON up.current_location_id = curr_loc.id
     LEFT JOIN trailers t ON t.current_unit_id = up.unit_id
     WHERE up.unit_id = $1`,
    [unit_id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    unit: {
      unit_id: row.unit_id,
      unit_number: row.unit_number,
      status: row.status,
      current_location: {
        id: row.current_location_id,
        name: row.current_location_name,
        city: row.current_city,
        state: row.current_state,
        updated_at: row.current_location_updated_at,
      },
      home_base: row.home_base_id ? {
        id: row.home_base_id,
        name: row.home_base_name,
        city: row.home_base_city,
        state: row.home_base_state,
      } : null,
    },
    attached_trailer: row.trailer_id ? {
      trailer_id: row.trailer_id,
      trailer_number: row.trailer_number,
      status: row.trailer_status,
      location_id: row.trailer_location_id,
    } : null,
  };
}

/**
 * Get displaced units (units not at their home base)
 */
export async function getDisplacedUnits() {
  const result = await pool.query(`
    SELECT
      up.unit_id,
      up.unit_number,
      up.status,
      up.current_city,
      up.current_state,
      up.current_location_updated_at,
      home_loc.name AS home_base_name,
      home_loc.city AS home_base_city,
      home_loc.state AS home_base_state
    FROM unit_profiles up
    LEFT JOIN locations home_loc ON up.home_base_id = home_loc.id
    WHERE up.status = 'DISPLACED'
    ORDER BY up.current_location_updated_at DESC
  `);

  return result.rows.map(row => ({
    unit_id: row.unit_id,
    unit_number: row.unit_number,
    status: row.status,
    current_location: `${row.current_city}, ${row.current_state}`,
    current_location_updated_at: row.current_location_updated_at,
    home_base: row.home_base_name ? `${row.home_base_name} (${row.home_base_city}, ${row.home_base_state})` : 'Not set',
  }));
}

/**
 * Get spotted trailers (trailers detached at customer locations)
 */
export async function getSpottedTrailers() {
  const result = await pool.query(`
    SELECT
      t.trailer_id,
      t.unit_number AS trailer_number,
      t.status,
      t.current_city,
      t.current_state,
      t.current_location_updated_at,
      curr_loc.name AS current_location_name,
      domicile_loc.name AS domicile_name,
      domicile_loc.city AS domicile_city,
      domicile_loc.state AS domicile_state
    FROM trailers t
    LEFT JOIN locations curr_loc ON t.current_location_id = curr_loc.id
    LEFT JOIN locations domicile_loc ON t.domicile_location_id = domicile_loc.id
    WHERE t.status = 'Spotted'
      AND t.current_unit_id IS NULL
    ORDER BY t.current_location_updated_at DESC
  `);

  return result.rows.map(row => ({
    trailer_id: row.trailer_id,
    trailer_number: row.trailer_number,
    status: row.status,
    current_location: row.current_location_name || `${row.current_city}, ${row.current_state}`,
    current_location_updated_at: row.current_location_updated_at,
    domicile: row.domicile_name ? `${row.domicile_name} (${row.domicile_city}, ${row.domicile_state})` : 'Not set',
  }));
}
