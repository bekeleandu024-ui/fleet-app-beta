import { NextResponse } from "next/server";

type Params = { params: { id: string } };

const baseDetail = {
  statusOptions: ["New", "Planning", "In Transit", "At Risk", "Delivered", "Exception"],
  booking: {
    guardrails: [
      "Driver must have hazmat endorsement",
      "Team required for >650 miles",
      "Unit must support temperature control",
    ],
    driverOptions: [
      { id: "DRV-101", name: "S. Redding", status: "Ready", hoursAvailable: 9 },
      { id: "DRV-204", name: "J. McCall", status: "Ready", hoursAvailable: 7.5 },
      { id: "DRV-311", name: "N. Torres", status: "Booked", hoursAvailable: 3 },
    ],
    unitOptions: [
      { id: "TRK-48", type: "53' Reefer", status: "Available", location: "Dallas, TX" },
      { id: "TRK-67", type: "53' Dry Van", status: "Available", location: "Oklahoma City, OK" },
      { id: "TRK-09", type: "53' Reefer", status: "Maintenance", location: "Dallas, TX" },
    ],
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
  const { id } = await params;
  const detail = detailById[id] ?? detailById["ORD-10452"];
  return NextResponse.json(detail);
}
