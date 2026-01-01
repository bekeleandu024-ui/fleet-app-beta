import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/dispatch/orders/[id] - Fetch single order with full details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get main order with assignment info
    const orderResult = await pool.query(`
      SELECT 
        o.*,
        d.driver_name AS assigned_driver_name,
        d.driver_type AS assigned_driver_type,
        u.unit_number AS assigned_unit_number,
        u.unit_type AS assigned_unit_type,
        c.carrier_name AS awarded_carrier_name,
        c.mc_number AS awarded_carrier_mc,
        c.contact_phone AS awarded_carrier_phone,
        ab.bid_amount AS awarded_bid_amount
      FROM orders o
      LEFT JOIN driver_profiles d ON o.assigned_driver_id = d.driver_id
      LEFT JOIN unit_profiles u ON o.assigned_unit_id = u.unit_id
      LEFT JOIN carrier_profiles c ON o.awarded_carrier_id = c.id
      LEFT JOIN carrier_bids ab ON o.awarded_bid_id = ab.id
      WHERE o.id = $1
    `, [id]);

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderResult.rows[0];

    // Get stops
    const stopsResult = await pool.query(`
      SELECT * FROM order_stops 
      WHERE order_id = $1 
      ORDER BY stop_sequence ASC
    `, [id]);

    // Get freight items
    const freightResult = await pool.query(`
      SELECT * FROM order_freight_items 
      WHERE order_id = $1
    `, [id]);

    // Get references
    const refsResult = await pool.query(`
      SELECT * FROM order_references 
      WHERE order_id = $1
    `, [id]);

    // Get bids
    const bidsResult = await pool.query(`
      SELECT 
        b.*,
        c.mc_number,
        c.dot_number,
        c.rating AS carrier_rating
      FROM carrier_bids b
      LEFT JOIN carrier_profiles c ON b.carrier_id = c.id
      WHERE b.order_id = $1
      ORDER BY 
        CASE b.status WHEN 'PENDING' THEN 1 WHEN 'ACCEPTED' THEN 2 ELSE 3 END,
        b.bid_amount ASC
    `, [id]);

    // Get activity log
    const activityResult = await pool.query(`
      SELECT * FROM dispatch_actions 
      WHERE order_id = $1 
      ORDER BY performed_at DESC
      LIMIT 50
    `, [id]);

    // Build response
    const response = {
      id: order.id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      customerName: order.customer_name,
      status: order.status,
      dispatchStatus: order.dispatch_status || 'NEW',
      priority: order.priority,
      
      // Locations (legacy single pickup/dropoff)
      pickupLocation: order.pickup_location,
      dropoffLocation: order.dropoff_location,
      pickupTime: order.pickup_time,
      dropoffTime: order.dropoff_time,
      
      // Equipment
      equipmentType: order.equipment_type,
      equipmentLength: order.equipment_length,
      temperatureSetting: order.temperature_setting,
      
      // Freight totals
      totalWeightLbs: order.total_weight_lbs,
      totalPieces: order.total_pieces,
      totalPallets: order.total_pallets,
      totalCubicFeet: order.total_cubic_feet,
      totalLinearFeet: order.total_linear_feet,
      isHazmat: order.is_hazmat,
      isHighValue: order.is_high_value,
      declaredValue: order.declared_value,
      
      // Pricing
      quotedRate: parseFloat(order.quoted_rate) || null,
      estimatedCost: parseFloat(order.estimated_cost) || null,
      
      // Notes
      specialInstructions: order.special_instructions,
      internalNotes: order.internal_notes,
      
      // Dispatch info
      assignedDriverId: order.assigned_driver_id,
      assignedDriverName: order.assigned_driver_name,
      assignedDriverType: order.assigned_driver_type,
      assignedUnitId: order.assigned_unit_id,
      assignedUnitNumber: order.assigned_unit_number,
      assignedUnitType: order.assigned_unit_type,
      
      // Brokerage info
      postedToCarriers: order.posted_to_carriers || false,
      postedAt: order.posted_at,
      kickedToBrokerageAt: order.kicked_to_brokerage_at,
      kickReason: order.kick_reason,
      awardedCarrierId: order.awarded_carrier_id,
      awardedCarrierName: order.awarded_carrier_name,
      awardedCarrierMc: order.awarded_carrier_mc,
      awardedCarrierPhone: order.awarded_carrier_phone,
      awardedBidId: order.awarded_bid_id,
      awardedBidAmount: parseFloat(order.awarded_bid_amount) || null,
      
      // Timestamps
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      
      // Related data
      stops: stopsResult.rows.map(s => ({
        id: s.id,
        stopSequence: s.stop_sequence,
        stopType: s.stop_type,
        locationName: s.location_name,
        streetAddress: s.street_address,
        city: s.city,
        state: s.state,
        postalCode: s.postal_code,
        country: s.country,
        contactName: s.contact_name,
        contactPhone: s.contact_phone,
        appointmentStart: s.appointment_start,
        appointmentEnd: s.appointment_end,
        appointmentType: s.appointment_type,
        specialInstructions: s.special_instructions,
      })),
      
      freightItems: freightResult.rows.map(f => ({
        id: f.id,
        description: f.description,
        commodity: f.commodity,
        quantity: f.quantity,
        packagingType: f.packaging_type,
        pieces: f.pieces,
        weightLbs: f.weight_lbs,
        lengthIn: f.length_in,
        widthIn: f.width_in,
        heightIn: f.height_in,
        cubicFeet: f.cubic_feet,
        freightClass: f.freight_class,
        nmfcCode: f.nmfc_code,
        isHazmat: f.is_hazmat,
        isStackable: f.is_stackable,
      })),
      
      references: refsResult.rows.map(r => ({
        id: r.id,
        referenceType: r.reference_type,
        referenceValue: r.reference_value,
      })),
      
      bids: bidsResult.rows.map(b => ({
        id: b.id,
        carrierId: b.carrier_id,
        carrierName: b.carrier_name,
        mcNumber: b.mc_number,
        dotNumber: b.dot_number,
        carrierRating: b.carrier_rating,
        contactName: b.contact_name,
        contactPhone: b.contact_phone,
        contactEmail: b.contact_email,
        bidAmount: parseFloat(b.bid_amount),
        currency: b.currency,
        transitTimeHours: b.transit_time_hours,
        pickupAvailableAt: b.pickup_available_at,
        deliveryEta: b.delivery_eta,
        status: b.status,
        isLowestCost: b.is_lowest_cost,
        isFastest: b.is_fastest,
        receivedVia: b.received_via,
        receivedAt: b.received_at,
        expiresAt: b.expires_at,
        notes: b.notes,
      })),
      
      activityLog: activityResult.rows.map(a => ({
        id: a.id,
        actionType: a.action_type,
        performedBy: a.performed_by,
        performedAt: a.performed_at,
        notes: a.notes,
        previousStatus: a.previous_status,
        newStatus: a.new_status,
      })),
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
