import { NextResponse } from "next/server";

import { listDrivers } from "@/lib/mock-data-store";

export async function GET() {
  const drivers = listDrivers();
  const regions = Array.from(new Set(drivers.map((driver) => driver.region))).sort();
  const statuses = Array.from(new Set(drivers.map((driver) => driver.status))).sort();

  return NextResponse.json({
    filters: {
      regions: ["All", ...regions],
      statuses,
    },
    data: drivers,
  });
}
