import { NextRequest, NextResponse } from "next/server";

import { serviceFetch } from "@/lib/service-client";
import { mapOrderListRecord, mapTripListItem } from "@/lib/transformers";
import type { GlobalSearchResult } from "@/lib/types";

const MAX_RESULTS_PER_TYPE = 5;

function matches(normalizedQuery: string, values: string[]): boolean {
  return values.some((value) => value.toLowerCase().includes(normalizedQuery));
}

async function buildOrderResults(normalizedQuery: string): Promise<GlobalSearchResult[]> {
  try {
    const records = await serviceFetch<Array<Record<string, any>>>("orders", "/api/orders");
    const orders = records.map(mapOrderListRecord);
    return orders
      .filter((order) =>
        matches(normalizedQuery, [order.id, order.reference, order.customer, order.lane, order.pickup, order.delivery])
      )
      .slice(0, MAX_RESULTS_PER_TYPE)
      .map((order) => ({
        id: order.id,
        type: "order",
        title: `Order ${order.reference}`,
        description: `${order.pickup} → ${order.delivery}`,
        href: `/orders/${order.id}`,
        meta: [
          { label: "Customer", value: order.customer },
          { label: "Status", value: order.status },
        ],
      }));
  } catch (error) {
    console.error("Search orders fetch failed", error);
    return [];
  }
}

async function buildTripResults(normalizedQuery: string): Promise<GlobalSearchResult[]> {
  try {
    const payload = await serviceFetch<{ value?: Array<Record<string, any>> }>("tracking", "/api/trips");
    const trips = (payload.value ?? []).map((trip) => mapTripListItem({ ...trip, tripNumber: String(trip.id ?? "").slice(0, 8) }));
    return trips
      .filter((trip) =>
        matches(normalizedQuery, [trip.tripNumber, trip.id, trip.driver, trip.unit, trip.orderId ?? "", trip.status])
      )
      .slice(0, MAX_RESULTS_PER_TYPE)
      .map((trip) => ({
        id: trip.id,
        type: "trip",
        title: `Trip ${trip.tripNumber}`,
        description: `${trip.pickup} → ${trip.delivery}`,
        href: `/trips/${trip.id}`,
        meta: [
          { label: "Driver", value: trip.driver },
          { label: "Unit", value: trip.unit },
          { label: "Status", value: trip.status },
        ],
      }));
  } catch (error) {
    console.error("Search trips fetch failed", error);
    return [];
  }
}

async function buildDriverResults(normalizedQuery: string): Promise<GlobalSearchResult[]> {
  try {
    const payload = await serviceFetch<{ drivers?: Array<Record<string, any>> }>("masterData", "/api/metadata/drivers");
    const drivers = payload.drivers ?? [];
    return drivers
      .filter((driver) => matches(normalizedQuery, [String(driver.id ?? driver.driver_id ?? ""), driver.name ?? driver.driver_name ?? "", driver.region ?? "", driver.status ?? ""]))
      .slice(0, MAX_RESULTS_PER_TYPE)
      .map((driver) => ({
        id: String(driver.id ?? driver.driver_id ?? ""),
        type: "driver",
        title: driver.driver_name ?? driver.name ?? "Driver",
        description: `${driver.region ?? "Unknown"} • ${driver.status ?? "Ready"}`,
        href: "/master-data/drivers",
        meta: [
          { label: "Driver ID", value: String(driver.id ?? driver.driver_id ?? "") },
          { label: "Hours Available", value: `${driver.hours_available ?? driver.hoursAvailable ?? 0}h` },
        ],
      }));
  } catch (error) {
    console.error("Search drivers fetch failed", error);
    return [];
  }
}

async function buildUnitResults(normalizedQuery: string): Promise<GlobalSearchResult[]> {
  try {
    const payload = await serviceFetch<{ units?: Array<Record<string, any>> }>("masterData", "/api/metadata/units");
    const units = payload.units ?? [];
    return units
      .filter((unit) => matches(normalizedQuery, [String(unit.id ?? unit.unit_id ?? unit.unit_number ?? ""), unit.unit_type ?? unit.type ?? "", unit.location ?? unit.current_location ?? "", unit.region ?? "", unit.status ?? ""]))
      .slice(0, MAX_RESULTS_PER_TYPE)
      .map((unit) => ({
        id: String(unit.id ?? unit.unit_id ?? unit.unit_number ?? ""),
        type: "unit",
        title: unit.unit_number ?? unit.id ?? "Unit",
        description: unit.unit_type ?? unit.type ?? "Equipment",
        href: "/master-data/units",
        meta: [
          { label: "Status", value: unit.status ?? "Available" },
          { label: "Location", value: unit.location ?? unit.current_location ?? "" },
        ],
      }));
  } catch (error) {
    console.error("Search units fetch failed", error);
    return [];
  }
}

async function buildCustomerResults(normalizedQuery: string): Promise<GlobalSearchResult[]> {
  // Customer search relies on orders until a dedicated customer service is available.
  try {
    const records = await serviceFetch<Array<Record<string, any>>>("orders", "/api/orders");
    const customers = Array.from(
      new Map(
        records.map((record) => {
          const id = String(record.customer_id ?? record.customer ?? record.customer_name ?? "");
          return [id, {
            id,
            name: record.customer_name ?? record.customer ?? id,
            primaryLane: `${record.pickup_location ?? ""} → ${record.delivery_location ?? record.dropoff_location ?? ""}`,
            status: record.status ?? "Active",
            primaryContact: record.primary_contact ?? "Dispatch",
          }];
        })
      ).values()
    );

    return customers
      .filter((customer) =>
        matches(normalizedQuery, [customer.id, customer.name, customer.primaryContact, customer.primaryLane])
      )
      .slice(0, MAX_RESULTS_PER_TYPE)
      .map((customer) => ({
        id: customer.id,
        type: "customer",
        title: customer.name,
        description: customer.primaryLane,
        href: "/admin",
        meta: [
          { label: "Customer ID", value: customer.id },
          { label: "Status", value: customer.status },
          { label: "Primary Contact", value: customer.primaryContact },
        ],
      }));
  } catch (error) {
    console.error("Search customers fetch failed", error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();

  if (!query) {
    return NextResponse.json({ query: "", results: [] });
  }

  const normalizedQuery = query.toLowerCase();
  const [orderResults, tripResults, driverResults, unitResults, customerResults] = await Promise.all([
    buildOrderResults(normalizedQuery),
    buildTripResults(normalizedQuery),
    buildDriverResults(normalizedQuery),
    buildUnitResults(normalizedQuery),
    buildCustomerResults(normalizedQuery),
  ]);

  const results: GlobalSearchResult[] = [
    ...orderResults,
    ...tripResults,
    ...driverResults,
    ...unitResults,
    ...customerResults,
  ];

  return NextResponse.json({
    query,
    results,
  });
}
