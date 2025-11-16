import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";
import { serviceFetch } from "@/lib/service-client";
import { mapRuleRecord } from "@/lib/transformers";

const ruleStatuses = ["Active", "Draft", "Deprecated"] as const;

const baseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(ruleStatuses),
  region: z.string().min(1, "Region is required"),
  owner: z.string().min(1, "Owner is required"),
});

const createSchema = baseSchema.extend({ id: z.string().optional() });
const updateSchema = baseSchema.extend({ id: z.string() });

export async function GET() {
  try {
    const payload = await serviceFetch<{ rules?: Array<Record<string, any>> }>("masterData", "/api/metadata/rules");
    return NextResponse.json({ data: (payload.rules ?? []).map(mapRuleRecord) });
  } catch (error) {
    console.error("Admin rules fetch failed", error);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    createSchema.parse(await request.json());
    return NextResponse.json({ error: "Rule creation is disabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    updateSchema.parse(await request.json());
    return NextResponse.json({ error: "Rule updates are disabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

