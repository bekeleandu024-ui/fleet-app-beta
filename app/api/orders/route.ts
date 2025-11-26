import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { buildLane, mapOrderStatus } from "@/lib/transformers";
import type { OrderListItem } from "@/lib/types";

type OrderResponse = OrderListItem & { 
  revenue: number; 
  created?: string;
  pickupWindowStart?: string;
  pickupWindowEnd?: string;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
};

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      // Fetch orders that are NOT closed
      const query = `
        SELECT * FROM orders 
        WHERE status != 'Closed' 
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query);
      const orders = result.rows.map(transformOrderFromDb);
      
      return NextResponse.json(buildOrdersResponse(orders));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching orders from DB:", error);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

function transformOrderFromDb(order: Record<string, any>): OrderResponse {
  const id = String(order.id ?? "");
  const pickup = order.pickup_location ?? "";
  const delivery = order.dropoff_location ?? "";
  const reference = id ? `ORD-${id.slice(0, 8).toUpperCase()}` : "ORDER";
  const createdAt = order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString();
  const ageHours = calculateAgeHours(createdAt);
  
  const pickupDateTime = order.pickup_time;
  const window = resolveWindow(pickupDateTime) ?? "Not Scheduled";
  const lane = buildLane(pickup, delivery);

  return {
    id,
    reference,
    customer: order.customer_id ?? "Customer",
    pickup,
    delivery,
    window,
    status: mapOrderStatus(order.status),
    ageHours,
    cost: Number(order.estimated_cost ?? 0) || 0,
    lane,
    serviceLevel: order.order_type ?? "Standard",
    commodity: "General", // Default as not in DB schema
    laneMiles: 0, // Default as not in DB schema
    revenue: 0, // Default as not in DB schema
    created: createdAt,
    pickupWindowStart: order.pickup_time ? new Date(order.pickup_time).toISOString() : undefined,
    pickupWindowEnd: undefined,
    deliveryWindowStart: order.dropoff_time ? new Date(order.dropoff_time).toISOString() : undefined,
    deliveryWindowEnd: undefined,
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
    return null;
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
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

