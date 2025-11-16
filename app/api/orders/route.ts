import { NextResponse } from "next/server";

import { listOrders } from "@/lib/mock-data-store";
import { serviceFetch } from "@/lib/service-client";

type OrderRecord = ReturnType<typeof listOrders>[number];
type OrderResponse = OrderRecord & { revenue: number; created?: string };

const STATUS_MAP: Record<string, string> = {
  pending: "New",
  planning: "Planning",
  in_transit: "In Transit",
  at_risk: "At Risk",
  delivered: "Delivered",
  exception: "Exception",
  cancelled: "Exception",
};

export async function GET() {
  let orders: OrderResponse[];

  try {
    const dbOrders = await serviceFetch<Array<Record<string, any>>>("orders", "/api/orders");
    orders = dbOrders.map(transformOrderFromService);
  } catch (error) {
    console.warn("Error fetching orders from service, using mock data", error);
    orders = listOrders().map(enrichOrderRecord);
  }

  return NextResponse.json(buildOrdersResponse(orders));
}

function transformOrderFromService(order: Record<string, any>): OrderResponse {
  const createdAt = order.created_at ?? order.createdAt ?? new Date().toISOString();
  const pickupTime = order.pickup_time ?? order.pickupTime;
  const pickupLocation = order.pickup_location ?? order.pickupLocation ?? "TBD";
  const dropoffLocation = order.dropoff_location ?? order.dropoffLocation ?? "TBD";

  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageHours = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60)));

  const cost = Number(order.estimated_cost ?? order.cost ?? 0) || 0;

  return enrichOrderRecord({
    id: String(order.id ?? order.order_id ?? order.reference ?? ""),
    reference: String(order.reference ?? order.id ?? "").toUpperCase().slice(0, 8) || "ORDER",
    customer: order.customer ?? order.customer_name ?? order.customer_id ?? "Customer",
    status: STATUS_MAP[String(order.status ?? "").toLowerCase()] ?? "New",
    pickup: pickupLocation,
    delivery: dropoffLocation,
    window: pickupTime ? new Date(pickupTime).toLocaleDateString() : "TBD",
    lane: `${pickupLocation} → ${dropoffLocation}`,
    laneMiles: Number(order.lane_miles ?? order.laneMiles ?? 0) || 0,
    ageHours,
    cost,
    serviceLevel: order.service_level ?? order.serviceLevel ?? "Standard",
    commodity: order.commodity ?? "General Freight",
    created: createdAt,
  });
}

function enrichOrderRecord(order: OrderRecord): OrderResponse {
  const cost = Number(order.cost ?? 0) || 0;
  return {
    ...order,
    cost,
    revenue: Number((order as Record<string, any>).revenue ?? cost * 1.15),
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
