import { Router } from "express";
import { createOrder, getOrder, listOrders, updateOrderStatus, cancelOrder } from "../services/orderService";

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

export default router;
