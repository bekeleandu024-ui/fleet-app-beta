import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";
import { serviceFetch } from "@/lib/service-client";
import { mapUnitRecord } from "@/lib/transformers";

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
  try {
    const payload = await serviceFetch<{ units?: Array<Record<string, any>> }>("masterData", "/api/metadata/units");
    return NextResponse.json({ data: (payload.units ?? []).map(mapUnitRecord) });
  } catch (error) {
    console.error("Admin units fetch failed", error);
    return NextResponse.json({ error: "Unable to load units" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    createSchema.parse(await request.json());
    return NextResponse.json({ error: "Unit creation is disabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    updateSchema.parse(await request.json());
    return NextResponse.json({ error: "Unit updates are disabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

