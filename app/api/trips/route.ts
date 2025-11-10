import { NextResponse } from "next/server";

const trips = [
  {
    id: "TRP-9001",
    tripNumber: "TRP-9001",
    driver: "S. Redding",
    unit: "TRK-48",
    pickup: "Dallas, TX",
    delivery: "Atlanta, GA",
    eta: "2024-05-09T18:30:00Z",
    status: "On Time",
    exceptions: 0,
    lastPing: "2024-05-08T22:10:00Z",
  },
  {
    id: "TRP-9002",
    tripNumber: "TRP-9002",
    driver: "J. McCall",
    unit: "TRK-67",
    pickup: "Ontario, CA",
    delivery: "Denver, CO",
    eta: "2024-05-10T14:00:00Z",
    status: "Running Late",
    exceptions: 2,
    lastPing: "2024-05-08T21:55:00Z",
  },
  {
    id: "TRP-9003",
    tripNumber: "TRP-9003",
    driver: "N. Torres",
    unit: "TRK-33",
    pickup: "Chicago, IL",
    delivery: "Kansas City, MO",
    eta: "2024-05-09T04:30:00Z",
    status: "On Time",
    exceptions: 0,
    lastPing: "2024-05-08T23:05:00Z",
  },
  {
    id: "TRP-9004",
    tripNumber: "TRP-9004",
    driver: "P. Hooper",
    unit: "TRK-09",
    pickup: "Seattle, WA",
    delivery: "Reno, NV",
    eta: "2024-05-10T02:45:00Z",
    status: "Exception",
    exceptions: 1,
    lastPing: "2024-05-08T20:40:00Z",
  },
];

export async function GET() {
  return NextResponse.json({
    stats: {
      active: trips.length,
      late: trips.filter((trip) => trip.status === "Running Late").length,
      exception: trips.filter((trip) => trip.status === "Exception").length,
    },
    filters: {
      statuses: ["On Time", "Running Late", "Exception", "Delivered"],
      exceptions: ["Weather", "Mechanical", "Customer Hold"],
      dateRanges: ["Today", "48 Hours", "7 Days"],
    },
    data: trips,
  });
}
