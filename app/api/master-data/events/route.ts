import { NextResponse } from "next/server";

import { serviceFetch } from "@/lib/service-client";

type EventRecord = {
  id: string;
  name: string;
  status: string;
  region: string;
  severity: string;
  updated: string;
};

export async function GET() {
  try {
    const payload = await serviceFetch<{ events?: Array<Record<string, any>> }>("masterData", "/api/metadata/events");
    const events = transformEvents(payload.events ?? []);
    return NextResponse.json(buildEventResponse(events));
  } catch (error) {
    console.error("Error fetching events from service", error);
    return NextResponse.json(buildEventResponse([]));
  }
}

function transformEvents(records: Array<Record<string, any>>): EventRecord[] {
  return records.map((record, index) => {
    const rawId = record.event_id ?? record.id ?? record.event_name ?? record.name;
    const id = rawId && String(rawId).trim() !== "" ? String(rawId) : `event-${index}`;

    return {
      id,
      name: record.event_name ?? record.name ?? "Event",
      status: record.status ?? "Open",
      region: record.region ?? "Network",
      severity: record.severity ?? "Low",
      updated: new Date(record.updated_at ?? Date.now()).toISOString(),
    };
  });
}

function buildEventResponse(events: EventRecord[]) {
  const regions = Array.from(new Set(events.map((event) => event.region))).sort();
  const statuses = Array.from(new Set(events.map((event) => event.status))).sort();

  return {
    filters: {
      regions: ["All", ...regions],
      statuses,
    },
    data: events,
  };
}
