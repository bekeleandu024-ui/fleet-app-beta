import { NextRequest, NextResponse } from "next/server";

import {
  listCustomers,
  listDrivers,
  listOrders,
  listTrips,
  listUnits,
} from "@/lib/mock-data-store";
import type { GlobalSearchResult } from "@/lib/types";

const MAX_RESULTS_PER_TYPE = 5;

function matches(normalizedQuery: string, values: string[]): boolean {
  return values.some((value) => value.toLowerCase().includes(normalizedQuery));
}

function buildOrderResults(normalizedQuery: string): GlobalSearchResult[] {
  return listOrders()
    .filter((order) =>
      matches(normalizedQuery, [order.id, order.reference, order.customer, order.lane, order.pickup, order.delivery])
    )
    .slice(0, MAX_RESULTS_PER_TYPE)
    .map((order) => ({
      id: order.id,
      type: "order",
      title: `Order ${order.id}`,
      description: `${order.pickup} → ${order.delivery}`,
      href: `/orders/${order.id}`,
      meta: [
        { label: "Customer", value: order.customer },
        { label: "Status", value: order.status },
      ],
    }));
}

function buildTripResults(normalizedQuery: string): GlobalSearchResult[] {
  return listTrips()
    .filter((trip) =>
      matches(normalizedQuery, [trip.tripNumber, trip.id, trip.driver, trip.unit, trip.orderId, trip.status])
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
}

function buildDriverResults(normalizedQuery: string): GlobalSearchResult[] {
  return listDrivers()
    .filter((driver) => matches(normalizedQuery, [driver.id, driver.name, driver.region, driver.status]))
    .slice(0, MAX_RESULTS_PER_TYPE)
    .map((driver) => ({
      id: driver.id,
      type: "driver",
      title: driver.name,
      description: `${driver.region} • ${driver.status}`,
      href: "/master-data/drivers",
      meta: [
        { label: "Driver ID", value: driver.id },
        { label: "Hours Available", value: `${driver.hoursAvailable}h` },
      ],
    }));
}

function buildUnitResults(normalizedQuery: string): GlobalSearchResult[] {
  return listUnits()
    .filter((unit) => matches(normalizedQuery, [unit.id, unit.type, unit.location, unit.region, unit.status]))
    .slice(0, MAX_RESULTS_PER_TYPE)
    .map((unit) => ({
      id: unit.id,
      type: "unit",
      title: unit.id,
      description: unit.type,
      href: "/master-data/units",
      meta: [
        { label: "Status", value: unit.status },
        { label: "Location", value: unit.location },
      ],
    }));
}

function buildCustomerResults(normalizedQuery: string): GlobalSearchResult[] {
  return listCustomers()
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
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();

  if (!query) {
    return NextResponse.json({ query: "", results: [] });
  }

  const normalizedQuery = query.toLowerCase();
  const results: GlobalSearchResult[] = [
    ...buildOrderResults(normalizedQuery),
    ...buildTripResults(normalizedQuery),
    ...buildDriverResults(normalizedQuery),
    ...buildUnitResults(normalizedQuery),
    ...buildCustomerResults(normalizedQuery),
  ];

  return NextResponse.json({
    query,
    results,
  });
}
