"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dispatchService_1 = require("../services/dispatchService");
const router = (0, express_1.Router)();
// Assign a driver to an order
router.post("/assign", async (req, res) => {
    try {
        const { orderId, driverId } = req.body;
        const dispatch = await (0, dispatchService_1.assignDriver)(orderId, driverId);
        res.json(dispatch);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get dispatch by ID
router.get("/:id", async (req, res) => {
    try {
        const dispatch = await (0, dispatchService_1.getDispatch)(req.params.id);
        if (!dispatch) {
            return res.status(404).json({ error: "Dispatch not found" });
        }
        res.json(dispatch);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update dispatch status
router.patch("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const dispatch = await (0, dispatchService_1.updateDispatchStatus)(req.params.id, status);
        res.json(dispatch);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
