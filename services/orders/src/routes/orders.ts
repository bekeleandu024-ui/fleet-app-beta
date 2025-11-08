import { Router } from "express";
import { createOrder, getOrder, listOrders, updateOrderStatus, cancelOrder } from "../services/orderService";
import { calculateOrderCost, getCostBreakdown } from "../services/costingClient";

const router = Router();

// Create a new order
router.post("/", async (req, res) => {
  try {
    const order = await createOrder(req.body);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List all orders (optional: filter by customer_id)
router.get("/", async (req, res) => {
  try {
    const customerId = req.query.customer_id as string | undefined;
    const orders = await listOrders(customerId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await updateOrderStatus(req.params.id, status);
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel order
router.post("/:id/cancel", async (req, res) => {
  try {
    const order = await cancelOrder(req.params.id);
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate cost for an order
router.post("/:id/calculate-cost", async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await getOrder(orderId);
    
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

    const cost = await calculateOrderCost(costRequest);
    res.json(cost);
  } catch (error: any) {
    console.error('Error calculating order cost:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get cost breakdown for an order
router.get("/:id/cost-breakdown", async (req, res) => {
  try {
    const orderId = req.params.id;
    const breakdown = await getCostBreakdown(orderId);
    res.json(breakdown);
  } catch (error: any) {
    console.error('Error getting cost breakdown:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
