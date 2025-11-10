import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    metrics: {
      activeOrders: 162,
      inTransit: 94,
      onTimePercent: 91.8,
      exceptions: 7,
    },
    serviceHealth: [
      { name: "EDI Ingest", status: "ok", message: "All connectors healthy" },
      { name: "Telematics", status: "warn", message: "Carrier ping latency elevated" },
      { name: "Pricing Engine", status: "ok", message: "Calculated 48 rates last hour" },
      { name: "Docs", status: "alert", message: "Label generation rerouted" },
    ],
    liveNetwork: {
      filterOptions: {
        dateRanges: ["Today", "Next 24 Hours", "Next 72 Hours"],
        customers: ["All", "Apex Manufacturing", "Brightline Retail", "Northwind"],
        lanes: ["DAL → ATL", "LAX → DEN", "ORD → MCI", "SEA → RNO"],
      },
      mapSummary: {
        hotspots: 3,
        dwellAlerts: 2,
      },
    },
    glance: {
      topLanes: [
        { lane: "DAL → ATL", orders: 14, onTimePercent: 96 },
        { lane: "LAX → DEN", orders: 11, onTimePercent: 92 },
        { lane: "ORD → MCI", orders: 9, onTimePercent: 88 },
      ],
      drivers: { available: 42, booked: 37 },
      units: { available: 28, down: 6 },
    },
  });
}
