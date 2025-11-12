import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";
import { createLane, listLanes, removeLane, updateLane } from "@/lib/mock-data-store";

const baseSchema = z.object({
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  miles: z.number().min(1, "Miles must be positive"),
  transitDays: z.number().min(1, "Transit days must be at least 1"),
});

const createSchema = baseSchema.extend({ id: z.string().optional() });
const updateSchema = baseSchema.extend({ id: z.string() });

export async function GET() {
  return NextResponse.json({ data: listLanes() });
}

export async function POST(request: Request) {
  try {
    const payload = createSchema.parse(await request.json());
    const record = createLane(payload);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = updateSchema.parse(await request.json());
    const { id, ...changes } = payload;
    const record = updateLane(id, changes);
    return NextResponse.json({ data: record });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = z.object({ id: z.string() }).parse(await request.json());
    removeLane(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}
