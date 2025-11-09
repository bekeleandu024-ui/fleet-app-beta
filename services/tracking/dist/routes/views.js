"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const viewService_1 = require("../services/viewService");
const router = (0, express_1.Router)();
router.get("/dispatch", async (_req, res) => {
    try {
        const view = await (0, viewService_1.getDispatchView)();
        res.json(view);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/driver/:driverId", async (req, res) => {
    try {
        const view = await (0, viewService_1.getDriverViewForDriver)(req.params.driverId);
        if (!view) {
            res.status(404).json({ error: "No active trip for driver" });
            return;
        }
        res.json(view);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/customer/:orderId", async (req, res) => {
    try {
        const view = await (0, viewService_1.getCustomerViewForOrder)(req.params.orderId);
        if (!view) {
            res.status(404).json({ error: "No trip found for order" });
            return;
        }
        res.json(view);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
