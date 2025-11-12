import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";
import { createUnit, listUnits, removeUnit, updateUnit } from "@/lib/mock-data-store";

const unitStatuses = ["Available", "In-use", "Maintenance", "Out of Service"] as const;

const baseSchema = z.object({
  type: z.string().min(1, "Type is required"),
  status: z.enum(unitStatuses),
  location: z.string().min(1, "Location is required"),
  region: z.string().min(1, "Region is required"),
});

const createSchema = baseSchema.extend({ id: z.string().optional() });
const updateSchema = baseSchema.extend({ id: z.string() });

export async function GET() {
  return NextResponse.json({ data: listUnits() });
}

export async function POST(request: Request) {
  try {
    const payload = createSchema.parse(await request.json());
    const record = createUnit(payload);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = updateSchema.parse(await request.json());
    const { id, ...changes } = payload;
    const record = updateUnit(id, changes);
    return NextResponse.json({ data: record });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = z.object({ id: z.string() }).parse(await request.json());
    removeUnit(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}
