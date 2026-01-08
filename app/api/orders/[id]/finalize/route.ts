import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * POST /api/orders/[id]/finalize
 * 
 * Finalize billing for an order (Stage 2 of Two-Stage Revenue Model)
 * 
 * This endpoint:
 * 1. Accepts accessorials to add to the order
 * 2. Calculates final_billable_amount = quoted_rate + sum(accessorials)
 * 3. Transitions billing_status from PENDING → AUDITED
 * 
 * Request Body:
 * {
 *   accessorials: [
 *     { type: "DETENTION", description: "2 hours at receiver", quantity: 2, unit_price: 75 },
 *     { type: "LUMPER", description: "Unloading fee", quantity: 1, unit_price: 50 }
 *   ],
 *   billing_notes: "POD verified, all charges confirmed",
 *   finalized_by: "john.doe@company.com"
 * }
 */

interface AccessorialInput {
  type: string;
  description?: string;
  quantity?: number;
  unit_price: number;
}

interface FinalizeRequest {
  accessorials?: AccessorialInput[];
  billing_notes?: string;
  finalized_by?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const client = await pool.connect();
  
  try {
    const body: FinalizeRequest = await request.json();
    const { accessorials = [], billing_notes, finalized_by } = body;
    
    await client.query("BEGIN");
    
    // 1. Get current order with quoted_rate
    const orderResult = await client.query(
      `SELECT id, order_number, quoted_rate, billing_status, final_billable_amount
       FROM orders WHERE id = $1`,
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }
    
    const order = orderResult.rows[0];
    
    // Check if already finalized
    if (order.billing_status === "AUDITED" || order.billing_status === "INVOICED" || order.billing_status === "PAID") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { 
          success: false, 
          error: `Order already finalized with status: ${order.billing_status}`,
          current_amount: order.final_billable_amount
        },
        { status: 400 }
      );
    }
    
    const quotedRate = parseFloat(order.quoted_rate) || 0;
    
    // 2. Insert accessorials and calculate total
    let accessorialTotal = 0;
    const insertedAccessorials = [];
    
    for (const acc of accessorials) {
      const quantity = acc.quantity || 1;
      const unitPrice = acc.unit_price || 0;
      const totalAmount = quantity * unitPrice;
      accessorialTotal += totalAmount;
      
      const accResult = await client.query(
        `INSERT INTO order_accessorials 
         (order_id, accessorial_code, accessorial_name, quantity, unit_price, total_price, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [orderId, acc.type || acc.code || 'OTHER', acc.description || acc.name || 'Accessorial', quantity, unitPrice, totalAmount, acc.notes || null]
      );
      
      insertedAccessorials.push(accResult.rows[0]);
    }
    
    // 3. Calculate final billable amount
    const finalBillableAmount = quotedRate + accessorialTotal;
    
    // 4. Update order with final amount and status
    await client.query(
      `UPDATE orders SET
         final_billable_amount = $1,
         billing_status = 'AUDITED',
         billing_notes = COALESCE($2, billing_notes),
         billing_finalized_at = NOW(),
         billing_finalized_by = $3
       WHERE id = $4`,
      [finalBillableAmount, billing_notes, finalized_by || null, orderId]
    );
    
    await client.query("COMMIT");
    
    return NextResponse.json({
      success: true,
      data: {
        order_id: orderId,
        order_number: order.order_number,
        quoted_rate: quotedRate,
        accessorial_total: accessorialTotal,
        final_billable_amount: finalBillableAmount,
        billing_status: "AUDITED",
        accessorials: insertedAccessorials,
        variance: accessorialTotal,
        variance_pct: quotedRate > 0 ? ((accessorialTotal / quotedRate) * 100).toFixed(2) : 0
      }
    });
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Finalize billing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to finalize billing" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/**
 * GET /api/orders/[id]/finalize
 * 
 * Get billing summary for an order including accessorials
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  
  try {
    // Get order billing info
    const orderResult = await pool.query(
      `SELECT 
         o.id, o.order_number, o.customer_name, o.quoted_rate, o.estimated_cost,
         o.billing_status, o.final_billable_amount, o.billing_notes,
         o.billing_finalized_at, o.billing_finalized_by,
         o.pickup_location, o.dropoff_location
       FROM orders o
       WHERE o.id = $1`,
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }
    
    const order = orderResult.rows[0];
    
    // Get existing accessorials
    const accessorialsResult = await pool.query(
      `SELECT * FROM order_accessorials WHERE order_id = $1 ORDER BY created_at`,
      [orderId]
    );
    
    const quotedRate = parseFloat(order.quoted_rate) || 0;
    const accessorialTotal = accessorialsResult.rows.reduce(
      (sum, acc) => sum + parseFloat(acc.total_amount || 0), 
      0
    );
    const finalAmount = order.final_billable_amount 
      ? parseFloat(order.final_billable_amount)
      : quotedRate + accessorialTotal;
    
    return NextResponse.json({
      success: true,
      data: {
        order_id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        pickup_location: order.pickup_location,
        dropoff_location: order.dropoff_location,
        quoted_rate: quotedRate,
        estimated_cost: parseFloat(order.estimated_cost) || 0,
        accessorials: accessorialsResult.rows,
        accessorial_total: accessorialTotal,
        final_billable_amount: finalAmount,
        billing_status: order.billing_status || "PENDING",
        billing_notes: order.billing_notes,
        billing_finalized_at: order.billing_finalized_at,
        billing_finalized_by: order.billing_finalized_by,
        variance: finalAmount - quotedRate,
        variance_pct: quotedRate > 0 ? (((finalAmount - quotedRate) / quotedRate) * 100).toFixed(2) : 0
      }
    });
    
  } catch (error) {
    console.error("Get billing summary error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get billing summary" },
      { status: 500 }
    );
  }
}
