import { NextResponse } from "next/server";

import { listTrips } from "@/lib/mock-data-store";
import { serviceFetch } from "@/lib/service-client";

type TripRecord = ReturnType<typeof listTrips>[number];

export async function GET() {
  let trips: TripRecord[];

  try {
    trips = await serviceFetch<TripRecord[]>("tracking", "/api/trips");
  } catch (error) {
    console.warn("Error fetching trips from service, using mock data", error);
    trips = listTrips();
  }

  return NextResponse.json(buildTripsResponse(trips));
}

function buildTripsResponse(trips: TripRecord[]) {
  return {
    stats: {
      active,
      late,
      exception,
    },
    filters: {
      statuses: Array.from(new Set(trips.map(t => t.status))).sort(),
      exceptions: ["Weather", "Mechanical", "Customer Hold"],
      dateRanges: ["Today", "48 Hours", "7 Days"],
    },
    data: trips,
  };
}
