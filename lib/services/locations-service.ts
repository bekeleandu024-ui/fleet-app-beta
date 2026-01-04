/**
 * Locations Service
 *
 * Manages normalized location data for company yards, customer facilities,
 * driver homes, and drop yards. Supports GPS coordinates for distance calculations.
 *
 * This service is critical for the asset tracking system as it separates:
 * - WHERE assets ARE (current_location)
 * - WHERE they BELONG (home_base for units, domicile for trailers)
 */

import pool from '@/lib/db';

export type LocationType =
  | 'COMPANY_YARD'
  | 'CUSTOMER'
  | 'DRIVER_HOME'
  | 'DROP_YARD'
  | 'FUEL_STOP';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  address_line1?: string;
  address_line2?: string;
  city: string;
  state: string;
  zip?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLocationInput {
  name: string;
  type: LocationType;
  address_line1?: string;
  address_line2?: string;
  city: string;
  state: string;
  zip?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface UpdateLocationInput extends Partial<CreateLocationInput> {
  is_active?: boolean;
}

/**
 * Get all locations, optionally filtered by type
 */
export async function getLocations(type?: LocationType): Promise<Location[]> {
  const client = await pool.connect();
  try {
    let query = `
      SELECT
        id, name, type, address_line1, address_line2,
        city, state, zip, country, latitude, longitude,
        is_active, notes, created_at, updated_at
      FROM locations
      WHERE is_active = true
    `;

    const params: any[] = [];
    if (type) {
      query += ` AND type = $1`;
      params.push(type);
    }

    query += ` ORDER BY type, name`;

    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Get a single location by ID
 */
export async function getLocationById(id: string): Promise<Location | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
        id, name, type, address_line1, address_line2,
        city, state, zip, country, latitude, longitude,
        is_active, notes, created_at, updated_at
      FROM locations
      WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

/**
 * Create a new location
 */
export async function createLocation(input: CreateLocationInput): Promise<Location> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO locations (
        name, type, address_line1, address_line2,
        city, state, zip, country, latitude, longitude, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING
        id, name, type, address_line1, address_line2,
        city, state, zip, country, latitude, longitude,
        is_active, notes, created_at, updated_at`,
      [
        input.name,
        input.type,
        input.address_line1 || null,
        input.address_line2 || null,
        input.city,
        input.state,
        input.zip || null,
        input.country || 'USA',
        input.latitude || null,
        input.longitude || null,
        input.notes || null,
      ]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Update an existing location
 */
export async function updateLocation(
  id: string,
  input: UpdateLocationInput
): Promise<Location | null> {
  const client = await pool.connect();
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(input.name);
    }
    if (input.type !== undefined) {
      fields.push(`type = $${paramCount++}`);
      values.push(input.type);
    }
    if (input.address_line1 !== undefined) {
      fields.push(`address_line1 = $${paramCount++}`);
      values.push(input.address_line1);
    }
    if (input.address_line2 !== undefined) {
      fields.push(`address_line2 = $${paramCount++}`);
      values.push(input.address_line2);
    }
    if (input.city !== undefined) {
      fields.push(`city = $${paramCount++}`);
      values.push(input.city);
    }
    if (input.state !== undefined) {
      fields.push(`state = $${paramCount++}`);
      values.push(input.state);
    }
    if (input.zip !== undefined) {
      fields.push(`zip = $${paramCount++}`);
      values.push(input.zip);
    }
    if (input.country !== undefined) {
      fields.push(`country = $${paramCount++}`);
      values.push(input.country);
    }
    if (input.latitude !== undefined) {
      fields.push(`latitude = $${paramCount++}`);
      values.push(input.latitude);
    }
    if (input.longitude !== undefined) {
      fields.push(`longitude = $${paramCount++}`);
      values.push(input.longitude);
    }
    if (input.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(input.is_active);
    }
    if (input.notes !== undefined) {
      fields.push(`notes = $${paramCount++}`);
      values.push(input.notes);
    }

    if (fields.length === 0) {
      return await getLocationById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await client.query(
      `UPDATE locations
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING
         id, name, type, address_line1, address_line2,
         city, state, zip, country, latitude, longitude,
         is_active, notes, created_at, updated_at`,
      values
    );

    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

/**
 * Soft delete a location (mark as inactive)
 */
export async function deleteLocation(id: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE locations
       SET is_active = false, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    return result.rowCount! > 0;
  } finally {
    client.release();
  }
}

/**
 * Calculate distance between two locations using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  from: { latitude?: number; longitude?: number; city: string; state: string },
  to: { latitude?: number; longitude?: number; city: string; state: string }
): number {
  // If we have GPS coordinates, use Haversine formula for accurate distance
  if (from.latitude && from.longitude && to.latitude && to.longitude) {
    return haversineDistance(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude
    );
  }

  // Otherwise, estimate based on city/state
  // This is a placeholder - in production, you'd geocode the city/state
  // or use a routing API like Google Maps/Mapbox
  return estimateDistanceByCity(from.city, from.state, to.city, to.state);
}

/**
 * Haversine formula for calculating distance between two GPS coordinates
 * Returns distance in miles
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate distance between two cities
 * This is a very rough estimate - in production, use a geocoding + routing API
 */
function estimateDistanceByCity(
  fromCity: string,
  fromState: string,
  toCity: string,
  toState: string
): number {
  // Same city/state = 0 miles
  if (
    fromCity.toLowerCase() === toCity.toLowerCase() &&
    fromState.toLowerCase() === toState.toLowerCase()
  ) {
    return 0;
  }

  // Same state, different city = rough estimate
  if (fromState.toLowerCase() === toState.toLowerCase()) {
    return 50; // Placeholder: average intra-state distance
  }

  // Different states = use state-to-state estimates
  // This is very rough - ideally you'd use actual geocoding
  const stateDistances: Record<string, Record<string, number>> = {
    'OH': {
      'MI': 200,
      'PA': 150,
      'IN': 150,
      'KY': 200,
      'WV': 180,
      'IL': 350,
      'NY': 400,
      'TX': 1200,
      'CA': 2400,
    },
    // Add more state pairs as needed
  };

  const fromStateUpper = fromState.toUpperCase();
  const toStateUpper = toState.toUpperCase();

  if (stateDistances[fromStateUpper]?.[toStateUpper]) {
    return stateDistances[fromStateUpper][toStateUpper];
  }
  if (stateDistances[toStateUpper]?.[fromStateUpper]) {
    return stateDistances[toStateUpper][fromStateUpper];
  }

  // Default fallback: assume 500 miles for unknown state pairs
  return 500;
}

/**
 * Find the nearest location of a specific type from a given point
 */
export async function findNearestLocation(
  from: { city: string; state: string; latitude?: number; longitude?: number },
  locationType: LocationType
): Promise<{ location: Location; distance: number } | null> {
  const locations = await getLocations(locationType);

  if (locations.length === 0) {
    return null;
  }

  let nearest: { location: Location; distance: number } | null = null;

  for (const location of locations) {
    const distance = calculateDistance(from, location);

    if (!nearest || distance < nearest.distance) {
      nearest = { location, distance };
    }
  }

  return nearest;
}

/**
 * Get the Cambridge Terminal (default company yard)
 */
export async function getCambridgeTerminal(): Promise<Location | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
        id, name, type, address_line1, address_line2,
        city, state, zip, country, latitude, longitude,
        is_active, notes, created_at, updated_at
      FROM locations
      WHERE name = 'Cambridge Terminal' AND type = 'COMPANY_YARD'
      LIMIT 1`
    );

    return result.rows[0] || null;
  } finally {
    client.release();
  }
}
