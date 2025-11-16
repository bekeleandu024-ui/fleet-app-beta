import { NextResponse } from "next/server";

import { serviceFetch } from "@/lib/service-client";
import { buildLane, mapOrderStatus } from "@/lib/transformers";
import type { DispatchResponse, OrderStatus } from "@/lib/types";

export async function GET() {
  try {
    const [ordersPayload, driversPayload, unitsPayload] = await Promise.all([
      serviceFetch<{ orders?: Array<Record<string, any>> }>("dispatch", "/api/dispatch/qualified-orders"),
      serviceFetch<{ drivers?: Array<Record<string, any>> }>("masterData", "/api/metadata/drivers"),
      serviceFetch<{ units?: Array<Record<string, any>> }>("masterData", "/api/metadata/units"),
    ]);

    const qualifiedOrders = transformOrders(ordersPayload.orders ?? []);
    const drivers = transformDrivers(driversPayload.drivers ?? []);
    const units = transformUnits(unitsPayload.units ?? []);

    const response: DispatchResponse = {
      qualifiedOrders,
      recommendation: {
        title: "Recommended pairing",
        description: "Driver and equipment matched against guardrails and current compliance windows.",
        bullets: [
          "Driver meets hours of service requirements",
          "Unit location within 50 miles of pickup",
          "Guardrails validated for commodity",
        ],
      },
      filters: {
        lanes: Array.from(new Set(qualifiedOrders.map((order) => order.lane))).filter(Boolean),
        priorities: ["Critical", "High", "Standard"],
      },
      tripForm: {
        tripTypes: ["Full Truckload", "Partial", "Recovery"],
        rateUnits: ["Per Mile", "Flat", "Hourly"],
      },
      crew: {
        drivers,
        units,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching dispatch data", error);
    return NextResponse.json({ error: "Failed to load dispatch data" }, { status: 500 });
  }
}

function transformOrders(records: Array<Record<string, any>>) {
  return records.map((order) => {
    const pickupWindow = formatWindow(order.pickup_window_start ?? order.pickup_time);
    const deliveryWindow = formatWindow(order.delivery_window_start ?? order.delivery_time);

    return {
      id: String(order.id ?? order.order_id ?? ""),
      reference: String(order.reference ?? order.id ?? "").slice(0, 8).toUpperCase(),
      customer: order.customer_name ?? order.customer ?? "Customer",
      lane: buildLane(order.pickup_location, order.delivery_location ?? order.dropoff_location),
      pickupWindow,
      deliveryWindow,
      miles: Number(order.lane_miles ?? order.miles ?? 0) || 0,
      status: mapOrderStatus(order.status) as OrderStatus,
      priority: order.priority ?? "Standard",
    };
  });
}

function transformDrivers(records: Array<Record<string, any>>) {
  return records.map((driver) => ({
    id: String(driver.id ?? driver.driver_id ?? ""),
    name: driver.name ?? driver.driver_name ?? "Driver",
    status: driver.status ?? (driver.is_active === false ? "Off Duty" : "Ready"),
    hoursAvailable: Number(driver.hours_available ?? driver.hoursAvailable ?? 8),
  }));
}

function transformUnits(records: Array<Record<string, any>>) {
  return records.map((unit) => ({
    id: String(unit.id ?? unit.unit_id ?? unit.unit_number ?? ""),
    type: unit.unit_type ?? unit.type ?? unit.unit_number ?? "Equipment",
    status: unit.status ?? (unit.is_active === false ? "Maintenance" : "Available"),
    location: unit.location ?? unit.current_location ?? "Fleet Yard",
  }));
}

function formatWindow(value?: string | Date | null) {
  if (!value) {
    return "Scheduled";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Scheduled";
  }
  return date.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" });
}
