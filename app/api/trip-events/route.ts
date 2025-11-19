import { NextResponse } from "next/server";

// Mock trip events data
const mockEvents = [
  {
    id: "evt1",
    tripId: "trip1",
    eventType: "TRIP_START",
    at: new Date(Date.now() - 3600000).toISOString(),
    stopLabel: "Windsor Terminal",
    notes: "Loaded and ready to depart",
    lat: 42.3149,
    lon: -83.0364,
    trip: {
      id: "trip1",
      driver: "Adrian Radu",
      unit: "T-1024",
      status: "In Transit",
      origin: "Windsor, ON",
      destination: "Buffalo, NY",
    },
  },
  {
    id: "evt2",
    tripId: "trip1",
    eventType: "CROSSED_BORDER",
    at: new Date(Date.now() - 2700000).toISOString(),
    stopLabel: "Ambassador Bridge",
    notes: "Cleared customs in 15 minutes",
    lat: 42.3086,
    lon: -83.0795,
    trip: {
      id: "trip1",
      driver: "Adrian Radu",
      unit: "T-1024",
      status: "In Transit",
      origin: "Windsor, ON",
      destination: "Buffalo, NY",
    },
  },
  {
    id: "evt3",
    tripId: "trip2",
    eventType: "ARRIVED_DELIVERY",
    at: new Date(Date.now() - 1800000).toISOString(),
    stopLabel: "Detroit Distribution Center",
    notes: "Dock 12 assigned",
    lat: 42.3314,
    lon: -83.0458,
    trip: {
      id: "trip2",
      driver: "Carlos Mendez",
      unit: "T-1025",
      status: "At Delivery",
      origin: "Toronto, ON",
      destination: "Detroit, MI",
    },
  },
  {
    id: "evt4",
    tripId: "trip2",
    eventType: "LEFT_DELIVERY",
    at: new Date(Date.now() - 900000).toISOString(),
    stopLabel: "Detroit Distribution Center",
    notes: "Unloaded successfully, POD signed",
    lat: 42.3314,
    lon: -83.0458,
    trip: {
      id: "trip2",
      driver: "Carlos Mendez",
      unit: "T-1025",
      status: "Completed",
      origin: "Toronto, ON",
      destination: "Detroit, MI",
    },
  },
  {
    id: "evt5",
    tripId: "trip2",
    eventType: "TRIP_FINISHED",
    at: new Date(Date.now() - 600000).toISOString(),
    stopLabel: "Detroit Distribution Center",
    notes: "Trip completed, awaiting next assignment",
    lat: 42.3314,
    lon: -83.0458,
    trip: {
      id: "trip2",
      driver: "Carlos Mendez",
      unit: "T-1025",
      status: "Completed",
      origin: "Toronto, ON",
      destination: "Detroit, MI",
    },
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get("tripId");
  const driver = searchParams.get("driver");
  const unit = searchParams.get("unit");
  const eventType = searchParams.get("eventType");

  let events = [...mockEvents];

  // Apply filters
  if (tripId) {
    events = events.filter(e => e.tripId === tripId);
  }

  if (driver) {
    events = events.filter(e => e.trip.driver.toLowerCase().includes(driver.toLowerCase()));
  }

  if (unit) {
    events = events.filter(e => e.trip.unit.toLowerCase().includes(unit.toLowerCase()));
  }

  if (eventType) {
    events = events.filter(e => e.eventType === eventType);
  }

  // Sort by most recent first
  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return NextResponse.json({ events });
}
