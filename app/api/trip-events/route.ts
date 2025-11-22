import { NextRequest, NextResponse } from "next/server";

// Event type to status transition mapping
const STATUS_TRANSITIONS: Record<string, string> = {
  TRIP_START: "In Progress",
  LEFT_DELIVERY: "Completed",
  TRIP_FINISHED: "Completed",
};

// GET /api/trip-events?tripId=xxx - Fetch events for a trip
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ error: "tripId is required" }, { status: 400 });
    }

    // Fetch events from tracking service
    const response = await fetch(
      `${process.env.TRACKING_SERVICE_URL || "http://localhost:4004"}/trip-events?tripId=${tripId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch trip events");
    }

    const events = await response.json();

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching trip events:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip events" },
      { status: 500 }
    );
  }
}

// POST /api/trip-events - Create a new trip event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, eventType, eventLabel, location, coordinates, notes, actor, actorType } = body;

    if (!tripId || !eventType || !eventLabel) {
      return NextResponse.json(
        { error: "tripId, eventType, and eventLabel are required" },
        { status: 400 }
      );
    }

    // Create event payload
    const eventPayload = {
      tripId,
      eventType,
      eventLabel,
      location: location || null,
      coordinates: coordinates || null,
      notes: notes || null,
      actor: actor || "System",
      actorType: actorType || "SYSTEM",
      timestamp: new Date().toISOString(),
    };

    // Send to tracking service
    const trackingResponse = await fetch(
      `${process.env.TRACKING_SERVICE_URL || "http://localhost:4004"}/trip-events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      }
    );

    if (!trackingResponse.ok) {
      throw new Error("Failed to create trip event");
    }

    const createdEvent = await trackingResponse.json();

    // Check if this event triggers a status transition
    const newStatus = STATUS_TRANSITIONS[eventType];
    if (newStatus) {
      // Update trip status
      try {
        await fetch(
          `${process.env.ORDERS_SERVICE_URL || "http://localhost:4002"}/trips/${tripId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: newStatus,
              lastEvent: eventType,
              lastEventTime: eventPayload.timestamp,
            }),
          }
        );
      } catch (statusError) {
        console.error("Failed to update trip status:", statusError);
        // Continue even if status update fails
      }
    }

    return NextResponse.json({
      success: true,
      event: createdEvent,
      statusChanged: !!newStatus,
      newStatus: newStatus || null,
    });
  } catch (error) {
    console.error("Error creating trip event:", error);
    return NextResponse.json(
      { error: "Failed to create trip event" },
      { status: 500 }
    );
  }
}

