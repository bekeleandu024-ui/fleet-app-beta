import { NextResponse } from "next/server";

const data = [
  { id: "EV-9001", name: "Driver Safety Incident", status: "Open", region: "South", updated: "2024-05-08T09:20:00Z" },
  { id: "EV-9002", name: "Customer SLA Breach", status: "Investigating", region: "West", updated: "2024-05-07T23:05:00Z" },
  { id: "EV-9003", name: "Asset Breakdown", status: "Resolved", region: "Midwest", updated: "2024-05-07T18:25:00Z" },
  { id: "EV-9004", name: "Carrier Compliance Audit", status: "Open", region: "Network", updated: "2024-05-06T14:55:00Z" },
];

export async function GET() {
  return NextResponse.json({
    filters: {
      regions: ["All", "South", "West", "Midwest", "Network"],
      statuses: ["Open", "Investigating", "Resolved"],
    },
    data,
  });
}
