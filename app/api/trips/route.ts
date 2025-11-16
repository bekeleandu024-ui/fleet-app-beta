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
