import { QueryResult } from "pg";
import { pool, withTransaction } from "../db/client";
import { Trip, TripStatus, TripStop, LocationUpdate } from "../models/tracking";
import { mapTripRow } from "../lib/parsers";
import { canTransition } from "../lib/statusMachine";
import { recordStatusEvent } from "./tripEventService";
import { updateRouteHistory } from "./tripLocationService";
import { publishEvent } from "./kafkaProducer";

type NullableDate = Date | null | undefined;

export interface CreateTripInput {
  orderId: string;
  dispatchId?: string;
  driverId: string;
  unitId?: string;
  pickup: {
    location: string;
    lat?: number;
    lng?: number;
    windowStart?: NullableDate;
    windowEnd?: NullableDate;
    notes?: string;
  };
  delivery: {
    location: string;
    lat?: number;
    lng?: number;
    windowStart?: NullableDate;
    windowEnd?: NullableDate;
    notes?: string;
  };
  stops?: Array<{
    location: string;
    type: TripStop["type"];
    lat?: number;
    lng?: number;
    windowStart?: NullableDate;
    windowEnd?: NullableDate;
    notes?: string;
  }>;
  plannedStart?: NullableDate;
  plannedMiles?: number;
  notes?: string;
}

export interface UpdateTripInput {
  pickup_window_start?: NullableDate;
  pickup_window_end?: NullableDate;
  delivery_window_start?: NullableDate;
  delivery_window_end?: NullableDate;
  planned_start?: NullableDate;
  notes?: string;
  planned_miles?: number;
  estimated_fuel_gallons?: number;
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const {
    orderId,
    dispatchId,
    driverId,
    unitId,
    pickup,
    delivery,
    stops = [],
    plannedStart,
    plannedMiles,
    notes,
  } = input;

