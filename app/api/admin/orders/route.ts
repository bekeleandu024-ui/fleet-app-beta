import { NextResponse } from "next/server";
import { z } from "zod";

import { formatError } from "@/lib/api-errors";
import { serviceFetch } from "@/lib/service-client";
import { mapOrderAdminRecord } from "@/lib/transformers";
import pool from "@/lib/db";

const orderStatuses = ["New", "Planning", "In Transit", "At Risk", "Delivered", "Exception"] as const;

const baseSchema = z.object({
  reference: z.string().min(1, "Reference is required"),
  customer: z.string().min(1, "Customer is required"),
  pickup: z.string().min(1, "Pickup location is required"),
  delivery: z.string().min(1, "Delivery location is required"),
  window: z.string().min(1, "Service window is required"),
  status: z.enum(orderStatuses),
  ageHours: z.number().min(0, "Age must be 0 or more"),
  cost: z.number().min(0, "Cost must be 0 or more").optional(),
  lane: z.string().min(1, "Lane is required"),
  serviceLevel: z.string().min(1, "Service level is required"),
  commodity: z.string().min(1, "Commodity is required"),
  laneMiles: z.number().min(1, "Lane miles must be positive"),
  totalWeight: z.number().optional().nullable(),
  totalPallets: z.number().optional().nullable(),
  palletDimensions: z.any().optional().nullable(),
  stackable: z.boolean().optional().nullable(),
  cubicFeet: z.number().optional().nullable(),
  linearFeetRequired: z.number().optional().nullable(),
});

const createSchema = baseSchema.extend({ id: z.string().optional() });
const updateSchema = baseSchema.extend({ id: z.string() });

export async function GET() {
  try {
    const response = await serviceFetch<any>("orders", "/api/orders");
    // Handle both array and structured response
    const records = Array.isArray(response) ? response : (response.data || []);
    return NextResponse.json({ data: records.map(mapOrderAdminRecord) });
  } catch (error) {
    console.error("Admin orders fetch failed", error);
    return NextResponse.json({ error: "Unable to load orders" }, { status: 500 });
  }
}

import { randomUUID } from "crypto";

// ... imports

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createSchema.parse(body);
    
    // Generate UUID for the order - this is the primary key
    const orderId = randomUUID();
    
    // Parse time windows from the window field (format: "2024-01-15 08:00 - 2024-01-15 18:00")
    const windowParts = validated.window?.split(" - ") || [];
    const pickupTime = windowParts[0] ? new Date(windowParts[0]) : null;
    const deliveryTime = windowParts[1] ? new Date(windowParts[1]) : null;
    
    // Generate time windows with 2-hour buffers if only single times provided
    const puWindowStart = pickupTime ? new Date(pickupTime.getTime() - 2 * 60 * 60 * 1000) : null;
    const puWindowEnd = pickupTime ? new Date(pickupTime.getTime() + 2 * 60 * 60 * 1000) : null;
    const delWindowStart = deliveryTime ? new Date(deliveryTime.getTime() - 2 * 60 * 60 * 1000) : null;
    const delWindowEnd = deliveryTime ? new Date(deliveryTime.getTime() + 2 * 60 * 60 * 1000) : null;
    
    // Generate lane identifier for analytics
    const extractCity = (location: string) => {
      const parts = location.split(',');
      return parts[0]?.trim() || location.slice(0, 20);
    };
    const lane = `${extractCity(validated.pickup)} → ${extractCity(validated.delivery)}`;
    
    // Transform to backend CreateOrderRequest format
    // Backend expects: customer_id, order_type, pickup_location, dropoff_location, pickup_time?, special_instructions?
    const orderPayload = {
      id: orderId, // Force UUID as primary key
      customer_id: validated.customer, // Frontend sends customer name as ID
      order_type: "round_trip", // Default order type
      pickup_location: validated.pickup,
      dropoff_location: validated.delivery,
      pickup_time: pickupTime?.toISOString() || undefined,
      special_instructions: `Service Level: ${validated.serviceLevel}, Commodity: ${validated.commodity}`,
    };
    
    // Insert order into local database first with ALL required fields
    try {
      const insertResult = await pool.query(
        `INSERT INTO orders (
          id, 
          customer_id, 
          order_type, 
          status,
          pickup_location, 
          dropoff_location, 
          pickup_time,
          dropoff_time,
          pu_window_start,
          pu_window_end,
          del_window_start,
          del_window_end,
          special_instructions,
          estimated_cost,
          quoted_rate,
          lane,
          required_equipment,
          order_number,
          created_at,
          updated_at,
          total_weight,
          total_pallets,
          pallet_dimensions,
          stackable,
          cubic_feet,
          linear_feet_required
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW(), $19, $20, $21, $22, $23, $24)
        RETURNING id, order_number, customer_id, status`,
        [
          orderId,
          orderPayload.customer_id,
          orderPayload.order_type,
          'New',
          orderPayload.pickup_location,
          orderPayload.dropoff_location,
          pickupTime,
          deliveryTime,
          puWindowStart,
          puWindowEnd,
          delWindowStart,
          delWindowEnd,
          orderPayload.special_instructions || null,
          validated.cost || null, // estimated_cost
          validated.cost || null, // quoted_rate - use same as cost initially
          lane,
          validated.serviceLevel || 'Dry Van', // required_equipment
          `ORD-${Date.now().toString().slice(-10)}`, // Generate order number
          validated.totalWeight || 0,
          validated.totalPallets || 0,
          JSON.stringify(validated.palletDimensions || []),
          validated.stackable || false,
          validated.cubicFeet || 0,
          validated.linearFeetRequired || 0
        ]
      );
      
      console.log(`[Order Create] Inserted into local DB with time windows:`, insertResult.rows[0]);
    } catch (dbError) {
      console.error(`[Order Create] Failed to insert into local DB:`, dbError);
      throw new Error(`Failed to create order in database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

    // Also send to backend service (best effort)
    let order: any;
    try {
      order = await serviceFetch<any>("orders", "/api/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });
      console.log(`[Order Create] Also sent to backend service`);
    } catch (error) {
      console.warn(`[Order Create] Backend service unavailable, order only in local DB`);
      order = {
        id: orderId,
        ...orderPayload,
      };
    }

    // Use the UUID we generated
    order.id = orderId;
    
    // Fetch the complete order from database
    const res = await pool.query(
      "SELECT id, order_number, customer_id, status FROM orders WHERE id = $1",
      [orderId]
    );
    
    if (res.rows.length > 0) {
      console.log(`[Order Create] Confirmed in DB:`, res.rows[0]);
      order = { ...order, ...res.rows[0] };
    }
    
    const mapped = mapOrderAdminRecord(order);
    console.log(`[Order Create] Returning order with ID: ${mapped.id}`);
    
    return NextResponse.json({ data: mapped }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    updateSchema.parse(await request.json());
    return NextResponse.json({ error: "Order updates are not enabled against live services" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}


