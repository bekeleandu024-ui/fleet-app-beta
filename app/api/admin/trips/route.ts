import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";
import { serviceFetch } from "@/lib/service-client";
import { mapTripAdminRecord } from "@/lib/transformers";

const tripStatuses = ["On Time", "Running Late", "Exception", "Delivered"] as const;

const baseSchema = z.object({
  tripNumber: z.string().optional(),
  orderId: z.string().min(1, "Order ID is required"),
  driverId: z.string().min(1, "Driver ID is required"),
  unitId: z.string().min(1, "Unit ID is required"),
  driver: z.string().min(1, "Driver name is required"),
  unit: z.string().min(1, "Unit is required"),
  pickup: z.string().min(1, "Pickup location is required"),
  delivery: z.string().min(1, "Delivery location is required"),
  eta: z.string().min(1, "ETA is required"),
  status: z.enum(tripStatuses),
  exceptions: z.number().min(0, "Exceptions must be 0 or more"),
  lastPing: z.string().min(1, "Last ping timestamp is required"),
});

const createSchema = baseSchema.extend({ id: z.string().optional() });
const updateSchema = baseSchema.extend({ id: z.string() });

export async function GET() {
  try {
    const response = await serviceFetch<any>("tracking", "/api/trips");
    // Handle both array and object responses
    const trips = Array.isArray(response) ? response : (response.value || []);
    return NextResponse.json({ data: trips.map((trip) => mapTripAdminRecord(trip)) });
  } catch (error) {
    console.error("Admin trips fetch failed", error);
    return NextResponse.json({ error: "Unable to load trips" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createSchema.parse(body);
    
    // Create trip via tracking service
    const tripPayload = {
      orderId: validated.orderId,
      driverId: validated.driverId,
      unitId: validated.unitId,
      pickup: {
        location: validated.pickup,
        windowStart: validated.eta,
        windowEnd: new Date(new Date(validated.eta).getTime() + 4 * 60 * 60 * 1000).toISOString(),
      },
      delivery: {
        location: validated.delivery,
        windowStart: new Date(new Date(validated.eta).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        windowEnd: new Date(new Date(validated.eta).getTime() + 28 * 60 * 60 * 1000).toISOString(),
      },
      notes: body.notes || '',
    };
    
    const trip = await serviceFetch("tracking", "/api/trips", {
      method: "POST",
      body: JSON.stringify(tripPayload),
    });
    
    return NextResponse.json({ data: mapTripAdminRecord(trip) }, { status: 201 });
  } catch (error) {
    console.error("Error creating trip:", error);
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    updateSchema.parse(await request.json());
    return NextResponse.json({ error: "Trip updates are disabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

