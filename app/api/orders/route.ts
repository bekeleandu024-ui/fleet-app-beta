import { NextResponse } from "next/server";

import { serviceFetch } from "@/lib/service-client";
import { buildLane, mapOrderStatus } from "@/lib/transformers";
import type { OrderListItem } from "@/lib/types";

type OrderResponse = OrderListItem & { revenue: number; created?: string };

export async function GET() {
  try {
    const dbOrders = await serviceFetch<Array<Record<string, any>>>("orders", "/api/orders");
    const orders = dbOrders.map(transformOrderFromService);
    return NextResponse.json(buildOrdersResponse(orders));
  } catch (error) {
    console.error("Error fetching orders from service", error);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

function transformOrderFromService(order: Record<string, any>): OrderResponse {
  const id = String(order.id ?? order.order_id ?? "");
  const pickup = order.pickup_location ?? order.pickupLocation ?? "";
  const delivery = order.delivery_location ?? order.dropoff_location ?? order.dropoffLocation ?? "";
  const reference = id ? `ORD-${id.slice(0, 8).toUpperCase()}` : "ORDER";
  const createdAt = order.created_at ?? order.createdAt ?? new Date().toISOString();
  const ageHours = calculateAgeHours(createdAt);
  const window = resolveWindow(order.pickup_window_start ?? order.pickup_time);

  return {
    id,
    reference,
    customer: order.customer_name ?? order.customer ?? order.customer_id ?? "Customer",
    pickup,
    delivery,
    window,
    status: mapOrderStatus(order.status),
    ageHours,
    cost: Number(order.cost ?? order.estimated_cost ?? 0) || 0,
    lane: buildLane(pickup, delivery),
    serviceLevel: order.service_level ?? "Standard",
    commodity: order.commodity ?? "General",
    laneMiles: Number(order.lane_miles ?? order.laneMiles ?? 0) || 0,
    revenue: Number(order.revenue ?? 0),
    created: createdAt,
  };
}

function buildOrdersResponse(orders: OrderResponse[]) {
  const stats = {
    total: orders.length,
    new: orders.filter((o) => o.status === "New").length,
    inProgress: orders.filter((o) => ["Planning", "In Transit"].includes(o.status)).length,
    delayed: orders.filter((o) => ["At Risk", "Exception"].includes(o.status)).length,
  };

  const customers = Array.from(new Set(orders.map((o) => o.customer))).sort();
  const statuses = Array.from(new Set(orders.map((o) => o.status))).sort();
  const lanes = Array.from(new Set(orders.map((o) => o.lane))).sort();

  return {
    stats,
    filters: {
      customers: ["All", ...customers],
      statuses,
      lanes,
      dateRanges: ["Today", "48 Hours", "7 Days"],
    },
    data: orders,
  };
}

function resolveWindow(dateValue?: string | Date | null) {
  if (!dateValue) {
    return "Scheduled";
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "Scheduled";
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateAgeHours(dateValue?: string | Date | null) {
  if (!dateValue) {
    return 0;
  }
  const created = new Date(dateValue);
  if (Number.isNaN(created.getTime())) {
    return 0;
  }
  const diff = Date.now() - created.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
}
