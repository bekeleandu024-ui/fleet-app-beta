import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";
import { createEvent, listEvents, updateEvent } from "@/lib/mock-data-store";

const eventStatuses = ["Open", "Investigating", "Resolved"] as const;
const severityLevels = ["Low", "Medium", "High"] as const;

const baseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(eventStatuses),
  region: z.string().min(1, "Region is required"),
  severity: z.enum(severityLevels),
});

const createSchema = baseSchema.extend({ id: z.string().optional() });
const updateSchema = baseSchema.extend({ id: z.string() });

export async function GET() {
  return NextResponse.json({ data: listEvents() });
}

export async function POST(request: Request) {
  try {
    const payload = createSchema.parse(await request.json());
    const record = createEvent(payload);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = updateSchema.parse(await request.json());
    const { id, ...changes } = payload;
    const record = updateEvent(id, changes);
    return NextResponse.json({ data: record });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

