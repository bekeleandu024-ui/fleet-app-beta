import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/dispatch/orders/[id]/bids - Get all bids for an order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT 
        id,
        order_id,
        carrier_id,
        carrier_name,
        contact_name,
        contact_phone,
        contact_email,
        mc_number,
        bid_amount,
        currency,
        transit_time_hours,
        pickup_available_at,
        delivery_eta,
        status,
        is_lowest_cost,
        is_fastest,
        received_via,
        received_at,
        expires_at,
        notes
      FROM carrier_bids
      WHERE order_id = $1
      ORDER BY 
        CASE status WHEN 'PENDING' THEN 1 WHEN 'ACCEPTED' THEN 2 ELSE 3 END,
        bid_amount ASC`,
      [id]
    );

    const bids = result.rows.map(row => ({
      id: row.id,
      orderId: row.order_id,
      carrierId: row.carrier_id,
      carrierName: row.carrier_name,
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      contactEmail: row.contact_email,
      mcNumber: row.mc_number,
      bidAmount: parseFloat(row.bid_amount),
      currency: row.currency,
      transitTimeHours: row.transit_time_hours,
      pickupAvailableAt: row.pickup_available_at,
      deliveryEta: row.delivery_eta,
      status: row.status,
      isLowestCost: row.is_lowest_cost,
      isFastest: row.is_fastest,
      receivedVia: row.received_via,
      receivedAt: row.received_at,
      expiresAt: row.expires_at,
      notes: row.notes,
    }));

    return NextResponse.json({ success: true, data: bids });
  } catch (error) {
    console.error('Error fetching bids:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}

// POST /api/dispatch/orders/[id]/bids - Add a new bid
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      carrierId,
      carrierName,
      contactName,
      contactPhone,
      contactEmail,
      mcNumber,
      bidAmount,
      currency = 'USD',
      transitTimeHours,
      pickupAvailableAt,
      deliveryEta,
      receivedVia = 'MANUAL',
      expiresAt,
      notes,
    } = body;

    if (!carrierName || !bidAmount) {
      return NextResponse.json(
        { success: false, error: 'Carrier name and bid amount are required' },
        { status: 400 }
      );
    }

    // Insert the bid
    const result = await pool.query(
      `INSERT INTO carrier_bids (
        order_id, carrier_id, carrier_name, contact_name, contact_phone,
        contact_email, mc_number, bid_amount, currency, transit_time_hours,
        pickup_available_at, delivery_eta, received_via, expires_at, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        id, carrierId, carrierName, contactName, contactPhone,
        contactEmail, mcNumber, bidAmount, currency, transitTimeHours,
        pickupAvailableAt, deliveryEta, receivedVia, expiresAt, notes
      ]
    );

    // Log the action
    await pool.query(
      `INSERT INTO dispatch_actions (order_id, action_type, performed_by, notes)
       VALUES ($1, 'RECEIVE_BID', 'SYSTEM', $2)`,
      [id, `Received bid from ${carrierName}: $${bidAmount}`]
    );

    return NextResponse.json({ success: true, data: { id: result.rows[0].id } });
  } catch (error) {
    console.error('Error adding bid:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add bid' },
      { status: 500 }
    );
  }
}
