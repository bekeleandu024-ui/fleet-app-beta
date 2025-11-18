import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";
import { serviceFetch } from "@/lib/service-client";
import { mapCustomerRecord } from "@/lib/transformers";

const customerStatuses = ["Active", "Paused", "Prospect"] as const;

const baseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(customerStatuses),
  primaryContact: z.string().email("Valid email required"),
  primaryLane: z.string().min(1, "Primary lane is required"),
});

const createSchema = baseSchema.extend({ id: z.string().optional() });
const updateSchema = baseSchema.extend({ id: z.string() });

export async function GET() {
  try {
    const response = await serviceFetch<any>("orders", "/api/orders");
    // Handle both array and structured response {data: [...]}
    const orders = Array.isArray(response) ? response : (response.data || []);
    
    const customers = Array.from(
      new Map(orders.map((order: Record<string, any>) => {
        const record = mapCustomerRecord(order);
        return [record.id, record];
      })).values()
    );
    return NextResponse.json({ data: customers });
  } catch (error) {
    console.error("Admin customers fetch failed", error);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    createSchema.parse(await request.json());
    return NextResponse.json({ error: "Customer creation is disabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    updateSchema.parse(await request.json());
    return NextResponse.json({ error: "Customer updates are disabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

