import { NextRequest, NextResponse } from "next/server";
import { serviceFetch } from "@/lib/service-client";

// Event type to status transition mapping
const STATUS_TRANSITIONS: Record<string, string> = {
  TRIP_START: "in_transit",
  LEFT_DELIVERY: "completed",
  TRIP_FINISHED: "completed",
};

// GET /api/trip-events?tripId=xxx - Fetch events for a trip
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    // Fetch events from tracking service
    const query = tripId ? `?tripId=${tripId}` : "";
    const eventsResponse = await serviceFetch<{ events: any[] }>("tracking", `/trip-events${query}`);
    
    // Fetch all trips to enrich event data
    // In a real production app, we might want to optimize this or do a join in the backend
    const tripsResponse = await serviceFetch<any>("tracking", "/api/trips");
    const allTrips = Array.isArray(tripsResponse) ? tripsResponse : (tripsResponse?.value || []);

    // Normalize and enrich events
    const enrichedEvents = (eventsResponse.events || []).map((event: any) => {
      // Handle snake_case from backend
      const normalizedEvent = {
        ...event,
        tripId: event.tripId || event.trip_id,
        eventType: event.eventType || event.event_type,
        timestamp: event.timestamp || event.occurred_at || event.created_at,
        stopLabel: event.stopLabel || event.event_label || event.event_type, // Fallback
        notes: event.notes || (event.payload ? event.payload.note : undefined),
      };

      // Attach trip details
      const trip = allTrips.find((t: any) => t.id === normalizedEvent.tripId);
      
      return {
        ...normalizedEvent,
        trip: trip ? {
          ...trip,
          driver: trip.driver_name || "Unknown Driver", // Map backend fields if needed
          unit: trip.unit_number || "Unknown Unit",
        } : undefined
      };
    });

    return NextResponse.json({ events: enrichedEvents });
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
    const createdEvent = await serviceFetch<any>("tracking", "/trip-events", {
      method: "POST",
      body: eventPayload,
    });

    // Check if this event triggers a status transition
    const newStatus = STATUS_TRANSITIONS[eventType];
    if (newStatus) {
      // Update trip status
      try {
        // Update trip status in tracking service (where trips are managed in demo data)
        await serviceFetch("tracking", `/api/trips/${tripId}`, {
            method: "PATCH",
            body: {
              status: newStatus,
              lastEvent: eventType,
              lastEventTime: eventPayload.timestamp,
            }
        });

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

