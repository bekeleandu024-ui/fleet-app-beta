"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordEvent = recordEvent;
exports.recordStatusEvent = recordStatusEvent;
exports.recordNote = recordNote;
exports.getTripEvents = getTripEvents;
const client_1 = require("../db/client");
const parsers_1 = require("../lib/parsers");
const kafkaProducer_1 = require("./kafkaProducer");
async function recordEvent(tripId, eventType, options = {}) {
    const occurredAt = options.occurredAt ?? new Date();
    const result = await client_1.pool.query(`INSERT INTO trip_events (
        trip_id,
        event_type,
        status,
        source,
        payload,
        triggered_by,
        occurred_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`, [
        tripId,
        eventType,
        options.payload?.status ?? null,
        options.source ?? null,
        options.payload ?? null,
        options.triggeredBy ?? null,
        occurredAt,
    ]);
    const event = (0, parsers_1.mapEventRow)(result.rows[0]);
    await (0, kafkaProducer_1.publishEvent)("tracking.event.created", {
        tripId,
        eventType,
        occurredAt: occurredAt.toISOString(),
        source: options.source ?? "system",
        payload: options.payload ?? null,
    });
    return event;
}
async function recordStatusEvent(tripId, status, options = {}) {
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
async function recordNote(tripId, note, triggeredBy) {
    return recordEvent(tripId, "note.added", {
        payload: { note },
        triggeredBy,
    });
}
async function getTripEvents(tripId) {
    const result = await client_1.pool.query(`SELECT * FROM trip_events WHERE trip_id = $1 ORDER BY occurred_at ASC`, [tripId]);
    return result.rows.map(parsers_1.mapEventRow);
}
