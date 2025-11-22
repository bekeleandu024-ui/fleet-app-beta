import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";
import { serviceFetch } from "@/lib/service-client";
import { mapDriverRecord } from "@/lib/transformers";

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
  try {
    const payload = await serviceFetch<{ drivers?: Array<Record<string, any>> }>("masterData", "/api/metadata/drivers");
    return NextResponse.json({ data: (payload.drivers ?? []).map(mapDriverRecord) });
  } catch (error) {
    console.error("Admin drivers fetch failed", error);
    return NextResponse.json({ error: "Unable to load drivers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    createSchema.parse(await request.json());
    return NextResponse.json({ error: "Driver creation is disabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    updateSchema.parse(await request.json());
    return NextResponse.json({ error: "Driver updates are disabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}


