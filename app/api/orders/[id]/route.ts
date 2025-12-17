import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { serviceFetch, ServiceError } from "@/lib/service-client";
import { buildLane, mapOrderStatus } from "@/lib/transformers";
import { calculateTripCost, type Driver, type TripEvents } from "@/lib/cost-calculator";
import { isCrossBorder } from "@/lib/costing";
import pool from "@/lib/db";

type OrderStop = {
  id: string;
  type: "Pickup" | "Delivery" | "Drop";
  location: string;
  windowStart: string;
  windowEnd: string;
  instructions?: string;
};

const STATUS_OPTIONS = ["New", "Planning", "In Transit", "At Risk", "Delivered", "Exception", "Completed"];

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const order = await serviceFetch<Record<string, any>>("orders", `/api/orders/${id}`);

    const driversQuery = `
      SELECT d.driver_id as id, d.driver_name as name, d.driver_type, d.unit_number, u.truck_weekly_cost as "truckWk", d.region
      FROM driver_profiles d
      LEFT JOIN unit_profiles u ON d.unit_number = u.unit_number
    `;
    const unitsQuery = `SELECT unit_id as id, unit_number, truck_weekly_cost, region FROM unit_profiles`;

    const [driversResult, unitsResult, costResult, customerViewResult, tripsResult] = await Promise.allSettled([
      pool.query(driversQuery),
      pool.query(unitsQuery),
      serviceFetch<Record<string, any>>("orders", `/api/orders/${id}/cost-breakdown`),
      serviceFetch<Record<string, any>>("tracking", `/api/views/customer/${id}`),
      serviceFetch<Array<Record<string, any>>>("tracking", `/api/trips?orderId=${id}`),
    ]);

    const drivers = driversResult.status === "fulfilled" ? driversResult.value.rows : [];
    const units = unitsResult.status === "fulfilled" ? unitsResult.value.rows : [];
    const cost = costResult.status === "fulfilled" ? costResult.value : undefined;
    const customerView = customerViewResult.status === "fulfilled" ? customerViewResult.value : undefined;
    const trips = tripsResult.status === "fulfilled" ? tripsResult.value : [];

    const detail = buildOrderDetail(order, { drivers, units, cost, customerView, trips });

    return NextResponse.json(detail);
  } catch (error) {
    console.error(`Error fetching order detail for ${id}`, error);
    if (error instanceof ServiceError && error.status === 404) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    if (!STATUS_OPTIONS.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, id]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function buildOrderDetail(
  order: Record<string, any>,
  context: {
    drivers: Array<Record<string, any>>;
    units: Array<Record<string, any>>;
    cost?: Record<string, any>;
    customerView?: Record<string, any>;
    trips?: Array<Record<string, any>>;
  }
) {
  const stops = buildStops(order, context.customerView);
  const lane = buildLane(order.pickup_location, order.dropoff_location);
  const laneMiles = resolveLaneMiles(order, context.customerView);

  // Enrich order with calculated laneMiles for pricing
  const enrichedOrder = { ...order, lane_miles: laneMiles };

  return {
    id: order.id,
    reference: order.reference ?? order.id?.slice(0, 8)?.toUpperCase() ?? order.id,
    status: mapOrderStatus(order.status),
    customer: order.customer ?? order.customer_name ?? order.customer_id ?? "Customer",
    lane,
    laneMiles,
    ageHours: calculateAgeHours(order.created_at),
    serviceLevel: order.service_level ?? order.order_type ?? "Standard",
    snapshot: {
      commodity: order.commodity ?? order.order_type ?? "General Freight",
      stops,
      windows: buildWindows(stops),
      notes: order.special_instructions ?? extractCustomerNote(context.customerView),
    },
    pricing: buildPricing(context.cost, enrichedOrder),
    booking: buildBooking(order, context.drivers, context.units, context.trips ?? []),
  };
}

function buildStops(order: Record<string, any>, customerView?: Record<string, any>): OrderStop[] {
  const rawStops = selectStopSource(order, customerView);
  if (rawStops.length) {
    return rawStops.map((stop, index) => formatStop(stop, order, index));
  }

  const pickupTime = order.pickup_time ?? order.created_at ?? new Date().toISOString();
  const deliveryTime = order.delivery_time ?? addHours(pickupTime, 24);

  return [
    formatStop(
      {
        id: randomUUID(),
        type: "pickup",
        location: order.pickup_location,
        window_start: pickupTime,
        window_end: addHours(pickupTime, 4),
        instructions: order.pickup_instructions,
      },
      order,
      0
    ),
    formatStop(
      {
        id: randomUUID(),
        type: "delivery",
        location: order.dropoff_location,
        window_start: deliveryTime,
        window_end: addHours(deliveryTime, 4),
        instructions: order.delivery_instructions,
      },
      order,
      1
    ),
  ];
}

function selectStopSource(order: Record<string, any>, customerView?: Record<string, any>) {
  if (Array.isArray(customerView?.stops) && customerView.stops.length) {
    return customerView.stops;
  }
  if (Array.isArray(order.stops) && order.stops.length) {
    return order.stops;
  }
  return [];
}

function formatStop(stop: Record<string, any>, order: Record<string, any>, index: number): OrderStop {
  const type = normalizeStopType(stop.type ?? stop.stop_type, index);
  const fallbackLocation = type === "Pickup" ? order.pickup_location : order.dropoff_location;
  const location = stop.location ?? buildLocation(stop) ?? fallbackLocation ?? "TBD";
  const start = stop.windowStart ?? stop.window_start ?? stop.scheduled_start ?? (type === "Pickup" ? order.pickup_time : order.delivery_time);
  const end = stop.windowEnd ?? stop.window_end ?? stop.scheduled_end ?? addHours(start ?? order.pickup_time, 4);

  return {
    id: String(stop.id ?? stop.stop_id ?? randomUUID()),
    type,
    location,
    windowStart: toIso(start),
    windowEnd: toIso(end),
    instructions: stop.instructions ?? stop.notes ?? undefined,
  };
}

function normalizeStopType(value: unknown, index: number): OrderStop["type"] {
  const normalized = typeof value === "string" ? value.toLowerCase() : "";
  if (normalized.includes("pickup")) {
    return "Pickup";
  }
  if (normalized.includes("delivery") || normalized.includes("dropoff")) {
    return "Delivery";
  }
  if (normalized.includes("drop")) {
    return "Drop";
  }
  return index === 0 ? "Pickup" : "Delivery";
}

function buildLocation(stop: Record<string, any>) {
  const parts = [stop.city, stop.state, stop.country].filter(Boolean);
  if (parts.length) {
    return parts.join(", ");
  }
  if (Array.isArray(stop.coordinates)) {
    return stop.coordinates.filter(Boolean).join(", ");
  }
  return undefined;
}

function buildWindows(stops: OrderStop[]) {
  return stops.map((stop) => ({
    label: stop.type,
    value: `${formatWindow(stop.windowStart)} - ${formatWindow(stop.windowEnd)}`,
  }));
}

function extractCustomerNote(customerView?: Record<string, any>) {
  if (!customerView) {
    return undefined;
  }
  if (typeof customerView.notes === "string") {
    return customerView.notes;
  }
  if (Array.isArray(customerView.notes) && customerView.notes.length) {
    const first = customerView.notes[0];
    if (typeof first === "string") {
      return first;
    }
    if (first && typeof first.body === "string") {
      return first.body;
    }
  }
  return undefined;
}

function buildPricing(cost: Record<string, any> | undefined, order: Record<string, any>) {
  // Get lane miles for calculation
  const laneMiles = order.lane_miles ?? order.planned_miles ?? order.distance_miles ?? 0;
  
  // Calculate costs based on industry-standard rates if not provided
  let linehaul = toNumber(cost?.linehaul_cost ?? cost?.linehaul);
  let fuel = toNumber(cost?.fuel_cost ?? cost?.fuel);
  let accessorials = toNumber(cost?.accessorial_cost ?? cost?.accessorials);
  let totalCost = toNumber(cost?.total_cost ?? order.estimated_cost ?? order.cost);
  let revenue = toNumber(cost?.revenue ?? order.revenue);
  
  // If no pricing data exists, calculate based on lane miles and industry rates
  if (!totalCost && laneMiles > 0) {
    // Use new cost calculator with default 'COM' driver
    const defaultDriver: Driver = {
      id: 'estimation',
      name: 'Estimation',
      type: 'COM',
      truckWk: 0 // Default
    };

    const durationDays = laneMiles / 50 / 24; // Estimate 50mph avg
    
    const events: TripEvents = {
      border: isCrossBorder(order.pickup_location, order.dropoff_location) ? 1 : 0,
      picks: 1,
      drops: 1
    };

    const calculated = calculateTripCost(defaultDriver, laneMiles, durationDays, events);
    
    linehaul = calculated.breakdown.fixed + calculated.breakdown.labor + calculated.breakdown.maintenance + calculated.breakdown.events;
    fuel = calculated.breakdown.fuel;
    accessorials = 0;
    totalCost = calculated.totalCost;
    
    // Revenue with margin
    revenue = revenue || Math.round(totalCost * 1.2); // 20% margin default
  }
  
  // Ensure we have values even if no miles (use minimum estimates)
  if (!linehaul && !totalCost) {
    linehaul = 500; // Minimum linehaul
    fuel = 90; // Minimum fuel
    accessorials = 0;
    totalCost = linehaul + fuel + accessorials;
    revenue = Math.round(totalCost / 0.82);
  }
  
  // Calculate margin
  const targetMargin = cost?.margin_analysis?.target_margin ?? 
    (revenue && totalCost ? (revenue - totalCost) / revenue : 0.05);

  return {
    items: [
      { label: "Linehaul", value: formatCurrency(linehaul), helper: "Base transportation cost" },
      { label: "Fuel Surcharge", value: formatCurrency(fuel), helper: "Variable fuel cost" },
      { label: "Accessorials", value: formatCurrency(accessorials), helper: "Additional services" },
      { label: "Target Margin", value: `${Math.round(Math.max(targetMargin, 0) * 100)}%`, helper: "Operating target" },
    ],
    totals: {
      label: "Cost Basis",
      value: formatCurrency(totalCost),
      helper: `Revenue ${formatCurrency(revenue)}`,
    },
  };
}

function buildBooking(
  order: Record<string, any>,
  drivers: Array<Record<string, any>>,
  units: Array<Record<string, any>>,
  trips: Array<Record<string, any>>
) {
  const driverOptions = drivers.slice(0, 5).map((driver) => ({
    id: driver.driver_id ?? driver.id ?? randomUUID(),
    name: driver.driver_name ?? driver.name ?? "Driver",
    status: driver.is_active === false ? "Off Duty" : driver.status ?? "Ready",
    region: driver.region,
    hoursAvailable: Number.isFinite(driver.hours_available) ? Number(driver.hours_available) : 8,
  }));

  const unitOptions = units.slice(0, 5).map((unit) => ({
    id: unit.unit_id ?? unit.id ?? randomUUID(),
    type: unit.unit_number ?? unit.unit_type ?? unit.type ?? "Unit",
    status: unit.is_active === false ? "Maintenance" : unit.status ?? "Available",
    region: unit.region,
    location: unit.location ?? unit.current_location ?? "Fleet Yard",
  }));

  const primaryTrip = trips[0];
  const recommendedDriver = order.driver_id ?? primaryTrip?.driver_id ?? driverOptions[0]?.id;
  const recommendedUnit = order.unit_id ?? primaryTrip?.unit_id ?? unitOptions[0]?.id;

  return {
    recommendedDriverId: recommendedDriver,
    recommendedUnitId: recommendedUnit,
    driverOptions,
    unitOptions,
    statusOptions: STATUS_OPTIONS,
  };
}

function resolveLaneMiles(order: Record<string, any>, customerView?: Record<string, any>) {
  let miles =
    order.lane_miles ??
    order.planned_miles ??
    customerView?.metrics?.planned_miles ??
    customerView?.distance_miles;
  
  // If no miles data, estimate based on city pairs
  if (!miles || miles === 0) {
    miles = estimateDistanceFromLocations(order.pickup_location, order.dropoff_location);
  }
  
  return Number.isFinite(Number(miles)) ? Number(miles) : 0;
}

function estimateDistanceFromLocations(pickup?: string, dropoff?: string): number {
  if (!pickup || !dropoff) return 200; // Default minimum
  
  // Common city pair estimates (in miles)
  const cityDistances: Record<string, Record<string, number>> = {
    'Hamilton': { 'Columbus': 380, 'Cleveland': 180, 'Buffalo': 50, 'Toronto': 40 },
    'London': { 'Columbus': 350, 'Cleveland': 200, 'Buffalo': 120, 'Toronto': 120 },
    'Guelph': { 'Columbus': 400, 'Cleveland': 210, 'Buffalo': 80, 'Toronto': 60 },
    'Toronto': { 'Columbus': 420, 'Cleveland': 230, 'Buffalo': 100, 'Hamilton': 40 },
    'Columbus': { 'Hamilton': 380, 'London': 350, 'Toronto': 420, 'Cleveland': 140 },
    'Cleveland': { 'Hamilton': 180, 'London': 200, 'Toronto': 230, 'Buffalo': 190 },
    'Buffalo': { 'Hamilton': 50, 'Toronto': 100, 'Cleveland': 190, 'London': 120 },
  };
  
  // Extract city names
  const pickupCity = extractCityName(pickup);
  const dropoffCity = extractCityName(dropoff);
  
  if (pickupCity && dropoffCity && cityDistances[pickupCity]?.[dropoffCity]) {
    return cityDistances[pickupCity][dropoffCity];
  }
  
  // Default estimate for unknown routes
  return 250;
}

function extractCityName(location: string): string | null {
  if (!location) return null;
  
  const cities = ['Hamilton', 'London', 'Guelph', 'Toronto', 'Columbus', 'Cleveland', 'Buffalo'];
  for (const city of cities) {
    if (location.includes(city)) {
      return city;
    }
  }
  return null;
}

function extractRecords(result: PromiseSettledResult<any>, key: string) {
  if (!result || result.status !== "fulfilled" || !result.value) {
    return [];
  }
  const payload = result.value as Record<string, any>;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload[key])) {
    return payload[key];
  }
  return [];
}

function calculateAgeHours(dateValue?: string | Date) {
  if (!dateValue) {
    return 0;
  }
  const timestamp = new Date(dateValue);
  if (Number.isNaN(timestamp.getTime())) {
    return 0;
  }
  const diff = Date.now() - timestamp.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
}

function toIso(value?: string | Date) {
  if (!value) {
    return new Date().toISOString();
  }
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function formatWindow(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return "$0";
  }
  return `$${value.toFixed(2)}`;
}

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function addHours(value: string | Date | undefined, hours: number) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  }
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}
