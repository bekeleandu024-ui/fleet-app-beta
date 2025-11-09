"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDispatchView = getDispatchView;
exports.getDriverViewForDriver = getDriverViewForDriver;
exports.getCustomerViewForOrder = getCustomerViewForOrder;
const client_1 = require("../db/client");
const tracking_1 = require("../models/tracking");
const parsers_1 = require("../lib/parsers");
const tripExceptionService_1 = require("./tripExceptionService");
async function getDispatchView() {
    const tripsResult = await client_1.pool.query(`SELECT * FROM trips
      WHERE status NOT IN ($1, $2)
      ORDER BY created_at DESC`, [tracking_1.TripStatus.CLOSED, tracking_1.TripStatus.CANCELLED]);
    const trips = tripsResult.rows.map(parsers_1.mapTripRow);
    const withExceptions = await Promise.all(trips.map(async (trip) => {
        const exceptions = await (0, tripExceptionService_1.getActiveExceptions)(trip.id);
        const risk = calculateRiskLevel(trip.status, exceptions);
        return {
            ...trip,
            active_exceptions: exceptions,
            risk_level: risk,
        };
    }));
    return withExceptions;
}
function calculateRiskLevel(status, exceptions) {
    if (status === tracking_1.TripStatus.DELAYED) {
        return "red";
    }
    if (exceptions.some((ex) => ex.severity === "critical")) {
        return "red";
    }
    if (exceptions.some((ex) => ex.severity === "high")) {
        return "yellow";
    }
    return "green";
}
async function getDriverViewForDriver(driverId) {
    const tripResult = await client_1.pool.query(`SELECT * FROM trips
      WHERE driver_id = $1
      AND status NOT IN ($2,$3,$4)
      ORDER BY created_at DESC
      LIMIT 1`, [driverId, tracking_1.TripStatus.COMPLETED, tracking_1.TripStatus.CLOSED, tracking_1.TripStatus.CANCELLED]);
    if (!tripResult.rows.length) {
        return null;
    }
    const trip = (0, parsers_1.mapTripRow)(tripResult.rows[0]);
    const stops = await listStopsForTrip(trip.id);
    const currentStopIndex = resolveCurrentStopIndex(trip.status, stops);
    return {
        trip_id: trip.id,
        status: trip.status,
        pickup_location: trip.pickup_location,
        pickup_window_start: trip.pickup_window_start,
        pickup_window_end: trip.pickup_window_end,
        dropoff_location: trip.dropoff_location,
        delivery_window_start: trip.delivery_window_start,
        delivery_window_end: trip.delivery_window_end,
        special_instructions: trip.notes,
        stops,
        current_stop_index: currentStopIndex,
    };
}
function resolveCurrentStopIndex(status, stops) {
    if (!stops.length) {
        return 0;
    }
    switch (status) {
        case tracking_1.TripStatus.EN_ROUTE_TO_PICKUP:
            return 0;
        case tracking_1.TripStatus.AT_PICKUP:
        case tracking_1.TripStatus.LOADING:
            return 0;
        case tracking_1.TripStatus.DEPARTED_PICKUP:
        case tracking_1.TripStatus.IN_TRANSIT:
        case tracking_1.TripStatus.EN_ROUTE_TO_DELIVERY:
            return 1;
        case tracking_1.TripStatus.AT_DELIVERY:
        case tracking_1.TripStatus.UNLOADING:
        case tracking_1.TripStatus.DELIVERED:
            return Math.max(1, stops.length - 1);
        default:
            return Math.max(0, stops.length - 1);
    }
}
async function getCustomerViewForOrder(orderId) {
    const result = await client_1.pool.query(`SELECT * FROM trips
      WHERE order_id = $1
      ORDER BY created_at DESC
      LIMIT 1`, [orderId]);
    if (!result.rows.length) {
        return null;
    }
    const trip = (0, parsers_1.mapTripRow)(result.rows[0]);
    let status = "Scheduled";
    if (trip.status === tracking_1.TripStatus.DEPARTED_PICKUP ||
        trip.status === tracking_1.TripStatus.IN_TRANSIT ||
        trip.status === tracking_1.TripStatus.EN_ROUTE_TO_DELIVERY) {
        status = "In Transit";
    }
    else if (trip.status === tracking_1.TripStatus.DELIVERED || trip.status === tracking_1.TripStatus.COMPLETED || trip.status === tracking_1.TripStatus.CLOSED) {
        status = "Delivered";
    }
    else if (trip.status === tracking_1.TripStatus.AT_PICKUP || trip.status === tracking_1.TripStatus.LOADING) {
        status = "Picked Up";
    }
    return {
        order_id: trip.order_id,
        status,
        pickup_eta: trip.pickup_window_start?.toISOString(),
        delivery_eta: trip.delivery_window_end?.toISOString(),
        last_known_location: trip.current_lat && trip.current_lng ? `${trip.current_lat},${trip.current_lng}` : undefined,
        delivered_at: trip.delivery_departure,
        tracking_url: undefined,
    };
}
async function listStopsForTrip(tripId) {
    const result = await client_1.pool.query(`SELECT * FROM trip_stops
      WHERE trip_id = $1
      ORDER BY sequence ASC`, [tripId]);
    return result.rows.map(parsers_1.mapStopRow);
}
