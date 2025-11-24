import { NextResponse } from "next/server";
import { serviceFetch } from "@/lib/service-client";
import type { TripListItem } from "@/lib/types";

interface BackendTrip {
  id: string;
  dispatch_id: string;
  order_id: string;
  driver_id: string;
  unit_id?: string;
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

interface TripStop {
  id?: string;
  stopType: string;
  location?: string;
  name?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  postal?: string;
  country?: string;
  appointmentStart?: string;
  appointmentEnd?: string;
  scheduledAt?: string;
  notes?: string;
  sequence?: number;
}

interface CreateTripPayload {
  orderId: string;
  driverId: string;
  unitId?: string;
  rateId?: string;
  miles?: number;
  rpm?: number;
  totalRevenue?: number;
  totalCpm?: number;
  totalCost?: number;
  stops?: TripStop[];
  pickup?: {
    location: string;
    windowStart?: string;
    windowEnd?: string;
  };
  delivery?: {
    location: string;
    windowStart?: string;
    windowEnd?: string;
  };
  notes?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateTripPayload;
    
    // Handle both stops array (from booking page) and pickup/delivery objects (legacy)
    let pickupData, deliveryData;
    
    if (body.stops && body.stops.length >= 2) {
      // Find first pickup and last delivery from stops array
      const pickupStop = body.stops.find(s => s.stopType === "Pickup") || body.stops[0];
      const deliveryStop = [...body.stops].reverse().find(s => s.stopType === "Delivery") || body.stops[body.stops.length - 1];
      
      // Build location string from stop data (name or city, state)
      const buildLocation = (stop: TripStop) => {
        if (stop.location) return stop.location;
        if (stop.name) return stop.name;
        if (stop.city && stop.state) return `${stop.city}, ${stop.state}`;
        return stop.address || stop.street || stop.city || "Unknown";
      };
      
      pickupData = {
        location: buildLocation(pickupStop),
        windowStart: pickupStop.appointmentStart || pickupStop.scheduledAt,
        windowEnd: pickupStop.appointmentEnd,
      };
      
      deliveryData = {
        location: buildLocation(deliveryStop),
        windowStart: deliveryStop.appointmentStart || deliveryStop.scheduledAt,
        windowEnd: deliveryStop.appointmentEnd,
      };
    } else {
      // Legacy format with pickup/delivery objects
      pickupData = {
        location: body.pickup?.location || "",
        windowStart: body.pickup?.windowStart,
        windowEnd: body.pickup?.windowEnd,
      };
      
      deliveryData = {
        location: body.delivery?.location || "",
        windowStart: body.delivery?.windowStart,
        windowEnd: body.delivery?.windowEnd,
      };
    }
    
    const tripPayload = {
      orderId: body.orderId,
      driverId: body.driverId,
      unitId: body.unitId,
      pickup: pickupData,
      delivery: deliveryData,
      notes: body.notes,
      // Include costing data from booking page
      miles: body.miles,
      totalRevenue: body.totalRevenue,
      totalCost: body.totalCost,
      marginPct: body.totalRevenue && body.totalCost 
        ? Math.round(((body.totalRevenue - body.totalCost) / body.totalRevenue) * 100 * 100) / 100
        : undefined,
    };

    const trip = await serviceFetch("tracking", "/api/trips", {
      method: "POST",
      body: JSON.stringify(tripPayload),
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error: any) {
    console.error("Error creating trip:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create trip" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const response = await serviceFetch<BackendTripsResponse | BackendTrip[]>("tracking", "/api/trips");
    
    // Handle both array and object responses
    const tripsArray = Array.isArray(response) ? response : (response.value || []);
    
    // Fetch driver and unit data for mapping
    const [driversResult, unitsResult] = await Promise.allSettled([
      serviceFetch<{ drivers?: Array<Record<string, any>> }>("masterData", "/api/metadata/drivers"),
      serviceFetch<{ units?: Array<Record<string, any>> }>("masterData", "/api/metadata/units"),
    ]);

    const drivers = driversResult.status === "fulfilled" && driversResult.value?.drivers ? driversResult.value.drivers : [];
    const units = unitsResult.status === "fulfilled" && unitsResult.value?.units ? unitsResult.value.units : [];

    const trips = tripsArray.map(trip => transformTrip(trip, drivers, units));
    return NextResponse.json(buildTripsResponse(trips));
  } catch (error) {
    console.error("Error fetching trips from tracking service:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips" },
      { status: 503 }
    );
  }
}

function transformTrip(trip: BackendTrip, drivers: Array<Record<string, any>>, units: Array<Record<string, any>>): TripListItem {
  const statusMap: Record<string, string> = {
    planned: "Assigned",
    assigned: "Assigned",
    in_transit: "In Transit",
    en_route_to_pickup: "In Transit",
    at_pickup: "At Pickup",
    departed_pickup: "In Transit",
    at_delivery: "At Delivery",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  // Find driver and unit names
  const driver = drivers.find(d => d.driver_id === trip.driver_id || d.id === trip.driver_id);
  const unit = units.find(u => u.unit_id === trip.unit_id || u.id === trip.unit_id);

  const driverName = driver?.driver_name || driver?.name || `Driver ${trip.driver_id.slice(0, 6).toUpperCase()}`;
  const unitName = unit?.unit_number || unit?.unit_id?.slice(0, 8).toUpperCase() || trip.unit_id?.slice(0, 8).toUpperCase() || "N/A";

  const eta = trip.completed_at || trip.planned_start || new Date().toISOString();

  return {
    id: trip.id,
    tripNumber: trip.id.slice(0, 8).toUpperCase(),
    driver: driverName,
    unit: unitName,
    pickup: trip.pickup_location,
    delivery: trip.dropoff_location,
    eta,
    status: statusMap[trip.status.toLowerCase()] || trip.status,
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

