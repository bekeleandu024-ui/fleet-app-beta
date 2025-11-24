import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { serviceFetch, ServiceError } from "@/lib/service-client";
import { mapTripListItem } from "@/lib/transformers";

// Helper function to calculate distance if missing
async function calculateTripDistance(tripId: string, pickupLat?: number, pickupLng?: number, dropoffLat?: number, dropoffLng?: number) {
  try {
    // If we have coordinates, calculate distance
    if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/distance/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: pickupLat, lng: pickupLng },
          destination: { lat: dropoffLat, lng: dropoffLng }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update the trip record with the calculated distance
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/distance/trip/${tripId}`, {
          method: 'POST'
        }).catch(err => console.warn('Failed to update trip distance:', err));
        
        return {
          distance_miles: parseFloat(data.distanceMiles),
          duration_hours: parseFloat(data.durationHours)
        };
      }
    }
  } catch (error) {
    console.warn('Distance calculation failed:', error);
  }
  return null;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const trip = await serviceFetch<Record<string, any>>("tracking", `/api/trips/${id}`);

    // Calculate distance if missing
    if (!trip.distance_miles && trip.pickup_lat && trip.pickup_lng && trip.dropoff_lat && trip.dropoff_lng) {
      const calculated = await calculateTripDistance(
        id,
        trip.pickup_lat,
        trip.pickup_lng,
        trip.dropoff_lat,
        trip.dropoff_lng
      );
      if (calculated) {
        trip.distance_miles = calculated.distance_miles;
        trip.duration_hours = calculated.duration_hours;
      }
    }

    const [orderResult, driversResult, unitsResult, eventsResult, exceptionsResult] = await Promise.allSettled([
      trip.order_id
        ? serviceFetch<Record<string, any>>("orders", `/api/orders/${trip.order_id}`)
        : Promise.resolve(undefined),
      serviceFetch<{ drivers?: Array<Record<string, any>> }>("masterData", "/api/metadata/drivers"),
      serviceFetch<{ units?: Array<Record<string, any>> }>("masterData", "/api/metadata/units"),
      serviceFetch<Array<Record<string, any>>>("tracking", `/api/trips/${id}/events`),
      serviceFetch<Array<Record<string, any>>>("tracking", `/api/trips/${id}/exceptions`),
    ]);

    const order = orderResult.status === "fulfilled" ? orderResult.value : undefined;
    const drivers = driversResult.status === "fulfilled" ? driversResult.value.drivers ?? [] : [];
    const units = unitsResult.status === "fulfilled" ? unitsResult.value.units ?? [] : [];
    const events = eventsResult.status === "fulfilled" ? eventsResult.value ?? [] : [];
    const exceptions = exceptionsResult.status === "fulfilled" ? exceptionsResult.value ?? [] : [];

    const detail = buildTripDetail(trip, { order, driverRecords: drivers, unitRecords: units, events, exceptions });

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
    unitRecords: Array<Record<string, any>>;
    events: Array<Record<string, any>>;
    exceptions: Array<Record<string, any>>;
  }
) {
  const driver = context.driverRecords.find((record) => String(record.id ?? record.driver_id) === String(trip.driver_id));
  const driverName = driver?.driver_name ?? driver?.name ?? trip.driver_id ?? "Unassigned";
  const unit = context.unitRecords.find((record) => String(record.id ?? record.unit_id) === String(trip.unit_id));
  const unitNumber = unit?.unit_number ?? trip.unit_number ?? trip.unit_id ?? "Pending";
  const pickupWindowStart = trip.pickup_window_start ?? trip.pickup_window?.start;
  const pickupWindowEnd = trip.pickup_window_end ?? trip.pickup_window?.end;
  const deliveryWindowStart = trip.delivery_window_start ?? trip.delivery_window?.start;
  const deliveryWindowEnd = trip.delivery_window_end ?? trip.delivery_window?.end;

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
    driverType: trip.driver_type ?? driver?.driver_type,
    unit: unitNumber,
    unitNumber: unitNumber,
    unitType: trip.unit_type ?? trip.equipment_type ?? unit?.equipment_type,
    eta: listItem.eta,
    pickup: listItem.pickup,
    delivery: listItem.delivery,
    pickupWindowStart: pickupWindowStart ? toIso(pickupWindowStart) : undefined,
    pickupWindowEnd: pickupWindowEnd ? toIso(pickupWindowEnd) : undefined,
    deliveryWindowStart: deliveryWindowStart ? toIso(deliveryWindowStart) : undefined,
    deliveryWindowEnd: deliveryWindowEnd ? toIso(deliveryWindowEnd) : undefined,
    plannedStart: trip.planned_start || trip.planned_at ? toIso(trip.planned_start ?? trip.planned_at) : undefined,
    actualStart: trip.actual_start ? toIso(trip.actual_start) : undefined,
    pickupDeparture: trip.pickup_departure ? toIso(trip.pickup_departure) : undefined,
    completedAt: trip.completed_at || trip.completedAt ? toIso(trip.completed_at ?? trip.completedAt) : undefined,
    onTimePickup: Boolean(trip.on_time_pickup ?? trip.onTimePickup),
    onTimeDelivery: Boolean(trip.on_time_delivery ?? trip.onTimeDelivery),
    metrics: {
      distanceMiles: trip.distance_miles ?? trip.actual_miles ?? trip.planned_miles ?? trip.miles ?? trip.distance,
      estDurationHours: trip.duration_hours ?? trip.est_duration_hours,
      linehaul: trip.linehaul_cost ?? trip.linehaul,
      fuel: trip.fuel_cost ?? trip.fuel,
      totalCost: trip.total_cost ?? trip.totalCost,
      totalCpm: trip.total_cpm ?? (trip.total_cost && trip.distance_miles ? trip.total_cost / trip.distance_miles : undefined),
      recommendedRevenue: trip.recommended_revenue ?? trip.revenue,
      marginPct: trip.margin_pct ?? trip.margin,
    },
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
