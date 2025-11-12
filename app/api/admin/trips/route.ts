import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";
import { createTrip, listTrips, updateTrip } from "@/lib/mock-data-store";

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
  return NextResponse.json({ data: listTrips() });
}

export async function POST(request: Request) {
  try {
    const payload = createSchema.parse(await request.json());
    const record = createTrip(payload);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = updateSchema.parse(await request.json());
    const { id, ...changes } = payload;
    const record = updateTrip(id, changes);
    return NextResponse.json({ data: record });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

