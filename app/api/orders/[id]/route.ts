import { NextResponse } from "next/server";

type Params = { params: { id: string } };

const ORDERS_SERVICE = process.env.ORDERS_SERVICE || 'http://localhost:4002';
const MASTER_DATA_SERVICE = process.env.MASTER_DATA_SERVICE || 'http://localhost:4001';

const baseDetail = {
  statusOptions: ["New", "Planning", "In Transit", "At Risk", "Delivered", "Exception"],
  booking: {
    guardrails: [
      "Driver must have valid CDL",
      "Unit must be inspected within 30 days",
      "Driver hours of service must be available",
    ],
    driverOptions: [] as any[],
    unitOptions: [] as any[],
  },
};

const detailById: Record<string, unknown> = {
  "ORD-10452": {
    id: "ORD-10452",
    reference: "XPO-4452",
    status: "In Transit",
    customer: "Apex Manufacturing",
    lane: "Dallas, TX → Atlanta, GA",
    laneMiles: 781,
    ageHours: 18,
    serviceLevel: "Premium",
    snapshot: {
      commodity: "Electronics",
      stops: [
        {
          id: "STP-1",
          type: "Pickup",
          location: "Apex DC, Dallas, TX",
          windowStart: "2024-05-08T05:00:00Z",
          windowEnd: "2024-05-08T09:00:00Z",
          instructions: "Pre-cool trailer to 36°F",
        },
        {
          id: "STP-2",
          type: "Delivery",
          location: "Retail Hub, Atlanta, GA",
          windowStart: "2024-05-09T17:00:00Z",
          windowEnd: "2024-05-09T20:00:00Z",
        },
      ],
      windows: [
        { label: "Pickup", value: "05:00-09:00" },
        { label: "Delivery", value: "17:00-20:00" },
      ],
      notes: "Customer requires POD upload within 2 hours of delivery.",
    },
    pricing: {
      items: [
        { label: "Linehaul", value: "$2,850" },
        { label: "Fuel Surcharge", value: "$320" },
        { label: "Accessorials", value: "$90", helper: "Liftgate" },
        { label: "Target Margin", value: "18%" },
      ],
      totals: { label: "Cost Basis", value: "$2,420", helper: "Revenue $3,260" },
    },
    booking: {
      ...baseDetail.booking,
      recommendedDriverId: "DRV-101",
      recommendedUnitId: "TRK-48",
      statusOptions: baseDetail.statusOptions,
    },
  },
  "ORD-10453": {
    id: "ORD-10453",
    reference: "BN-2140",
    status: "At Risk",
    customer: "Brightline Retail",
    lane: "Ontario, CA → Denver, CO",
    laneMiles: 1004,
    ageHours: 27,
    serviceLevel: "Standard",
    snapshot: {
      commodity: "Retail Fixtures",
      stops: [
        {
          id: "STP-1",
          type: "Pickup",
          location: "Brightline Consolidation, Ontario, CA",
          windowStart: "2024-05-08T07:00:00Z",
          windowEnd: "2024-05-08T11:00:00Z",
        },
        {
          id: "STP-2",
          type: "Delivery",
          location: "Regional Store, Denver, CO",
          windowStart: "2024-05-10T12:00:00Z",
          windowEnd: "2024-05-10T16:00:00Z",
          instructions: "Call store manager 30 minutes prior",
        },
      ],
      windows: [
        { label: "Pickup", value: "07:00-11:00" },
        { label: "Delivery", value: "12:00-16:00" },
      ],
      notes: "Delivery appointment confirmed; detention authorized up to 2 hours.",
    },
    pricing: {
      items: [
        { label: "Linehaul", value: "$3,740" },
        { label: "Fuel", value: "$410" },
        { label: "Accessorials", value: "$120", helper: "After-hours unload" },
        { label: "Target Margin", value: "16%" },
      ],
      totals: { label: "Cost Basis", value: "$3,230", helper: "Revenue $4,270" },
    },
    booking: {
      ...baseDetail.booking,
      recommendedDriverId: "DRV-204",
      recommendedUnitId: "TRK-67",
      statusOptions: baseDetail.statusOptions,
    },
  },
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    
    // Fetch order from database
    const orderResponse = await fetch(`${ORDERS_SERVICE}/api/orders/${id}`);
    if (!orderResponse.ok) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const order = await orderResponse.json();
    
    // Fetch drivers
    const driversResponse = await fetch(`${MASTER_DATA_SERVICE}/api/metadata/drivers`);
    const driversData = await driversResponse.json();
    const drivers = driversData.drivers || [];
    
    // Fetch units
    const unitsResponse = await fetch(`${MASTER_DATA_SERVICE}/api/metadata/units`);
    const unitsData = await unitsResponse.json();
    const units = unitsData.units || [];
    
    // Map database status to frontend status
    const statusMap: Record<string, string> = {
      'pending': 'New',
      'planning': 'Planning',
      'in_transit': 'In Transit',
      'at_risk': 'At Risk',
      'delivered': 'Delivered',
      'exception': 'Exception',
      'cancelled': 'Exception',
    };
    
    // Transform to frontend format
    const detail = {
      ...baseDetail,
      id: order.id,
      status: statusMap[order.status] || 'New',
      customer: order.customer_id,
      lane: `${order.pickup_location} → ${order.dropoff_location}`,
      laneMiles: 500, // Default, calculate based on route
      ageHours: Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60)),
      serviceLevel: "Standard",
      snapshot: {
        commodity: "General Freight",
        stops: [
          {
            id: "STP-1",
            type: "Pickup",
            location: order.pickup_location,
            windowStart: order.pickup_time || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            windowEnd: new Date(new Date(order.pickup_time || Date.now() + 24 * 60 * 60 * 1000).getTime() + 4 * 60 * 60 * 1000).toISOString(),
            instructions: "Standard pickup",
          },
          {
            id: "STP-2",
            type: "Delivery",
            location: order.dropoff_location,
            windowStart: new Date(new Date(order.pickup_time || Date.now() + 24 * 60 * 60 * 1000).getTime() + 24 * 60 * 60 * 1000).toISOString(),
            windowEnd: new Date(new Date(order.pickup_time || Date.now() + 24 * 60 * 60 * 1000).getTime() + 28 * 60 * 60 * 1000).toISOString(),
            instructions: "Standard delivery",
          },
        ],
        windows: [
          { label: "Pickup", value: new Date(order.pickup_time || Date.now()).toLocaleDateString() },
          { label: "Delivery", value: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString() },
        ],
        notes: order.special_instructions || "",
      },
      pricing: {
        items: [
          { label: "Linehaul", value: `$${((order.estimated_cost || 0) * 0.7).toFixed(2)}`, helper: "Base transportation cost" },
          { label: "Fuel Surcharge", value: `$${((order.estimated_cost || 0) * 0.2).toFixed(2)}`, helper: "Variable fuel cost" },
          { label: "Accessorials", value: `$${((order.estimated_cost || 0) * 0.1).toFixed(2)}`, helper: "Additional services" },
        ],
        totals: {
          label: "Total Cost",
          value: `$${(order.estimated_cost || 0).toFixed(2)}`,
          helper: "Estimated total cost for this shipment",
        },
      },
      booking: {
        ...baseDetail.booking,
        recommendedDriverId: drivers[0]?.driver_id,
        recommendedUnitId: units[0]?.unit_id,
        driverOptions: drivers.slice(0, 5).map((d: any) => ({
          id: d.driver_id,
          name: d.driver_name,
          status: d.is_active ? "Ready" : "Off Duty",
          hoursAvailable: 8,
        })),
        unitOptions: units.slice(0, 5).map((u: any) => ({
          id: u.unit_id,
          type: u.unit_number,
          status: u.is_active ? "Available" : "Maintenance",
          location: "Fleet Yard",
        })),
      },
    };
    
    return NextResponse.json(detail);
  } catch (error) {
    console.error('Error fetching order detail:', error);
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 });
  }
}
