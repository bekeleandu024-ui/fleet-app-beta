import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";
import { createOrder, listOrders, removeOrder, updateOrder } from "@/lib/mock-data-store";

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
  return NextResponse.json({ data: listOrders() });
}

export async function POST(request: Request) {
  try {
    const payload = createSchema.parse(await request.json());
    const record = createOrder(payload);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = updateSchema.parse(await request.json());
    const { id, ...changes } = payload;
    const record = updateOrder(id, changes);
    return NextResponse.json({ data: record });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = z.object({ id: z.string() }).parse(await request.json());
    removeOrder(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}
