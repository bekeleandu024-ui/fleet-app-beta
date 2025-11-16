import { Router } from "express";
import { Order, OrderStatus } from "../models/order";
import { createOrder, getOrder, listOrders, updateOrderStatus, cancelOrder } from "../services/orderService";
import { calculateOrderCost, getCostBreakdown } from "../services/costingClient";

type WorkspaceOrderStatus = "New" | "Planning" | "In Transit" | "At Risk" | "Delivered" | "Exception";

interface WorkspaceOrder {
  id: string;
  reference: string;
  customer: string;
  pickup: string;
  delivery: string;
  window: string;
  status: WorkspaceOrderStatus;
  ageHours: number;
  cost?: number;
  lane: string;
  serviceLevel?: string;
  commodity?: string;
  laneMiles?: number;
}

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
    const workspaceOrders = orders.map(mapOrderToWorkspace);
    const stats = buildStats(workspaceOrders);
    const filters = buildFilters(workspaceOrders);

    res.json({ stats, filters, data: workspaceOrders });
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

function mapOrderToWorkspace(order: Order): WorkspaceOrder {
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

function mapStatus(status: OrderStatus): WorkspaceOrderStatus {
  switch (status) {
    case OrderStatus.PENDING:
      return "New";
    case OrderStatus.CONFIRMED:
    case OrderStatus.ASSIGNED:
      return "Planning";
    case OrderStatus.IN_PROGRESS:
      return "In Transit";
    case OrderStatus.COMPLETED:
      return "Delivered";
    case OrderStatus.CANCELLED:
      return "Exception";
    default:
      return "New";
  }
}

function calculateAgeHours(dateValue: Date | string): number {
  const created = new Date(dateValue);
  if (Number.isNaN(created.getTime())) {
    return 0;
  }
  const diffMs = Date.now() - created.getTime();
  return Math.max(0, Math.round(diffMs / 36e5));
}

function formatWindow(pickupTime?: Date | string | null): string {
  if (!pickupTime) {
    return "Scheduled";
  }
  const date = new Date(pickupTime);
  if (Number.isNaN(date.getTime())) {
    return "Scheduled";
  }
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatLane(pickup?: string, delivery?: string): string {
  const origin = pickup?.trim() ?? "";
  const destination = delivery?.trim() ?? "";
  if (!origin && !destination) {
    return "";
  }
  return `${origin}${destination ? " → " : ""}${destination}`;
}

function buildStats(orders: WorkspaceOrder[]) {
  return {
    total: orders.length,
    new: orders.filter((order) => order.status === "New").length,
    inProgress: orders.filter((order) => ["Planning", "In Transit"].includes(order.status)).length,
    delayed: orders.filter((order) => ["At Risk", "Exception"].includes(order.status)).length,
  };
}

function buildFilters(orders: WorkspaceOrder[]) {
  const customers = Array.from(new Set(orders.map((order) => order.customer))).sort();
  const statuses = ["New", "Planning", "In Transit", "At Risk", "Delivered", "Exception"].filter((status) =>
    orders.some((order) => order.status === status)
  );
  const lanes = Array.from(new Set(orders.map((order) => order.lane))).filter(Boolean).sort();

  return {
    customers: ["All", ...customers],
    statuses,
    lanes,
    dateRanges: ["Today", "48 Hours", "7 Days"],
  };
}
