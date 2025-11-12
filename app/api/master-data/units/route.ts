import { NextResponse } from "next/server";

import { listUnits } from "@/lib/mock-data-store";

export async function GET() {
  const units = listUnits();
  const regions = Array.from(new Set(units.map((unit) => unit.region))).sort();
  const statuses = Array.from(new Set(units.map((unit) => unit.status))).sort();

  return NextResponse.json({
    filters: {
      regions: ["All", ...regions],
      statuses,
    },
    data: units.map((unit) => ({
      id: unit.id,
      name: unit.id,
      status: unit.status,
      region: unit.region,
      updated: unit.updated,
      type: unit.type,
      location: unit.location,
    })),
  });
}
