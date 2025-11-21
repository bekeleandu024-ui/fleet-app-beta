import { NextResponse } from "next/server";

const MASTER_DATA_SERVICE = process.env.MASTER_DATA_SERVICE_URL || "http://localhost:4001";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";
  const notOnHold = searchParams.get("isOnHold") === "false";

  try {
    // Fetch real units from master-data service
    const response = await fetch(`${MASTER_DATA_SERVICE}/api/metadata/units`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch units from master-data service");
    }

    const data = await response.json();
    let units = data.units || [];

    // Transform to match expected format
    units = units.map((unit: any) => ({
      id: unit.unit_id,
      code: unit.unit_number,
      type: unit.driver_type === "Owner Operator" ? "Owner Op" : "Company",
      homeBase: unit.region || "Unknown",
      status: unit.is_active ? "Available" : "Inactive",
      isOnHold: false,
      active: unit.is_active,
      driverName: unit.driver_name,
    }));

    if (activeOnly) {
      units = units.filter((u: any) => u.active);
    }
    
    if (notOnHold) {
      units = units.filter((u: any) => !u.isOnHold);
    }

    return NextResponse.json({ data: units });
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}
