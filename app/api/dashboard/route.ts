import { NextResponse } from "next/server";

import { serviceFetch, serviceUrls } from "@/lib/service-client";
import { buildLane, mapOrderStatus } from "@/lib/transformers";

type HealthStatus = "ok" | "warn" | "alert";

export async function GET() {
  try {
    const [ordersResponse, tripsPayload, driversPayload, unitsPayload, serviceHealth] = await Promise.all([
      serviceFetch<{ data?: Array<Record<string, any>> } | Array<Record<string, any>>>("orders", "/api/orders"),
      serviceFetch<{ value?: Array<Record<string, any>> }>("tracking", "/api/trips"),
      serviceFetch<{ drivers?: Array<Record<string, any>> }>("masterData", "/api/metadata/drivers"),
      serviceFetch<{ units?: Array<Record<string, any>> }>("masterData", "/api/metadata/units"),
      fetchServiceHealth(),
    ]);

    // Handle both structured response (from real service) and array response (from demo data)
    const orders = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse.data || []);

    const normalizedOrders = orders.map((order) => ({
      status: mapOrderStatus(order.status),
      lane: buildLane(order.pickup_location, order.delivery_location ?? order.dropoff_location),
      customer: order.customer_name ?? order.customer ?? "Customer",
    }));

    const trips = tripsPayload.value ?? [];
    const onTimeStats = calculateOnTime(trips);

    const metrics = {
      activeOrders: normalizedOrders.filter((order) => ["Planning", "In Transit"].includes(order.status)).length,
      inTransit: normalizedOrders.filter((order) => order.status === "In Transit").length,
      onTimePercent: onTimeStats,
      exceptions: normalizedOrders.filter((order) => ["Exception", "At Risk"].includes(order.status)).length,
    };

    const topLanes = buildTopLanes(normalizedOrders, trips);
    const drivers = driversPayload.drivers ?? [];
    const units = unitsPayload.units ?? [];

    return NextResponse.json({
      metrics,
      serviceHealth,
      liveNetwork: {
        filterOptions: {
          dateRanges: ["Today", "Next 24 Hours", "Next 72 Hours"],
          customers: ["All", ...Array.from(new Set(normalizedOrders.map((order) => order.customer))).filter(Boolean)],
          lanes: ["All", ...Array.from(new Set(normalizedOrders.map((order) => order.lane))).filter(Boolean)],
        },
        mapSummary: {
          hotspots: Math.max(0, metrics.exceptions),
          dwellAlerts: Math.max(0, metrics.activeOrders - metrics.inTransit),
        },
      },
      glance: {
        topLanes,
        drivers: {
          available: drivers.filter((driver) => String(driver.status ?? "").toLowerCase().includes("ready")).length,
          booked: drivers.filter((driver) => String(driver.status ?? "").toLowerCase().includes("book"))
            .length,
        },
        units: {
          available: units.filter((unit) => String(unit.status ?? "").toLowerCase().includes("available")).length,
          down: units.filter((unit) => String(unit.status ?? "").toLowerCase().match(/maint|out/)).length,
        },
      },
    });
  } catch (error) {
    console.error("Error building dashboard", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}

async function fetchServiceHealth() {
  const services: Array<[string, string]> = [
    ["Orders", serviceUrls.ORDERS_SERVICE],
    ["Master Data", serviceUrls.MASTER_DATA_SERVICE],
    ["Dispatch", serviceUrls.DISPATCH_SERVICE],
    ["Tracking", serviceUrls.TRACKING_SERVICE],
  ];

  const results = await Promise.all(
    services.map(async ([name, baseUrl]) => {
      try {
        const response = await fetch(`${baseUrl}/health`, { cache: "no-store" });
        if (!response.ok) {
          return { name, status: "warn" as HealthStatus, message: `Status ${response.status}` };
        }
        const payload = (await response.json().catch(() => ({}))) as Record<string, any>;
        const status = normalizeHealth(payload.status ?? payload.state ?? "ok");
        const message = payload.message ?? payload.detail ?? "Healthy";
        return { name, status, message };
      } catch (error) {
        console.error(`Health check failed for ${name}`, error);
        return { name, status: "alert" as HealthStatus, message: "Unavailable" };
      }
    })
  );

  return results;
}

function normalizeHealth(status: string): HealthStatus {
  const normalized = status.toLowerCase();
  if (normalized.includes("warn")) return "warn";
  if (normalized.includes("alert") || normalized.includes("fail")) return "alert";
  return "ok";
}

function calculateOnTime(trips: Array<Record<string, any>>) {
  const tripsWithMetrics = trips.filter((trip) => trip.on_time_delivery !== undefined || trip.status !== undefined);
  if (!tripsWithMetrics.length) {
    return 100;
  }
  const onTimeCount = tripsWithMetrics.filter((trip) => {
    if (typeof trip.on_time_delivery === "boolean") {
      return trip.on_time_delivery;
    }
    const status = String(trip.status ?? "").toLowerCase();
    return !status.includes("delay") && !status.includes("exception");
  }).length;
  return Math.round((onTimeCount / tripsWithMetrics.length) * 100);
}

function buildTopLanes(
  orders: Array<{ lane: string; status: ReturnType<typeof mapOrderStatus> }>,
  trips: Array<Record<string, any>>
) {
  const laneStats: Record<
    string,
    {
      orders: number;
      onTimeTrips: number;
      totalTrips: number;
    }
  > = {};

  orders.forEach((order) => {
    if (!order.lane) return;
    if (!laneStats[order.lane]) {
      laneStats[order.lane] = { orders: 0, onTimeTrips: 0, totalTrips: 0 };
    }
    laneStats[order.lane].orders += 1;
  });

  trips.forEach((trip) => {
    const lane = buildLane(trip.pickup_location, trip.dropoff_location ?? trip.delivery_location);
    if (!lane) return;
    if (!laneStats[lane]) {
      laneStats[lane] = { orders: 0, onTimeTrips: 0, totalTrips: 0 };
    }
    laneStats[lane].totalTrips += 1;
    const status = String(trip.status ?? "").toLowerCase();
    const onTime = trip.on_time_delivery === true || (!status.includes("delay") && !status.includes("exception"));
    laneStats[lane].onTimeTrips += onTime ? 1 : 0;
  });

  return Object.entries(laneStats)
    .sort(([, a], [, b]) => b.orders - a.orders)
    .slice(0, 3)
    .map(([lane, stats]) => ({
      lane,
      orders: stats.orders,
      onTimePercent: stats.totalTrips ? Math.round((stats.onTimeTrips / stats.totalTrips) * 100) : 100,
    }));
}

