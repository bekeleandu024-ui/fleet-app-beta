import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";
import { serviceFetch } from "@/lib/service-client";
import { mapOrderAdminRecord } from "@/lib/transformers";

const orderStatuses = ["New", "Planning", "In Transit", "At Risk", "Delivered", "Exception"] as const;

const baseSchema = z.object({
  reference: z.string().min(1, "Reference is required"),
  customer: z.string().min(1, "Customer is required"),
  pickup: z.string().min(1, "Pickup location is required"),
  delivery: z.string().min(1, "Delivery location is required"),
  window: z.string().min(1, "Service window is required"),
  status: z.enum(orderStatuses),
  ageHours: z.number().min(0, "Age must be 0 or more"),
  cost: z.number().min(0, "Cost must be 0 or more").optional(),
  lane: z.string().min(1, "Lane is required"),
  serviceLevel: z.string().min(1, "Service level is required"),
  commodity: z.string().min(1, "Commodity is required"),
  laneMiles: z.number().min(1, "Lane miles must be positive"),
});

const createSchema = baseSchema.extend({ id: z.string().optional() });
const updateSchema = baseSchema.extend({ id: z.string() });

export async function GET() {
  try {
    const records = await serviceFetch<Array<Record<string, any>>>("orders", "/api/orders");
    return NextResponse.json({ data: records.map(mapOrderAdminRecord) });
  } catch (error) {
    console.error("Admin orders fetch failed", error);
    return NextResponse.json({ error: "Unable to load orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    createSchema.parse(await request.json());
    return NextResponse.json({ error: "Order creation is not available against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    updateSchema.parse(await request.json());
    return NextResponse.json({ error: "Order updates are not enabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

