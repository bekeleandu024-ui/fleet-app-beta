import { NextResponse } from "next/server";

const data = [
  { id: "DRV-101", name: "S. Redding", status: "Ready", region: "South", updated: "2024-05-08T06:10:00Z" },
  { id: "DRV-204", name: "J. McCall", status: "Ready", region: "West", updated: "2024-05-08T08:40:00Z" },
  { id: "DRV-311", name: "N. Torres", status: "Booked", region: "Central", updated: "2024-05-08T05:55:00Z" },
  { id: "DRV-128", name: "P. Hooper", status: "Off Duty", region: "South", updated: "2024-05-07T21:15:00Z" },
];

export async function GET() {
  return NextResponse.json({
    filters: {
      regions: ["All", "South", "West", "Central", "East"],
      statuses: ["Ready", "Booked", "Off Duty", "Leave"],
    },
    data,
  });
}
