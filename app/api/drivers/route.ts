import { NextResponse } from "next/server";

const MASTER_DATA_SERVICE = process.env.MASTER_DATA_SERVICE_URL || "http://localhost:4001";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";

  try {
    // Fetch real drivers from master-data service
    const response = await fetch(`${MASTER_DATA_SERVICE}/api/metadata/drivers`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch drivers from master-data service");
    }

    const data = await response.json();
    let drivers = data.drivers || [];

    // Transform to match expected format
    drivers = drivers.map((driver: any) => ({
      id: driver.driver_id,
      name: driver.driver_name,
      homeBase: driver.region || "Unknown",
      hoursAvailableToday: 10, // Could be calculated based on driver status
      onTimeScore: 95, // Could come from performance metrics
      active: driver.is_active,
      type: driver.driver_type,
      zone: driver.oo_zone,
    }));

    if (activeOnly) {
      drivers = drivers.filter((d: any) => d.active);
    }

    return NextResponse.json({ data: drivers });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
  }
}
