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
    // 1. Fetch from Orders Service
    let serviceOrders: any[] = [];
    try {
      const res = await fetch('http://localhost:4002/api/orders', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        serviceOrders = json.data || [];
      }
    } catch (e) {
      console.error("Failed to fetch from Orders Service:", e);
    }

    const client = await pool.connect();
    let financials: Record<string, number> = {};
    let localOrders: OrderResponse[] = [];

    try {
      // 2. Fetch financials from DB
      const finRes = await client.query('SELECT order_id, revenue FROM trip_costs');
      finRes.rows.forEach(row => {
        financials[row.order_id] = Number(row.revenue);
      });

      // 3. Fetch local orders (fallback/merge source)
      // Fetch ALL orders, do not filter by status
      const query = `
        SELECT * FROM orders 
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query);
      localOrders = result.rows.map(transformOrderFromDb);
    } finally {
      client.release();
    }

    // 4. Merge Data
    const orderMap = new Map<string, OrderResponse>();

    // Add local orders first
    localOrders.forEach(o => {
      // Add revenue if available
      o.revenue = financials[o.id] || o.revenue;
      orderMap.set(o.id, o);
    });

    // Merge/Overwrite with Service orders
    serviceOrders.forEach(o => {
      const existing = orderMap.get(o.id);
      
      const mapped: OrderResponse = {
        id: o.id,
        reference: o.reference || existing?.reference || o.id,
        customer: o.customer || existing?.customer || "Customer",
        pickup: o.pickup || existing?.pickup || "",
        delivery: o.delivery || existing?.delivery || "",
        window: o.window || existing?.window || "Not Scheduled",
        status: o.status || existing?.status || "New", // Service status is preferred
        ageHours: o.ageHours ?? existing?.ageHours ?? 0,
        cost: Number(o.cost ?? existing?.cost ?? 0),
        lane: o.lane || existing?.lane || "",
        serviceLevel: o.serviceLevel || existing?.serviceLevel || "Standard",
        commodity: o.commodity || existing?.commodity || "General",
        laneMiles: o.laneMiles ?? existing?.laneMiles ?? 0,
        revenue: financials[o.id] || existing?.revenue || 0,
        created: existing?.created || new Date().toISOString(),
        pickupWindowStart: existing?.pickupWindowStart,
        pickupWindowEnd: existing?.pickupWindowEnd,
        deliveryWindowStart: existing?.deliveryWindowStart,
        deliveryWindowEnd: existing?.deliveryWindowEnd,
      };
      orderMap.set(o.id, mapped);
    });

    const mergedOrders = Array.from(orderMap.values());
    
    return NextResponse.json(buildOrdersResponse(mergedOrders));

  } catch (error) {
    console.error("Error fetching orders:", error);
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


