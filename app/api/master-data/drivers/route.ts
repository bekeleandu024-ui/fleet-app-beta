import { NextResponse } from "next/server";

import { listDrivers } from "@/lib/mock-data-store";
import { serviceFetch } from "@/lib/service-client";

type DriverRecord = ReturnType<typeof listDrivers>[number];

export async function GET() {
  let drivers: DriverRecord[];

  try {
    const data = await serviceFetch<{ drivers?: Array<Record<string, any>> }>(
      "masterData",
      "/api/metadata/drivers"
    );
    drivers = transformDrivers(data.drivers ?? []);
  } catch (error) {
    console.warn("Error fetching drivers from service, using mock data", error);
    drivers = listDrivers();
  }

  return NextResponse.json(buildDriverResponse(drivers));
}

function transformDrivers(records: Array<Record<string, any>>): DriverRecord[] {
  return records.map((driver) => ({
    id: String(driver.driver_id ?? driver.id ?? ""),
    name: driver.driver_name ?? driver.name ?? "Driver",
    status: driver.is_active === false ? "Off Duty" : "Ready",
    region: driver.region ?? "Unknown",
    hoursAvailable: Number(driver.hoursAvailable ?? driver.hours_available ?? 8),
    updated: driver.updated ?? new Date().toISOString(),
  }));
}

function buildDriverResponse(drivers: DriverRecord[]) {
  const regions = Array.from(new Set(drivers.map((driver) => driver.region))).sort();
  const statuses = Array.from(new Set(drivers.map((driver) => driver.status))).sort();

  return {
    filters: {
      regions: ["All", ...regions],
      statuses,
    },
    data: drivers,
  };
}
