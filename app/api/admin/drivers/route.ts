import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";
import { createDriver, listDrivers, removeDriver, updateDriver } from "@/lib/mock-data-store";

const driverStatusValues = ["Ready", "Booked", "Off Duty", "Leave"] as const;

const baseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(driverStatusValues),
  region: z.string().min(1, "Region is required"),
  hoursAvailable: z.number().min(0, "Hours must be 0 or more"),
});
const createSchema = baseSchema.extend({ id: z.string().optional() });
const updateSchema = baseSchema.extend({ id: z.string() });

export async function GET() {
  return NextResponse.json({ data: listDrivers() });
}

export async function POST(request: Request) {
  try {
    const payload = createSchema.parse(await request.json());
    const record = createDriver(payload);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = updateSchema.parse(await request.json());
    const { id, ...changes } = payload;
    const record = updateDriver(id, changes);
    return NextResponse.json({ data: record });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = z.object({ id: z.string() }).parse(await request.json());
    removeDriver(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}
