import { pool } from "../db/client";
import { TripEvent, TripStatus } from "../models/tracking";
import { mapEventRow } from "../lib/parsers";
import { publishEvent } from "./kafkaProducer";

export interface EventOptions {
  payload?: Record<string, unknown>;
  triggeredBy?: string;
  occurredAt?: Date;
  source?: string;
}

export async function recordEvent(
  tripId: string,
  eventType: string,
  options: EventOptions = {}
): Promise<TripEvent> {
  const occurredAt = options.occurredAt ?? new Date();
  const result = await pool.query(
    `INSERT INTO trip_events (
        trip_id,
        event_type,
        status,
        source,
        payload,
        triggered_by,
        occurred_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
    [
      tripId,
      eventType,
      options.payload?.status ?? null,
      options.source ?? null,
      options.payload ?? null,
      options.triggeredBy ?? null,
      occurredAt,
    ]
  );

  const event = mapEventRow(result.rows[0]);

  await publishEvent("tracking.event.created", {
    tripId,
    eventType,
    occurredAt: occurredAt.toISOString(),
    source: options.source ?? "system",
    payload: options.payload ?? null,
  });

  return event;
}

export interface StatusEventOptions extends EventOptions {
  reason?: string;
}

export async function recordStatusEvent(
  tripId: string,
  status: TripStatus,
  options: StatusEventOptions = {}
): Promise<TripEvent> {
  const payload = {
    status,
    reason: options.reason ?? null,
    ...options.payload,
  };

  return recordEvent(tripId, "status.change", {
    ...options,
    payload,
  });
}

export async function recordNote(
  tripId: string,
  note: string,
  triggeredBy?: string
): Promise<TripEvent> {
  return recordEvent(tripId, "note.added", {
    payload: { note },
    triggeredBy,
  });
}

export async function getTripEvents(tripId: string): Promise<TripEvent[]> {
  const result = await pool.query(
    `SELECT * FROM trip_events WHERE trip_id = $1 ORDER BY occurred_at ASC`,
    [tripId]
  );
  return result.rows.map(mapEventRow);
}

export async function getAllEvents(limit: number = 100): Promise<TripEvent[]> {
  const result = await pool.query(
    `SELECT * FROM trip_events ORDER BY occurred_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows.map(mapEventRow);
}
