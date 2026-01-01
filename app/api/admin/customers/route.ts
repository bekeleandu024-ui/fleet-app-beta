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

const FIXED_CUSTOMERS = [
  "AUTOCOM",
  "CAMCOR",
  "CORVEX",
  "SPINIC",
  "COMTECH",
  "CEMTOL",
  "THE CENTER",
  "CAMTAC"
];

export async function GET() {
  try {
    const response = await serviceFetch<any>("orders", "/api/orders");
    // Handle both array and structured response {data: [...]}
    const orders = Array.isArray(response) ? response : (response.data || []);
    
    const customerMap = new Map(orders.map((order: Record<string, any>) => {
      const record = mapCustomerRecord(order);
      // Normalize name for deduplication (uppercase, no extra spaces)
      const normalizedName = record.name.toUpperCase().trim();
      return [normalizedName, record];
    }));

    // Ensure fixed customers are in the list
    FIXED_CUSTOMERS.forEach(name => {
      const normalizedName = name.toUpperCase().trim();
      if (!customerMap.has(normalizedName)) {
        customerMap.set(normalizedName, {
          id: `cust-${name.toLowerCase().replace(/\s+/g, '-')}`,
          name,
          status: "Active",
          primaryContact: `logistics@${name.toLowerCase().replace(/\s+/g, '')}.com`,
          primaryLane: "Various",
          totalOrders: 0,
          totalRevenue: 0
        });
      }
    });

    const customers = Array.from(customerMap.values());
    return NextResponse.json({ data: customers });
  } catch (error) {
    console.error("Admin customers fetch failed", error);
    // Return fixed customers as fallback
    const fallbackCustomers = FIXED_CUSTOMERS.map(name => ({
      id: `cust-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      status: "Active",
      primaryContact: `logistics@${name.toLowerCase().replace(/\s+/g, '')}.com`,
      primaryLane: "Various",
      totalOrders: 0,
      totalRevenue: 0
    }));
    return NextResponse.json({ data: fallbackCustomers });
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


