import { NextResponse } from "next/server";

import { serviceFetch } from "@/lib/service-client";
import { mapTripListItem } from "@/lib/transformers";
import type { TripListItem } from "@/lib/types";

type TripResponse = { value?: Array<Record<string, any>>; Count?: number };

export async function GET() {
  try {
    const [tripPayload, driversPayload, unitsPayload] = await Promise.all([
      serviceFetch<TripResponse>("tracking", "/api/trips"),
      serviceFetch<{ drivers?: Array<Record<string, any>> }>("masterData", "/api/metadata/drivers").catch(() => ({ drivers: [] })),
      serviceFetch<{ units?: Array<Record<string, any>> }>("masterData", "/api/metadata/units").catch(() => ({ units: [] })),
    ]);

    const drivers = driversPayload?.drivers ?? [];
    const units = unitsPayload?.units ?? [];
    const trips = transformTrips(tripPayload.value ?? [], drivers, units);

    return NextResponse.json(buildTripsResponse(trips));
  } catch (error) {
    console.error("Error fetching trips from service", error);
    return NextResponse.json({ error: "Failed to load trips" }, { status: 500 });
  }
}

function transformTrips(
  trips: Array<Record<string, any>>,
  drivers: Array<Record<string, any>>, 
  units: Array<Record<string, any>>
): TripListItem[] {
  return trips.map((trip) => {
    const driver = drivers.find((driver) => String(driver.id ?? driver.driver_id) === String(trip.driver_id));
    const unit = units.find((unit) => String(unit.id ?? unit.unit_id) === String(trip.unit_id));
    const eta = trip.completed_at ?? trip.planned_start ?? new Date().toISOString();
    const lastPing = trip.updated_at ?? trip.actual_start ?? new Date().toISOString();

    return mapTripListItem(
      {
        ...trip,
        tripNumber: String(trip.id ?? "").slice(0, 8).toUpperCase(),
        eta,
        last_ping: lastPing,
        exceptions: trip.exceptions ?? 0,
      },
      driver?.name ?? driver?.driver_name ?? "Unassigned",
      unit?.unit_number ?? unit?.name ?? "Pending"
    );
  });
}

function buildTripsResponse(trips: TripListItem[]) {
  return {
    stats: {
      active: trips.length,
      late: trips.filter((trip) => trip.status === "Running Late").length,
      exception: trips.filter((trip) => trip.status === "Exception").length,
    },
    filters: {
      statuses: Array.from(new Set(trips.map((trip) => trip.status))).sort(),
      exceptions: ["Weather", "Mechanical", "Customer Hold"],
      dateRanges: ["Today", "48 Hours", "7 Days"],
    },
    data: trips,
  };
}
