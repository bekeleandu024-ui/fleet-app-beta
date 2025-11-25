import { NextResponse } from "next/server";
import { serviceFetch } from "@/lib/service-client";

const MASTER_DATA_SERVICE = process.env.MASTER_DATA_SERVICE_URL || "http://localhost:4001";

interface BackendTrip {
  unit_id?: string;
  status: string;
}

interface BackendTripsResponse {
  value: BackendTrip[];
}

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

    // Fetch active trips to determine availability
    let busyUnitIds = new Set<string>();
    try {
      const tripsResponse = await serviceFetch<BackendTripsResponse | BackendTrip[]>("tracking", "/api/trips");
      const trips = Array.isArray(tripsResponse) ? tripsResponse : (tripsResponse?.value || []);
      
      // Filter for active trips
      const activeStatuses = ["planned", "assigned", "in_transit", "en_route_to_pickup", "at_pickup", "departed_pickup", "at_delivery"];
      
      trips.forEach(trip => {
        if (trip.unit_id && activeStatuses.includes(trip.status.toLowerCase())) {
          busyUnitIds.add(trip.unit_id);
        }
      });
    } catch (error) {
      console.warn("Failed to fetch trips for availability check:", error);
      // Continue without availability info if trips service fails
    }

    // Transform to match expected format
    units = units.map((unit: any) => {
      const isBusy = busyUnitIds.has(unit.unit_id);
      
      return {
        id: unit.unit_id,
        code: unit.unit_number,
        type: unit.driver_type === "Owner Operator" ? "Owner Op" : "Company",
        homeBase: unit.region || "Unknown",
        status: isBusy ? "Busy" : (unit.is_active ? "Available" : "Inactive"),
        isOnHold: false,
        active: unit.is_active,
        driverName: unit.driver_name,
      };
    });

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

