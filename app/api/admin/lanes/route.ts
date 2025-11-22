import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";

const baseSchema = z.object({
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  miles: z.number().min(1, "Miles must be positive"),
  transitDays: z.number().min(1, "Transit days must be at least 1"),
});

const createSchema = baseSchema.extend({ id: z.string().optional() });
const updateSchema = baseSchema.extend({ id: z.string() });

export async function GET() {
  return NextResponse.json({ data: [] });
}

export async function POST(request: Request) {
  try {
    createSchema.parse(await request.json());
    return NextResponse.json({ error: "Lane creation is disabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    updateSchema.parse(await request.json());
    return NextResponse.json({ error: "Lane updates are disabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}


