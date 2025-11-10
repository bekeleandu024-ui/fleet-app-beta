import { NextResponse } from "next/server";

const data = [
  { id: "TRK-48", name: "TRK-48", status: "Available", region: "South", updated: "2024-05-08T06:00:00Z" },
  { id: "TRK-67", name: "TRK-67", status: "Available", region: "West", updated: "2024-05-08T08:05:00Z" },
  { id: "TRK-09", name: "TRK-09", status: "Maintenance", region: "South", updated: "2024-05-08T02:45:00Z" },
  { id: "TRK-33", name: "TRK-33", status: "Available", region: "Mountain", updated: "2024-05-07T20:10:00Z" },
];

export async function GET() {
  return NextResponse.json({
    filters: {
      regions: ["All", "South", "West", "Mountain"],
      statuses: ["Available", "Maintenance", "Out of Service"],
    },
    data,
  });
}
