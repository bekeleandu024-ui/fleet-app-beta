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
        SELECT 
          id, order_number, customer_id, pickup_location, dropoff_location,
          pickup_time, dropoff_time, status, dispatch_status, created_at,
          estimated_cost, order_type, equipment_type, 
          COALESCE(weight_lbs, total_weight_lbs, total_weight) as weight,
          quoted_rate
        FROM orders 
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query);
      localOrders = result.rows.map(transformOrderFromDb);
    } finally {
      client.release();
    }

    // 4. Merge Data
    const orderMap = new Map<string, OrderResponse>();
    const orderNumberMap = new Map<string, OrderResponse>();

    // Add local orders first
    localOrders.forEach(o => {
      // Add revenue if available
      o.revenue = financials[o.id] || o.revenue;
      orderMap.set(o.id, o);
      if (o.orderNumber) orderNumberMap.set(o.orderNumber, o);
      if (o.reference) orderNumberMap.set(o.reference, o);
    });

    // Merge/Overwrite with Service orders
    serviceOrders.forEach(o => {
      let existing = orderMap.get(o.id);
      
      if (!existing) {
        // Try to find by friendly ID (orderNumber or reference)
        existing = orderNumberMap.get(o.id) || orderNumberMap.get(o.reference);
      }

      // Skip service orders that don't exist in local database
      // This prevents 404 errors when clicking on orders that the service knows about
      // but aren't in our local database yet
      if (!existing) {
        console.warn(`[Orders List] Skipping service order not in local DB: ${o.id}`);
        return;
      }

      // UUID RESOLUTION: Use the local database ID (could be UUID or friendly ID)
      // 1. If local DB has friendly ID, keep it
      // 2. If local DB has UUID, keep it
      // 3. Always prefer what's actually in the database over service IDs
      let id = existing.id; // Use the ID from local database
      
      const mapped: OrderResponse = {
        id, // Always use the local database ID
        reference: o.reference || existing?.reference || o.id,
        customer: o.customer || existing?.customer || "Customer",
        pickup: o.pickup || existing?.pickup || "",
        delivery: o.delivery || existing?.delivery || "",
        window: o.window || existing?.window || "Not Scheduled",
        status: existing?.status || o.status || "New", // Local status is preferred
        ageHours: o.ageHours ?? existing?.ageHours ?? 0,
        cost: Number(o.cost ?? existing?.cost ?? 0),
        lane: o.lane || existing?.lane || "",
        serviceLevel: o.serviceLevel || existing?.serviceLevel || "Standard",
        commodity: o.commodity || existing?.commodity || "General",
        laneMiles: o.laneMiles ?? existing?.laneMiles ?? 0,
        revenue: financials[id] || existing?.revenue || 0,
        created: existing?.created || new Date().toISOString(),
        pickupWindowStart: existing?.pickupWindowStart,
        pickupWindowEnd: existing?.pickupWindowEnd,
        deliveryWindowStart: existing?.deliveryWindowStart,
        deliveryWindowEnd: existing?.deliveryWindowEnd,
        equipmentType: existing?.equipmentType || "Dry Van",
        weight: existing?.weight || 0,
        pickupDate: existing?.pickupDate,
        rate: existing?.rate || 0,
      };
      orderMap.set(id, mapped);
    });

    // UUID FILTERING: After migration, all orders should have UUID primary keys
    const allOrders = Array.from(orderMap.values());
    const ordersWithUUIDs = allOrders.filter(o => o.id && o.id.length === 36);
    const invalidOrders = allOrders.filter(o => !o.id || o.id.length !== 36);
    
    if (invalidOrders.length > 0) {
      console.error(
        `[Orders List] Found ${invalidOrders.length} orders without valid UUIDs:`,
        invalidOrders.map(o => ({ id: o.id, reference: o.reference })).slice(0, 5)
      );
    }
    
    // Only include orders with valid UUIDs
    const mergedOrders = ordersWithUUIDs;
    
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
  const reference = order.order_number || (id ? `ORD-${id.slice(0, 8).toUpperCase()}` : "ORDER");
  const createdAt = order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString();
  const ageHours = calculateAgeHours(createdAt);
  
  const pickupDateTime = order.pickup_time;
  const window = resolveWindow(pickupDateTime) ?? "Not Scheduled";
  const lane = buildLane(pickup, delivery);

  // Use dispatch_status if available, otherwise fall back to status
  const effectiveStatus = order.dispatch_status || order.status;

  return {
    id,
    orderNumber: order.order_number,
    reference,
    customer: order.customer_id ?? "Customer",
    pickup,
    delivery,
    window,
    status: mapOrderStatus(effectiveStatus),
    ageHours,
    cost: Number(order.estimated_cost ?? 0) || 0,
    lane,
    serviceLevel: order.order_type ?? "Standard",
    commodity: "General", // Default as not in DB schema
    laneMiles: 0, // Not tracked in orders table directly
    revenue: 0, // Default as not in DB schema
    created: createdAt,
    pickupWindowStart: order.pickup_time ? new Date(order.pickup_time).toISOString() : undefined,
    pickupWindowEnd: undefined,
    deliveryWindowStart: order.dropoff_time ? new Date(order.dropoff_time).toISOString() : undefined,
    deliveryWindowEnd: undefined,
    equipmentType: order.equipment_type ?? "Dry Van",
    weight: Number(order.weight) || 0,
    pickupDate: order.pickup_time ? new Date(order.pickup_time).toLocaleDateString() : undefined,
    rate: Number(order.quoted_rate ?? order.estimated_cost ?? 0) || 0,
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


