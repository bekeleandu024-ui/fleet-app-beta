import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { serviceFetch, ServiceError } from "@/lib/service-client";
import { mapTripListItem } from "@/lib/transformers";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const { id } = params;

  try {
    const trip = await serviceFetch<Record<string, any>>("tracking", `/api/trips/${id}`);

    const [orderResult, driversResult, eventsResult, exceptionsResult] = await Promise.allSettled([
      trip.order_id
        ? serviceFetch<Record<string, any>>("orders", `/api/orders/${trip.order_id}`)
        : Promise.resolve(undefined),
      serviceFetch<{ drivers?: Array<Record<string, any>> }>("masterData", "/api/metadata/drivers"),
      serviceFetch<Array<Record<string, any>>>("tracking", `/api/trips/${id}/events`),
      serviceFetch<Array<Record<string, any>>>("tracking", `/api/trips/${id}/exceptions`),
    ]);

    const order = orderResult.status === "fulfilled" ? orderResult.value : undefined;
    const drivers = driversResult.status === "fulfilled" ? driversResult.value.drivers ?? [] : [];
    const events = eventsResult.status === "fulfilled" ? eventsResult.value ?? [] : [];
    const exceptions = exceptionsResult.status === "fulfilled" ? exceptionsResult.value ?? [] : [];

    const detail = buildTripDetail(trip, { order, driverRecords: drivers, events, exceptions });

    return NextResponse.json(detail);
  } catch (error) {
    console.error(`Error fetching trip detail for ${id}`, error);
    if (error instanceof ServiceError && error.status === 404) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to load trip" }, { status: 500 });
  }
}

function buildTripDetail(
  trip: Record<string, any>,
  context: {
    order?: Record<string, any>;
    driverRecords: Array<Record<string, any>>;
    events: Array<Record<string, any>>;
    exceptions: Array<Record<string, any>>;
  }
) {
  const driver = context.driverRecords.find((record) => String(record.id ?? record.driver_id) === String(trip.driver_id));
  const driverName = driver?.driver_name ?? driver?.name ?? trip.driver_id ?? "Unassigned";
  const unitNumber = trip.unit_id ?? trip.unit ?? "Pending";

  const listItem = mapTripListItem(
    {
      ...trip,
      tripNumber: String(trip.id ?? "").slice(0, 8).toUpperCase(),
      last_ping: trip.updated_at ?? trip.actual_start,
    },
    driverName,
    unitNumber
  );

  const timeline = context.events.map((event) => ({
    id: String(event.id ?? event.event_id ?? randomUUID()),
    timestamp: toIso(event.timestamp ?? event.created_at ?? event.occurred_at),
    summary: event.summary ?? event.event_type ?? event.type ?? "Event",
    location: event.location ?? event.city ?? event.state ?? "",
    status: event.status ?? "Recorded",
  }));

  const exceptionItems = context.exceptions.map((exception) => ({
    id: String(exception.id ?? exception.exception_id ?? randomUUID()),
    type: exception.type ?? exception.category ?? "Exception",
    severity: (exception.severity ?? "info") as "info" | "warn" | "alert",
    opened: toIso(exception.opened ?? exception.created_at ?? new Date().toISOString()),
    owner: exception.owner ?? "Network Ops",
    notes: exception.notes ?? exception.description ?? "",
  }));

  return {
    id: trip.id,
    tripNumber: listItem.tripNumber,
    status: listItem.status,
    driver: listItem.driver,
    unit: listItem.unit,
    eta: listItem.eta,
    timeline,
    exceptions: exceptionItems,
    telemetry: {
      lastPing: listItem.lastPing,
      breadcrumb: Array.isArray(trip.telemetry)
        ? trip.telemetry.map((point: any, index: number) => ({
            id: String(point.id ?? index),
            timestamp: toIso(point.timestamp ?? point.recorded_at ?? listItem.lastPing),
            speed: Number(point.speed ?? 0),
            location: point.location ?? "",
          }))
        : [],
    },
    notes: buildNotes(context.order),
    attachments: [],
  };
}

function buildNotes(order?: Record<string, any>) {
  if (!order?.notes && !order?.special_instructions) {
    return [];
  }
  const noteBody = order.notes ?? order.special_instructions;
  return [
    {
      id: randomUUID(),
      author: order.customer ?? order.customer_name ?? "Customer",
      timestamp: toIso(order.updated_at ?? new Date().toISOString()),
      body: String(noteBody),
    },
  ];
}

function toIso(value?: string | Date | null) {
  if (!value) return new Date().toISOString();
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}
