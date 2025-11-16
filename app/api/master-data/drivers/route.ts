import { NextResponse } from "next/server";

import { serviceFetch } from "@/lib/service-client";

type DriverRecord = {
  id: string;
  name: string;
  status: string;
  region: string;
  hoursAvailable: number;
  updated: string;
};

export async function GET() {
  try {
    const data = await serviceFetch<{ drivers?: Array<Record<string, any>> }>(
      "masterData",
      "/api/metadata/drivers"
    );
    const drivers = transformDrivers(data.drivers ?? []);
    return NextResponse.json(buildDriverResponse(drivers));
  } catch (error) {
    console.error("Error fetching drivers from service", error);
    return NextResponse.json({ error: "Failed to load drivers" }, { status: 500 });
  }
}

function transformDrivers(records: Array<Record<string, any>>): DriverRecord[] {
  return records.map((driver, index) => {
    const rawId = driver.driver_id ?? driver.id ?? driver.driver_name ?? driver.name;
    const id = rawId && String(rawId).trim() !== "" ? String(rawId) : `driver-${index}`;

    return {
      id,
      name: driver.driver_name ?? driver.name ?? "Driver",
      status: driver.is_active === false ? "Off Duty" : "Ready",
      region: driver.region ?? "Unknown",
      hoursAvailable: Number(driver.hoursAvailable ?? driver.hours_available ?? 8),
      updated: driver.updated ?? new Date().toISOString(),
    };
  });
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
