"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tripService_1 = require("../services/tripService");
const config_1 = require("../config/config");
const router = (0, express_1.Router)();
router.post("/pings", async (req, res) => {
    try {
        const payload = Array.isArray(req.body) ? req.body : [req.body];
        const promises = payload.map(async (ping) => {
            if (!ping.trip_id) {
                throw new Error("trip_id is required for telemetry pings");
            }
            if (!ping.latitude || !ping.longitude) {
                throw new Error("latitude and longitude are required");
            }
            await (0, tripService_1.applyLocationUpdate)(ping.trip_id, {
                trip_id: ping.trip_id,
                driver_id: ping.driver_id,
                latitude: ping.latitude,
                longitude: ping.longitude,
                speed: ping.speed,
                heading: ping.heading,
                odometer: ping.odometer,
                fuel_level: ping.fuel_level,
                source: ping.source || config_1.DEFAULT_LOCATION_SOURCE,
                timestamp: ping.timestamp,
            });
        });
        await Promise.all(promises);
        res.status(201).json({
            accepted: payload.length,
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.default = router;
