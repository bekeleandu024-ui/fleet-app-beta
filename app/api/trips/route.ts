import { NextResponse } from "next/server";

import { listTrips } from "@/lib/mock-data-store";

export async function GET() {
  const trips = listTrips();

  return NextResponse.json({
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
  });
}
