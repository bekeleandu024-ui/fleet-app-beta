import { pool } from "../db/client";
import { LocationUpdate, LocationPoint } from "../models/tracking";
import { haversineDistanceMiles } from "../lib/geo";

const ROUTE_HISTORY_MAX_POINTS = 2000;

export async function updateRouteHistory(
  tripId: string,
  location: LocationUpdate
): Promise<void> {
  const timestamp = location.timestamp ? new Date(location.timestamp) : new Date();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const tripResult = await client.query(
      `SELECT id, actual_miles, route_history, last_known_lat, last_known_lng
         FROM trips
         WHERE id = $1
         FOR UPDATE`,
      [tripId]
    );

    if (!tripResult.rows.length) {
      throw new Error(`Trip ${tripId} not found when updating route history`);
    }

    const tripRow = tripResult.rows[0];
    const previousLat = tripRow.last_known_lat;
    const previousLng = tripRow.last_known_lng;

    let actualMiles = Number(tripRow.actual_miles ?? 0);
    if (
      previousLat !== null &&
      previousLat !== undefined &&
      previousLng !== null &&
      previousLng !== undefined
    ) {
      const distance = haversineDistanceMiles(
        Number(previousLat),
        Number(previousLng),
        location.latitude,
        location.longitude
      );
      actualMiles += distance;
    }

    const routeHistory: LocationPoint[] = Array.isArray(tripRow.route_history)
      ? tripRow.route_history
      : [];

    const newPoint: LocationPoint = {
      lat: location.latitude,
      lng: location.longitude,
      timestamp: timestamp.toISOString(),
      speed: location.speed,
      heading: location.heading,
      source: location.source,
    };

    routeHistory.push(newPoint);
    if (routeHistory.length > ROUTE_HISTORY_MAX_POINTS) {
      routeHistory.splice(0, routeHistory.length - ROUTE_HISTORY_MAX_POINTS);
    }

    await client.query(
      `INSERT INTO trip_locations (
          trip_id,
          driver_id,
          latitude,
          longitude,
          speed,
          heading,
          odometer,
          fuel_level,
          source,
          recorded_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`
    , [
  tripId,
  location.driver_id ?? null,
        location.latitude,
        location.longitude,
        location.speed ?? null,
        location.heading ?? null,
        location.odometer ?? null,
        location.fuel_level ?? null,
        location.source,
        timestamp,
      ]
    );

    await client.query(
      `UPDATE trips SET
          last_known_lat = $1,
          last_known_lng = $2,
          last_ping_at = $3,
          actual_miles = $4,
          route_history = $5,
          updated_at = NOW()
        WHERE id = $6`,
      [
        location.latitude,
        location.longitude,
        timestamp,
        actualMiles,
        JSON.stringify(routeHistory),
        tripId,
      ]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
