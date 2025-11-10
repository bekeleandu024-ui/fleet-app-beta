import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    form: {
      miles: 781,
      revenue: 3260,
      origin: "Dallas, TX",
      destination: "Atlanta, GA",
      orderType: "Full Truckload",
      roundTrip: false,
      borderCrossings: 0,
      deadheadMiles: 42,
      pickups: 1,
      deliveries: 1,
      driver: "S. Redding",
      unit: "53' Reefer",
    },
    breakdown: {
      sections: [
        {
          title: "Fixed",
          items: [
            { label: "Insurance", value: "$180" },
            { label: "Plates & Permits", value: "$36" },
          ],
        },
        {
          title: "Wage",
          items: [
            { label: "Base Pay", value: "$620" },
            { label: "Team Premium", value: "$120" },
            { label: "Per Diem", value: "$75" },
          ],
        },
        {
          title: "Rolling",
          items: [
            { label: "Fuel", value: "$820", helper: "6.5 MPG @ $3.90" },
            { label: "Maintenance", value: "$165" },
            { label: "Tires", value: "$90" },
          ],
        },
        {
          title: "Accessorials",
          items: [
            { label: "Liftgate", value: "$90" },
            { label: "After-hours", value: "$60" },
          ],
        },
      ],
      totalLabel: "Total Cost",
      totalValue: "$2,256",
    },
    targets: {
      recommendedRPM: "$4.18",
      revenue: "$3,260",
      breakEven: "$2.89",
    },
    drivers: ["S. Redding", "J. McCall", "N. Torres", "P. Hooper"],
    units: ["53' Reefer", "53' Dry Van", "48' Flat"],
    orderTypes: ["Full Truckload", "Partial", "Recovery", "Dedicated"],
  });
}
