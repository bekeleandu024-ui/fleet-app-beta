import { NextResponse } from "next/server";

type Params = { params: { id: string } };

const timeline = [
  {
    id: "evt-1",
    timestamp: "2024-05-08T05:30:00Z",
    summary: "Departed origin",
    location: "Dallas, TX",
    status: "Complete",
  },
  {
    id: "evt-2",
    timestamp: "2024-05-08T16:20:00Z",
    summary: "Fuel and compliance check",
    location: "Little Rock, AR",
    status: "Complete",
  },
  {
    id: "evt-3",
    timestamp: "2024-05-09T01:05:00Z",
    summary: "Driver swap",
    location: "Birmingham, AL",
    status: "Complete",
  },
  {
    id: "evt-4",
    timestamp: "2024-05-09T18:30:00Z",
    summary: "ETA at delivery",
    location: "Atlanta, GA",
    status: "Projected",
  },
];

const exceptions = [
  {
    id: "exc-1",
    type: "Weather",
    severity: "warn",
    opened: "2024-05-08T13:00:00Z",
    owner: "Network Ops",
    notes: "Heavy rain expected through Chattanooga corridor."
  },
];

const breadcrumb = [
  { id: "ping-1", timestamp: "2024-05-08T20:10:00Z", speed: 62, location: "Tuscaloosa, AL" },
  { id: "ping-2", timestamp: "2024-05-08T21:10:00Z", speed: 58, location: "Birmingham, AL" },
  { id: "ping-3", timestamp: "2024-05-08T22:10:00Z", speed: 60, location: "Anniston, AL" },
];

const detail = {
  id: "TRP-9001",
  tripNumber: "TRP-9001",
  status: "On Time",
  driver: "S. Redding",
  unit: "TRK-48",
  eta: "2024-05-09T18:30:00Z",
  timeline,
  exceptions,
  telemetry: {
    lastPing: "2024-05-08T22:10:00Z",
    breadcrumb,
  },
  notes: [
    {
      id: "note-1",
      author: "M. Chen",
      timestamp: "2024-05-08T06:10:00Z",
      body: "Driver confirmed trailer sealed and temperature holding at 36°F.",
    },
    {
      id: "note-2",
      author: "Network Ops",
      timestamp: "2024-05-08T14:45:00Z",
      body: "Adjusted ETA after weather hold west of Memphis.",
    },
  ],
  attachments: [
    { id: "doc-1", name: "BOL-ORD-10452.pdf", size: "184 KB" },
    { id: "doc-2", name: "TempLog-TRP-9001.csv", size: "92 KB" },
  ],
};

export async function GET(_request: Request, { params }: Params) {
  const response = params.id === "TRP-9002"
    ? {
        ...detail,
        id: "TRP-9002",
        tripNumber: "TRP-9002",
        status: "Running Late",
        driver: "J. McCall",
        unit: "TRK-67",
        eta: "2024-05-10T14:00:00Z",
        exceptions: [
          ...exceptions,
          {
            id: "exc-2",
            type: "Mechanical",
            severity: "alert",
            opened: "2024-05-08T20:00:00Z",
            owner: "Maintenance",
            notes: "Turbo underboost fault cleared after reset; monitoring."
          },
        ],
      }
    : detail;

  return NextResponse.json(response);
}
