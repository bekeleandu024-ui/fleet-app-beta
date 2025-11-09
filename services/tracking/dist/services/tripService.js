"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTrip = createTrip;
exports.getTrip = getTrip;
exports.getTripByDispatchId = getTripByDispatchId;
exports.listTrips = listTrips;
exports.updateTripStatus = updateTripStatus;
exports.updateTripFields = updateTripFields;
exports.applyLocationUpdate = applyLocationUpdate;
exports.closeTrip = closeTrip;
const client_1 = require("../db/client");
const tracking_1 = require("../models/tracking");
const parsers_1 = require("../lib/parsers");
const statusMachine_1 = require("../lib/statusMachine");
const tripEventService_1 = require("./tripEventService");
const tripLocationService_1 = require("./tripLocationService");
const kafkaProducer_1 = require("./kafkaProducer");
async function createTrip(input) {
    const { orderId, dispatchId, driverId, unitId, pickup, delivery, stops = [], plannedStart, plannedMiles, notes, } = input;
    const trip = await (0, client_1.withTransaction)(async (client) => {
        const insertTrip = await client.query(`INSERT INTO trips (
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
      ) RETURNING *`, [
            orderId,
            dispatchId ?? null,
            driverId,
            unitId ?? null,
            tracking_1.TripStatus.PLANNED,
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
        ]);
        const created = insertTrip.rows[0];
        const stopTuples = [
            {
                sequence: 1,
                type: "pickup",
                data: pickup,
            },
            ...stops.map((stop, index) => ({
                sequence: index + 2,
                type: stop.type,
                data: stop,
            })),
            {
                sequence: stops.length + 2,
                type: "delivery",
                data: delivery,
            },
        ];
        for (const stop of stopTuples) {
            await client.query(`INSERT INTO trip_stops (
            trip_id,
            sequence,
            type,
            location,
            lat,
            lng,
            window_start,
            window_end,
            notes
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
                created.id,
                stop.sequence,
                stop.type,
                stop.data.location,
                stop.data.lat ?? null,
                stop.data.lng ?? null,
                stop.data.windowStart ?? null,
                stop.data.windowEnd ?? null,
                stop.data.notes ?? null,
            ]);
        }
        return created;
    });
    await (0, kafkaProducer_1.publishEvent)("tracking.trip.created", {
        tripId: trip.id,
        orderId,
        driverId,
        dispatchId: dispatchId ?? null,
        status: tracking_1.TripStatus.PLANNED,
        timestamp: new Date().toISOString(),
    });
    await (0, tripEventService_1.recordStatusEvent)(trip.id, tracking_1.TripStatus.PLANNED, {
        triggeredBy: "system",
        reason: "Trip created",
    });
    return (0, parsers_1.mapTripRow)(trip);
}
async function getTrip(tripId) {
    const result = await client_1.pool.query(`SELECT * FROM trips WHERE id = $1`, [tripId]);
    if (!result.rows.length) {
        return null;
    }
    return (0, parsers_1.mapTripRow)(result.rows[0]);
}
async function getTripByDispatchId(dispatchId) {
    const result = await client_1.pool.query(`SELECT * FROM trips WHERE dispatch_id = $1 ORDER BY created_at DESC LIMIT 1`, [dispatchId]);
    if (!result.rows.length) {
        return null;
    }
    return (0, parsers_1.mapTripRow)(result.rows[0]);
}
async function listTrips(filters = {}) {
    const conditions = [];
    const values = [];
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
    const results = await client_1.pool.query(`SELECT * FROM trips ${where} ORDER BY created_at DESC`, values);
    return results.rows.map(parsers_1.mapTripRow);
}
async function updateTripStatus(tripId, nextStatus, options = {}) {
    const existing = await getTrip(tripId);
    if (!existing) {
        throw new Error(`Trip ${tripId} not found`);
    }
    if (!(0, statusMachine_1.canTransition)(existing.status, nextStatus)) {
        throw new Error(`Cannot transition from ${existing.status} to ${nextStatus}`);
    }
    const updates = ["status = $1"]; // status placeholder replaced later
    const values = [nextStatus, tripId];
    const now = options.occurredAt ?? new Date();
    if (nextStatus === tracking_1.TripStatus.EN_ROUTE_TO_PICKUP) {
        updates.push("actual_start = $" + (values.length + 1));
        values.push(now);
    }
    if (nextStatus === tracking_1.TripStatus.AT_PICKUP) {
        updates.push("pickup_arrival = $" + (values.length + 1));
        values.push(now);
        await markStopTimestamp(tripId, "pickup", "arrived_at", now);
    }
    if (nextStatus === tracking_1.TripStatus.DEPARTED_PICKUP) {
        updates.push("pickup_departure = $" + (values.length + 1));
        values.push(now);
        await markStopTimestamp(tripId, "pickup", "departed_at", now);
    }
    if (nextStatus === tracking_1.TripStatus.AT_DELIVERY) {
        updates.push("delivery_arrival = $" + (values.length + 1));
        values.push(now);
        await markStopTimestamp(tripId, "delivery", "arrived_at", now);
    }
    if (nextStatus === tracking_1.TripStatus.DELIVERED) {
        updates.push("delivery_departure = $" + (values.length + 1));
        values.push(now);
        await markStopTimestamp(tripId, "delivery", "departed_at", now);
    }
    if (nextStatus === tracking_1.TripStatus.COMPLETED) {
        updates.push("completed_at = $" + (values.length + 1));
        values.push(now);
    }
    const updateSql = `UPDATE trips SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $2 RETURNING *`;
    const result = await client_1.pool.query(updateSql, values);
    const updated = (0, parsers_1.mapTripRow)(result.rows[0]);
    await (0, tripEventService_1.recordStatusEvent)(tripId, nextStatus, options);
    await (0, kafkaProducer_1.publishEvent)("tracking.trip.status.changed", {
        tripId,
        from: existing.status,
        to: nextStatus,
        occurredAt: now.toISOString(),
        triggeredBy: options.triggeredBy ?? "system",
    });
    return updated;
}
async function updateTripFields(tripId, updates) {
    const updatesSql = [];
    const values = [];
    const setField = (column, value) => {
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
    const result = await client_1.pool.query(sql, values);
    return (0, parsers_1.mapTripRow)(result.rows[0]);
}
async function applyLocationUpdate(tripId, location) {
    await (0, tripLocationService_1.updateRouteHistory)(tripId, location);
}
async function closeTrip(tripId) {
    const result = await client_1.pool.query(`UPDATE trips SET status = $1, closed_at = NOW(), updated_at = NOW()
     WHERE id = $2 RETURNING *`, [tracking_1.TripStatus.CLOSED, tripId]);
    const updated = (0, parsers_1.mapTripRow)(result.rows[0]);
    await (0, kafkaProducer_1.publishEvent)("tracking.trip.closed", {
        tripId,
        timestamp: new Date().toISOString(),
    });
    return updated;
}
async function markStopTimestamp(tripId, type, column, timestamp) {
    await client_1.pool.query(`UPDATE trip_stops SET ${column} = $1, updated_at = NOW()
      WHERE id = (
        SELECT id FROM trip_stops
        WHERE trip_id = $2 AND type = $3
        ORDER BY sequence ASC
        LIMIT 1
      )`, [timestamp, tripId, type]);
}
