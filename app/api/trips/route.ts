import { NextResponse } from "next/server";
import { serviceFetch } from "@/lib/service-client";
import type { TripListItem } from "@/lib/types";

interface BackendTrip {
  id: string;
  dispatch_id: string;
  order_id: string;
  driver_id: string;
  status: string;
  pickup_location: string;
  dropoff_location: string;
  planned_start?: string;
  actual_start?: string;
  pickup_departure?: string;
  completed_at?: string;
  on_time_pickup?: boolean;
  on_time_delivery?: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface BackendTripsResponse {
  value: BackendTrip[];
  Count: number;
}

export async function GET() {
  try {
    const response = await serviceFetch<BackendTripsResponse>("tracking", "/api/trips");
    const trips = (response.value || []).map(transformTrip);
    return NextResponse.json(buildTripsResponse(trips));
  } catch (error) {
    console.error("Error fetching trips from tracking service:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips" },
      { status: 503 }
    );
  }
}

function transformTrip(trip: BackendTrip): TripListItem {
  const statusMap: Record<string, string> = {
    assigned: "Assigned",
    in_transit: "In Transit",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const eta = trip.completed_at || trip.planned_start || new Date().toISOString();

  return {
    id: trip.id,
    tripNumber: trip.id.slice(0, 8).toUpperCase(),
    driver: `DRV-${trip.driver_id.slice(0, 6).toUpperCase()}`,
    unit: `UNIT-${trip.driver_id.slice(0, 6).toUpperCase()}`,
    pickup: trip.pickup_location,
    delivery: trip.dropoff_location,
    eta,
    status: statusMap[trip.status] || "Unknown",
    exceptions: 0,
    lastPing: trip.updated_at,
    orderId: trip.order_id,
    driverId: trip.driver_id,
  };
}

function buildTripsResponse(trips: TripListItem[]) {
  const active = trips.filter(t => t.status === "In Transit" || t.status === "Assigned").length;
  const late = 0;
  const exception = 0;

  return {
    stats: {
      active,
      late,
      exception,
    },
    filters: {
      statuses: Array.from(new Set(trips.map(t => t.status))).sort(),
      exceptions: ["Weather", "Mechanical", "Customer Hold"],
      dateRanges: ["Today", "48 Hours", "7 Days"],
    },
    data: trips,
  };
}
