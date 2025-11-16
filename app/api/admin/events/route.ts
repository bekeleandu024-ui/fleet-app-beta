import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";
import { serviceFetch } from "@/lib/service-client";
import { mapEventRecord } from "@/lib/transformers";

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
  try {
    const payload = await serviceFetch<{ events?: Array<Record<string, any>> }>("masterData", "/api/metadata/events");
    return NextResponse.json({ data: (payload.events ?? []).map(mapEventRecord) });
  } catch (error) {
    console.error("Admin events fetch failed", error);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    createSchema.parse(await request.json());
    return NextResponse.json({ error: "Event creation is disabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    updateSchema.parse(await request.json());
    return NextResponse.json({ error: "Event updates are disabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

