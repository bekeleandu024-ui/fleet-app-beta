"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_1 = require("../models/order");
const orderService_1 = require("../services/orderService");
const costingClient_1 = require("../services/costingClient");
const router = (0, express_1.Router)();
// Create a new order
router.post("/", async (req, res) => {
    try {
        const order = await (0, orderService_1.createOrder)(req.body);
        res.status(201).json(order);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// List all orders (optional: filter by customer_id)
router.get("/", async (req, res) => {
    try {
        const customerId = req.query.customer_id;
        const orders = await (0, orderService_1.listOrders)(customerId);
        const workspaceOrders = orders.map(mapOrderToWorkspace);
        const stats = buildStats(workspaceOrders);
        const filters = buildFilters(workspaceOrders);
        res.json({ stats, filters, data: workspaceOrders });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get order by ID
router.get("/:id", async (req, res) => {
    try {
        const order = await (0, orderService_1.getOrder)(req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update order status
router.patch("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const order = await (0, orderService_1.updateOrderStatus)(req.params.id, status);
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Cancel order
router.post("/:id/cancel", async (req, res) => {
    try {
        const order = await (0, orderService_1.cancelOrder)(req.params.id);
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Calculate cost for an order
router.post("/:id/calculate-cost", async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await (0, orderService_1.getOrder)(orderId);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        // Build cost request from order and body params
        const costRequest = {
            order_id: orderId,
            driver_id: req.body.driver_id,
            unit_number: req.body.unit_number,
            miles: req.body.miles,
            direction: req.body.direction,
            is_round_trip: req.body.is_round_trip || false,
            origin: order.pickup_location,
            destination: order.dropoff_location,
            order_type: order.order_type,
            border_crossings: req.body.border_crossings,
            drop_hooks: req.body.drop_hooks,
            pickups: req.body.pickups,
            deliveries: req.body.deliveries,
            revenue: req.body.revenue,
        };
        const cost = await (0, costingClient_1.calculateOrderCost)(costRequest);
        res.json(cost);
    }
    catch (error) {
        console.error('Error calculating order cost:', error);
        res.status(500).json({ error: error.message });
    }
});
// Get cost breakdown for an order
router.get("/:id/cost-breakdown", async (req, res) => {
    try {
        const orderId = req.params.id;
        const breakdown = await (0, costingClient_1.getCostBreakdown)(orderId);
        res.json(breakdown);
    }
    catch (error) {
        console.error('Error getting cost breakdown:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
function mapOrderToWorkspace(order) {
    return {
        id: order.id,
        reference: order.id,
        customer: order.customer_id,
        pickup: order.pickup_location,
        delivery: order.dropoff_location,
        window: formatWindow(order.pickup_time),
        status: mapStatus(order.status),
        ageHours: calculateAgeHours(order.created_at),
        cost: order.estimated_cost ?? undefined,
        lane: formatLane(order.pickup_location, order.dropoff_location),
    };
}
function mapStatus(status) {
    // Handle string statuses from database
    const statusStr = typeof status === 'string' ? status.toLowerCase() : status;
    switch (statusStr) {
        case 'planning':
        case order_1.OrderStatus.CONFIRMED:
        case order_1.OrderStatus.ASSIGNED:
            return "Planning";
        case 'in_transit':
        case order_1.OrderStatus.IN_PROGRESS:
            return "In Transit";
        case 'delivered':
        case order_1.OrderStatus.COMPLETED:
            return "Delivered";
        case 'at_risk':
            return "At Risk";
        case 'exception':
        case order_1.OrderStatus.CANCELLED:
            return "Exception";
        case order_1.OrderStatus.PENDING:
        default:
            return "New";
    }
}
function calculateAgeHours(dateValue) {
    const created = new Date(dateValue);
    if (Number.isNaN(created.getTime())) {
        return 0;
    }
    const diffMs = Date.now() - created.getTime();
    return Math.max(0, Math.round(diffMs / 36e5));
}
function formatWindow(pickupTime) {
    if (!pickupTime) {
        return "Not Scheduled";
    }
    const date = new Date(pickupTime);
    if (Number.isNaN(date.getTime())) {
        return "Not Scheduled";
    }
    return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}
function formatLane(pickup, delivery) {
    const origin = pickup?.trim() ?? "";
    const destination = delivery?.trim() ?? "";
    if (!origin && !destination) {
        return "";
    }
    return `${origin}${destination ? " → " : ""}${destination}`;
}
function buildStats(orders) {
    return {
        total: orders.length,
        new: orders.filter((order) => order.status === "New").length,
        inProgress: orders.filter((order) => ["Planning", "In Transit"].includes(order.status)).length,
        delayed: orders.filter((order) => ["At Risk", "Exception"].includes(order.status)).length,
    };
}
function buildFilters(orders) {
    const customers = Array.from(new Set(orders.map((order) => order.customer))).sort();
    const statuses = ["New", "Planning", "In Transit", "At Risk", "Delivered", "Exception"].filter((status) => orders.some((order) => order.status === status));
    const lanes = Array.from(new Set(orders.map((order) => order.lane))).filter(Boolean).sort();
    return {
        customers: ["All", ...customers],
        statuses,
        lanes,
        dateRanges: ["Today", "48 Hours", "7 Days"],
    };
}