  const trip = await withTransaction(async (client) => {
    const insertTrip: QueryResult = await client.query(
      `INSERT INTO trips (
        order_id,
        dispatch_id,
        driver_id,
        unit_id,
        status,
        pickup_location,
        pickup_lat,
        pickup_lng,
        dropoff_location,
        dropoff_lat,
        dropoff_lng,
        pickup_window_start,
        pickup_window_end,
        delivery_window_start,
        delivery_window_end,
        planned_start,
        planned_miles,
        notes
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      ) RETURNING *`,
      [
        orderId,
        dispatchId ?? null,
        driverId,
        unitId ?? null,
        TripStatus.PLANNED,
        pickup.location,
        pickup.lat ?? null,
        pickup.lng ?? null,
        delivery.location,
        delivery.lat ?? null,
        delivery.lng ?? null,
        pickup.windowStart ?? null,
        pickup.windowEnd ?? null,
        delivery.windowStart ?? null,
        delivery.windowEnd ?? null,
        plannedStart ?? null,
        plannedMiles ?? null,
        notes ?? null,
      ]
    );

    const created = insertTrip.rows[0];

    const stopTuples = [
      {
        sequence: 1,
        type: "pickup" as TripStop["type"],
        data: pickup,
      },
      ...stops.map((stop, index) => ({
        sequence: index + 2,
        type: stop.type,
        data: stop,
      })),
      {
        sequence: stops.length + 2,
        type: "delivery" as TripStop["type"],
        data: delivery,
      },
    ];

    for (const stop of stopTuples) {
      await client.query(
        `INSERT INTO trip_stops (
            trip_id,
            sequence,
            type,
            location,
            lat,
            lng,
            window_start,
            window_end,
            notes
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          created.id,
          stop.sequence,
          stop.type,
          stop.data.location,
          stop.data.lat ?? null,
          stop.data.lng ?? null,
          stop.data.windowStart ?? null,
          stop.data.windowEnd ?? null,
          stop.data.notes ?? null,
        ]
      );
    }

    return created;
  });

  await publishEvent("tracking.trip.created", {
    tripId: trip.id,
    orderId,
    driverId,
    dispatchId: dispatchId ?? null,
    status: TripStatus.PLANNED,
    timestamp: new Date().toISOString(),
  });

  await recordStatusEvent(trip.id, TripStatus.PLANNED, {
    triggeredBy: "system",
    reason: "Trip created",
  });

  return mapTripRow(trip);
}

export async function getTrip(tripId: string): Promise<Trip | null> {
  const result = await pool.query(`SELECT * FROM trips WHERE id = $1`, [tripId]);
  if (!result.rows.length) {
    return null;
  }
  return mapTripRow(result.rows[0]);
}

export async function getTripByDispatchId(
  dispatchId: string
): Promise<Trip | null> {
  const result = await pool.query(
    `SELECT * FROM trips WHERE dispatch_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [dispatchId]
  );
  if (!result.rows.length) {
    return null;
  }
  return mapTripRow(result.rows[0]);
}

export interface ListTripsFilters {
  status?: TripStatus;
  driverId?: string;
  dispatchId?: string;
  orderId?: string;
}

export async function listTrips(filters: ListTripsFilters = {}): Promise<Trip[]> {
  const conditions: string[] = [];
  const values: any[] = [];

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }
  if (filters.driverId) {
    values.push(filters.driverId);
    conditions.push(`driver_id = $${values.length}`);
  }
  if (filters.dispatchId) {
    values.push(filters.dispatchId);
    conditions.push(`dispatch_id = $${values.length}`);
  }
  if (filters.orderId) {
    values.push(filters.orderId);
    conditions.push(`order_id = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const results = await pool.query(`SELECT * FROM trips ${where} ORDER BY created_at DESC`, values);
  return results.rows.map(mapTripRow);
}

export interface StatusChangeOptions {
  triggeredBy?: string;
  reason?: string;
  occurredAt?: Date;
}

export async function updateTripStatus(
  tripId: string,
  nextStatus: TripStatus,
  options: StatusChangeOptions = {}
): Promise<Trip> {
  const existing = await getTrip(tripId);
  if (!existing) {
    throw new Error(`Trip ${tripId} not found`);
  }

  if (!canTransition(existing.status, nextStatus)) {
    throw new Error(`Cannot transition from ${existing.status} to ${nextStatus}`);
  }

  const updates: string[] = ["status = $1"]; // status placeholder replaced later
  const values: any[] = [nextStatus, tripId];

  const now = options.occurredAt ?? new Date();

  if (nextStatus === TripStatus.EN_ROUTE_TO_PICKUP) {
    updates.push("actual_start = $" + (values.length + 1));
    values.push(now);
  }
  if (nextStatus === TripStatus.AT_PICKUP) {
    updates.push("pickup_arrival = $" + (values.length + 1));
    values.push(now);
    await markStopTimestamp(tripId, "pickup", "arrived_at", now);
  }
  if (nextStatus === TripStatus.DEPARTED_PICKUP) {
    updates.push("pickup_departure = $" + (values.length + 1));
    values.push(now);
    await markStopTimestamp(tripId, "pickup", "departed_at", now);
  }
  if (nextStatus === TripStatus.AT_DELIVERY) {
    updates.push("delivery_arrival = $" + (values.length + 1));
    values.push(now);
    await markStopTimestamp(tripId, "delivery", "arrived_at", now);
  }
  if (nextStatus === TripStatus.DELIVERED) {
    updates.push("delivery_departure = $" + (values.length + 1));
    values.push(now);
    await markStopTimestamp(tripId, "delivery", "departed_at", now);
  }
  if (nextStatus === TripStatus.COMPLETED) {
    updates.push("completed_at = $" + (values.length + 1));
    values.push(now);
  }

  const updateSql = `UPDATE trips SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $2 RETURNING *`;
  const result = await pool.query(updateSql, values);
  const updated = mapTripRow(result.rows[0]);

  await recordStatusEvent(tripId, nextStatus, options);

  await publishEvent("tracking.trip.status.changed", {
    tripId,
    from: existing.status,
    to: nextStatus,
    occurredAt: now.toISOString(),
    triggeredBy: options.triggeredBy ?? "system",
  });

  return updated;
}

export async function updateTripFields(
  tripId: string,
  updates: UpdateTripInput
): Promise<Trip> {
  const updatesSql: string[] = [];
  const values: any[] = [];

  const setField = (column: string, value: any) => {
    values.push(value);
    updatesSql.push(`${column} = $${values.length}`);
  };

  if (updates.pickup_window_start !== undefined) {
    setField("pickup_window_start", updates.pickup_window_start);
  }
  if (updates.pickup_window_end !== undefined) {
    setField("pickup_window_end", updates.pickup_window_end);
  }
  if (updates.delivery_window_start !== undefined) {
    setField("delivery_window_start", updates.delivery_window_start);
  }
  if (updates.delivery_window_end !== undefined) {
    setField("delivery_window_end", updates.delivery_window_end);
  }
  if (updates.planned_start !== undefined) {
    setField("planned_start", updates.planned_start);
  }
  if (updates.notes !== undefined) {
    setField("notes", updates.notes);
  }
  if (updates.planned_miles !== undefined) {
    setField("planned_miles", updates.planned_miles);
  }
  if (updates.estimated_fuel_gallons !== undefined) {
    setField("estimated_fuel_gallons", updates.estimated_fuel_gallons);
  }

  if (!updatesSql.length) {
    const existing = await getTrip(tripId);
    if (!existing) {
      throw new Error(`Trip ${tripId} not found`);
    }
    return existing;
  }

  values.push(tripId);
  const sql = `UPDATE trips SET ${updatesSql.join(", ")}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
  const result = await pool.query(sql, values);
  return mapTripRow(result.rows[0]);
}

export async function applyLocationUpdate(
  tripId: string,
  location: LocationUpdate
): Promise<void> {
  await updateRouteHistory(tripId, location);
}

export async function closeTrip(tripId: string): Promise<Trip> {
  const result = await pool.query(
    `UPDATE trips SET status = $1, closed_at = NOW(), updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [TripStatus.CLOSED, tripId]
  );
  const updated = mapTripRow(result.rows[0]);

  await publishEvent("tracking.trip.closed", {
    tripId,
    timestamp: new Date().toISOString(),
  });

  return updated;
}

async function markStopTimestamp(
  tripId: string,
  type: TripStop["type"],
  column: "arrived_at" | "departed_at",
  timestamp: Date
) {
  await pool.query(
    `UPDATE trip_stops SET ${column} = $1, updated_at = NOW()
      WHERE id = (
        SELECT id FROM trip_stops
        WHERE trip_id = $2 AND type = $3
        ORDER BY sequence ASC
        LIMIT 1
      )`,
    [timestamp, tripId, type]
  );
}
