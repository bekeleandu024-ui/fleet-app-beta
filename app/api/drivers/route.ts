import { NextResponse } from "next/server";
import { serviceFetch } from "@/lib/service-client";
import pool from "@/lib/db";

const MASTER_DATA_SERVICE = process.env.MASTER_DATA_SERVICE_URL || "http://localhost:4001";

interface BackendTrip {
  driver_id: string;
  status: string;
}

interface BackendTripsResponse {
  value: BackendTrip[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";

  try {
    // Fetch real drivers from DB
    const driversQuery = `
      SELECT driver_id, driver_name, driver_type, unit_number, region, oo_zone, is_active
      FROM driver_profiles
    `;
    const result = await pool.query(driversQuery);
    let drivers = result.rows;

    // Fetch active trips to determine availability
    let busyDriverIds = new Set<string>();
    try {
      const tripsResponse = await serviceFetch<BackendTripsResponse | BackendTrip[]>("tracking", "/api/trips");
      const trips = Array.isArray(tripsResponse) ? tripsResponse : (tripsResponse?.value || []);
      
      // Filter for active trips
      const activeStatuses = ["planned", "assigned", "in_transit", "en_route_to_pickup", "at_pickup", "departed_pickup", "at_delivery"];
      
      trips.forEach(trip => {
        if (activeStatuses.includes(trip.status.toLowerCase())) {
          busyDriverIds.add(trip.driver_id);
        }
      });
    } catch (error) {
      console.warn("Failed to fetch trips for availability check:", error);
      // Continue without availability info if trips service fails
    }

    // Transform to match expected format
    drivers = drivers.map((driver: any) => {
      const isBusy = busyDriverIds.has(driver.driver_id);
      
      return {
        id: driver.driver_id,
        name: driver.driver_name,
        homeBase: driver.region || "Unknown",
        hoursAvailableToday: isBusy ? 0 : 10, // Set to 0 if busy
        onTimeScore: 95, // Could come from performance metrics
        active: driver.is_active,
        type: driver.driver_type,
        zone: driver.oo_zone,
        status: isBusy ? "Busy" : "Available", // Add status field
      };
    });

    if (activeOnly) {
      drivers = drivers.filter((d: any) => d.active);
    }

    return NextResponse.json({ data: drivers });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
  }
}

