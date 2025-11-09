"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tripService_1 = require("../services/tripService");
const tripEventService_1 = require("../services/tripEventService");
const tripExceptionService_1 = require("../services/tripExceptionService");
const tracking_1 = require("../models/tracking");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    try {
        const { status, driverId, dispatchId, orderId } = req.query;
        const trips = await (0, tripService_1.listTrips)({
            status: parseStatus(status),
            driverId: driverId,
            dispatchId: dispatchId,
            orderId: orderId,
        });
        res.json(trips);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/", async (req, res) => {
    try {
        const trip = await (0, tripService_1.createTrip)(req.body);
        res.status(201).json(trip);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const trip = await (0, tripService_1.getTrip)(req.params.id);
        if (!trip) {
            res.status(404).json({ error: "Trip not found" });
            return;
        }
        res.json(trip);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.patch("/:id/status", async (req, res) => {
    try {
        const { status, triggeredBy, reason } = req.body;
        const parsedStatus = parseStatus(status);
        if (!parsedStatus) {
            res.status(400).json({ error: "status is required" });
            return;
        }
        const updated = await (0, tripService_1.updateTripStatus)(req.params.id, parsedStatus, {
            triggeredBy,
            reason,
        });
        res.json(updated);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.patch("/:id", async (req, res) => {
    try {
        const updated = await (0, tripService_1.updateTripFields)(req.params.id, req.body);
        res.json(updated);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get("/:id/events", async (req, res) => {
    try {
        const events = await (0, tripEventService_1.getTripEvents)(req.params.id);
        res.json(events);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/:id/events", async (req, res) => {
    try {
        const { note, triggeredBy } = req.body;
        if (!note) {
            res.status(400).json({ error: "note is required" });
            return;
        }
        const event = await (0, tripEventService_1.recordNote)(req.params.id, note, triggeredBy);
        res.status(201).json(event);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get("/:id/exceptions", async (req, res) => {
    try {
        const exceptions = await (0, tripExceptionService_1.getActiveExceptions)(req.params.id);
        res.json(exceptions);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/:id/exceptions", async (req, res) => {
    try {
        const { type, severity, message } = req.body;
        const parsedType = parseExceptionType(type);
        if (!parsedType || !severity || !message) {
            res.status(400).json({ error: "type, severity, and message are required" });
            return;
        }
        const exception = await (0, tripExceptionService_1.raiseException)({
            tripId: req.params.id,
            type: parsedType,
            severity,
            message,
        });
        res.status(201).json(exception);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post("/exceptions/:exceptionId/resolve", async (req, res) => {
    try {
        const exception = await (0, tripExceptionService_1.resolveException)(req.params.exceptionId);
        res.json(exception);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
function parseStatus(value) {
    if (!value) {
        return undefined;
    }
    const normalized = value.toLowerCase();
    const match = Object.values(tracking_1.TripStatus).find((status) => status === normalized);
    return match;
}
function parseExceptionType(value) {
    if (!value) {
        return undefined;
    }
    const normalized = value.toLowerCase();
    const match = Object.values(tracking_1.ExceptionType).find((type) => type === normalized);
    return match;
}
exports.default = router;
