import { NextResponse } from "next/server";

import { listUnits } from "@/lib/mock-data-store";
import { serviceFetch } from "@/lib/service-client";

type UnitRecord = ReturnType<typeof listUnits>[number];

export async function GET() {
  let units: UnitRecord[];

  try {
    const data = await serviceFetch<{ units?: Array<Record<string, any>> }>(
      "masterData",
      "/api/metadata/units"
    );
    units = transformUnits(data.units ?? []);
  } catch (error) {
    console.warn("Error fetching units from service, using mock data", error);
    units = listUnits();
  }

  return NextResponse.json(buildUnitResponse(units));
}

function transformUnits(records: Array<Record<string, any>>): UnitRecord[] {
  return records.map((unit) => ({
    id: String(unit.unit_id ?? unit.id ?? unit.unit_number ?? ""),
    name: unit.unit_number ?? unit.name ?? String(unit.id ?? "Unit"),
    status: unit.is_active === false ? "Maintenance" : "Available",
    region: unit.region ?? "Unknown",
    updated: unit.updated ?? new Date().toISOString(),
    type: unit.unit_type ?? unit.type ?? "Unknown",
    location: unit.current_location ?? unit.location ?? "Fleet Yard",
  }));
}

function buildUnitResponse(units: UnitRecord[]) {
  const regions = Array.from(new Set(units.map((unit) => unit.region))).sort();
  const statuses = Array.from(new Set(units.map((unit) => unit.status))).sort();

  return {
    filters: {
      regions: ["All", ...regions],
      statuses,
    },
    data: units,
  };
}
