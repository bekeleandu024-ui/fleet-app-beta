import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { enterpriseOrderInputSchema, type EnterpriseOrderInput } from "@/lib/schemas/enterprise-order";

/**
 * POST /api/admin/orders/enterprise
 * Create a new enterprise order with multi-stop, freight items, references, and billing
 */
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = enterpriseOrderInputSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed", 
          details: validationResult.error.flatten() 
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Begin transaction
    await client.query("BEGIN");
    
    // 1. Generate order number
    const orderNumResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS BIGINT)), 10000) + 1 as next_num 
       FROM orders WHERE order_number LIKE 'ORD-%'`
    );
    const orderNumber = `ORD-${orderNumResult.rows[0].next_num}`;
    
    // 2. Get first pickup and last delivery for legacy fields
    const pickups = data.stops.filter(s => s.stopType === "pickup");
    const deliveries = data.stops.filter(s => s.stopType === "delivery");
    const firstPickup = pickups[0];
    const lastDelivery = deliveries[deliveries.length - 1];
    
    const pickupLocation = firstPickup 
      ? `${firstPickup.city}${firstPickup.state ? ', ' + firstPickup.state : ''}`
      : '';
    const deliveryLocation = lastDelivery
      ? `${lastDelivery.city}${lastDelivery.state ? ', ' + lastDelivery.state : ''}`
      : '';
    
    // 3. Create main order record
    // dispatch_status = 'NEW' means it will appear in Fleet Ops on the Dispatch Command Center
    const orderResult = await client.query(
      `INSERT INTO orders (
        order_number, customer_id, status, order_type, dispatch_status,
        pickup_location, dropoff_location,
        pickup_time, dropoff_time,
        equipment_type, equipment_length, temperature_setting,
        total_weight_lbs, total_pieces, total_pallets, total_cubic_feet, total_linear_feet,
        is_hazmat, is_high_value, declared_value,
        special_instructions, internal_notes,
        priority, source_channel
      ) VALUES ($1, $2, $3, 'round_trip', 'NEW', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        orderNumber,
        data.customerId || null,
        data.status,
        pickupLocation,
        deliveryLocation,
        firstPickup?.appointmentStart || null,
        lastDelivery?.appointmentStart || null,
        data.equipmentType,
        data.equipmentLength,
        data.temperatureSetting || null,
        data.totalWeightLbs || null,
        data.totalPieces || null,
        data.totalPallets || null,
        data.totalCubicFeet || null,
        data.totalLinearFeet || null,
        data.isHazmat,
        data.isHighValue,
        data.declaredValue || null,
        data.specialInstructions || null,
        data.internalNotes || null,
        data.priority,
        data.sourceChannel,
      ]
    );
    
    const orderId = orderResult.rows[0].id;
    
    // 4. Insert stops
    for (let i = 0; i < data.stops.length; i++) {
      const stop = data.stops[i];
      await client.query(
        `INSERT INTO order_stops (
          order_id, stop_sequence, stop_type,
          location_name, street_address, city, state, postal_code, country,
          latitude, longitude,
          appointment_type, appointment_start, appointment_end,
          contact_name, contact_phone, contact_email,
          special_instructions, driver_instructions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          orderId,
          i,
          stop.stopType,
          stop.locationName || null,
          stop.streetAddress || null,
          stop.city,
          stop.state || null,
          stop.postalCode || null,
          stop.country,
          stop.latitude || null,
          stop.longitude || null,
          stop.appointmentType,
          stop.appointmentStart || null,
          stop.appointmentEnd || null,
          stop.contactName || null,
          stop.contactPhone || null,
          stop.contactEmail || null,
          stop.specialInstructions || null,
          stop.driverInstructions || null,
        ]
      );
    }
    
    // 5. Insert freight items
    for (let i = 0; i < data.freightItems.length; i++) {
      const item = data.freightItems[i];
      await client.query(
        `INSERT INTO order_freight_items (
          order_id, line_number,
          commodity, description,
          quantity, pieces, packaging_type,
          weight_lbs, length_in, width_in, height_in, cubic_feet,
          freight_class, nmfc_code,
          is_hazmat, hazmat_class, hazmat_un_number, hazmat_packing_group, hazmat_proper_name,
          stackable, temperature_controlled, temp_min_f, temp_max_f,
          declared_value, currency
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`,
        [
          orderId,
          i + 1,
          item.commodity,
          item.description || null,
          item.quantity,
          item.pieces,
          item.packagingType,
          item.weightLbs || null,
          item.lengthIn || null,
          item.widthIn || null,
          item.heightIn || null,
          item.cubicFeet || null,
          item.freightClass || null,
          item.nmfcCode || null,
          item.isHazmat,
          item.hazmatClass || null,
          item.hazmatUnNumber || null,
          item.hazmatPackingGroup || null,
          item.hazmatProperName || null,
          item.stackable,
          item.temperatureControlled,
          item.tempMinF || null,
          item.tempMaxF || null,
          item.declaredValue || null,
          item.currency,
        ]
      );
    }
    
    // 6. Insert references
    for (const ref of data.references) {
      await client.query(
        `INSERT INTO order_references (order_id, reference_type, reference_value, description)
         VALUES ($1, $2, $3, $4)`,
        [orderId, ref.referenceType, ref.referenceValue, ref.description || null]
      );
    }
    
    // 7. Insert billing
    await client.query(
      `INSERT INTO order_billing (
        order_id, bill_to_type, bill_to_customer_id, bill_to_name, bill_to_address, bill_to_email,
        payment_terms, invoice_method, require_pod, require_bol
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        orderId,
        data.billing.billToType,
        data.billing.billToCustomerId || null,
        data.billing.billToName || null,
        data.billing.billToAddress || null,
        data.billing.billToEmail || null,
        data.billing.paymentTerms,
        data.billing.invoiceMethod,
        data.billing.requirePod,
        data.billing.requireBol,
      ]
    );
    
    // 8. Insert accessorials
    for (const acc of data.accessorials) {
      await client.query(
        `INSERT INTO order_accessorials (order_id, accessorial_code, accessorial_name, quantity, unit_price, notes)
         SELECT $1, $2::varchar, at.name, $3, COALESCE($4, at.default_price), $5
         FROM accessorial_types at WHERE at.code = $2::varchar`,
        [orderId, acc.accessorialCode, acc.quantity, acc.unitPrice || null, acc.notes || null]
      );
    }
    
    // Commit transaction
    await client.query("COMMIT");
    
    // Return created order with all details
    const fullOrder = await getEnterpriseOrder(client, orderId);
    
    return NextResponse.json({
      success: true,
      data: fullOrder,
    });
    
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Error creating enterprise order:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/**
 * Helper to fetch full enterprise order with all related data
 */
async function getEnterpriseOrder(client: any, orderId: string) {
  const orderResult = await client.query(
    `SELECT * FROM orders WHERE id = $1`,
    [orderId]
  );
  
  const stopsResult = await client.query(
    `SELECT * FROM order_stops WHERE order_id = $1 ORDER BY stop_sequence`,
    [orderId]
  );
  
  const itemsResult = await client.query(
    `SELECT * FROM order_freight_items WHERE order_id = $1 ORDER BY line_number`,
    [orderId]
  );
  
  const refsResult = await client.query(
    `SELECT * FROM order_references WHERE order_id = $1`,
    [orderId]
  );
  
  const billingResult = await client.query(
    `SELECT * FROM order_billing WHERE order_id = $1`,
    [orderId]
  );
  
  const accessorialsResult = await client.query(
    `SELECT * FROM order_accessorials WHERE order_id = $1`,
    [orderId]
  );
  
  return {
    ...orderResult.rows[0],
    stops: stopsResult.rows,
    freightItems: itemsResult.rows,
    references: refsResult.rows,
    billing: billingResult.rows[0] || null,
    accessorials: accessorialsResult.rows,
  };
}
