import { NextResponse } from "next/server";

const data = [
  { id: "RL-001", name: "Temperature Compliance", status: "Active", region: "Network", updated: "2024-05-08T04:30:00Z" },
  { id: "RL-014", name: "Team Required > 900mi", status: "Active", region: "Network", updated: "2024-05-07T18:12:00Z" },
  { id: "RL-022", name: "Hazmat Corridor Restrictions", status: "Draft", region: "Southeast", updated: "2024-05-06T15:40:00Z" },
  { id: "RL-037", name: "Customer dwell SLA", status: "Active", region: "Midwest", updated: "2024-05-08T07:15:00Z" },
];

export async function GET() {
  return NextResponse.json({
    filters: {
      regions: ["All", "Network", "Southeast", "Midwest"],
      statuses: ["Active", "Draft", "Deprecated"],
    },
    data,
  });
}
