import { NextResponse } from "next/server";

import { listEvents } from "@/lib/mock-data-store";

export async function GET() {
  const events = listEvents();
  const regions = Array.from(new Set(events.map((event) => event.region))).sort();
  const statuses = Array.from(new Set(events.map((event) => event.status))).sort();

  return NextResponse.json({
    filters: {
      regions: ["All", ...regions],
      statuses,
    },
    data: events,
  });
}
