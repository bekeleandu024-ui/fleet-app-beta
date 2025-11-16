import { NextResponse } from "next/server";

import { serviceFetch } from "@/lib/service-client";

type UnitRecord = {
  id: string;
  name: string;
  status: string;
  region: string;
  updated: string;
  type: string;
  location: string;
};

export async function GET() {
  try {
    const data = await serviceFetch<{ units?: Array<Record<string, any>> }>(
      "masterData",
      "/api/metadata/units"
    );
    const units = transformUnits(data.units ?? []);
    return NextResponse.json(buildUnitResponse(units));
  } catch (error) {
    console.error("Error fetching units from service", error);
    return NextResponse.json({ error: "Failed to load units" }, { status: 500 });
  }
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
