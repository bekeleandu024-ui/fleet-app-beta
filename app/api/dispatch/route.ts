import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    qualifiedOrders: [
      {
        id: "ORD-10452",
        reference: "XPO-4452",
        customer: "Apex Manufacturing",
        lane: "DAL → ATL",
        pickupWindow: "05:00-09:00",
        deliveryWindow: "17:00-20:00",
        miles: 781,
        status: "In Transit",
        priority: "High",
      },
      {
        id: "ORD-10453",
        reference: "BN-2140",
        customer: "Brightline Retail",
        lane: "ONT → DEN",
        pickupWindow: "07:00-11:00",
        deliveryWindow: "12:00-16:00",
        miles: 1004,
        status: "At Risk",
        priority: "Critical",
      },
      {
        id: "ORD-10454",
        reference: "NW-8821",
        customer: "Northwind",
        lane: "ORD → MCI",
        pickupWindow: "12:00-16:00",
        deliveryWindow: "Next Day",
        miles: 531,
        status: "Planning",
        priority: "Standard",
      },
      {
        id: "ORD-10455",
        reference: "ST-2219",
        customer: "Summit Tech",
        lane: "SEA → RNO",
        pickupWindow: "06:00-12:00",
        deliveryWindow: "18:00-22:00",
        miles: 712,
        status: "In Transit",
        priority: "High",
      },
    ],
    recommendation: {
      title: "Recommended pairing",
      description: "Driver and equipment matched against guardrails and current compliance windows.",
      bullets: [
        "DRV-101 meets hazmat and hours requirements",
        "TRK-48 pre-cooled and staged at Dallas yard",
        "Consider split load if dwell exceeds 90 minutes",
      ],
    },
    filters: {
      lanes: ["DAL → ATL", "ONT → DEN", "ORD → MCI", "SEA → RNO"],
      priorities: ["Critical", "High", "Standard"],
    },
    tripForm: {
      tripTypes: ["Full Truckload", "Partial", "Recovery"],
      rateUnits: ["Per Mile", "Flat", "Hourly"],
    },
    crew: {
      drivers: [
        { id: "DRV-101", name: "S. Redding", status: "Ready", hoursAvailable: 9 },
        { id: "DRV-204", name: "J. McCall", status: "Ready", hoursAvailable: 7.5 },
        { id: "DRV-311", name: "N. Torres", status: "Booked", hoursAvailable: 3 },
        { id: "DRV-128", name: "P. Hooper", status: "Off Duty", hoursAvailable: 11 },
      ],
      units: [
        { id: "TRK-48", type: "53' Reefer", status: "Available", location: "Dallas, TX" },
        { id: "TRK-67", type: "53' Dry Van", status: "Available", location: "Oklahoma City, OK" },
        { id: "TRK-09", type: "53' Reefer", status: "Maintenance", location: "Dallas, TX" },
        { id: "TRK-33", type: "48' Flat", status: "Available", location: "Denver, CO" },
      ],
    },
  });
}
