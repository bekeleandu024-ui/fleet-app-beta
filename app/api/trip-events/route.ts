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
    
    // Parallel fetch for events, trips, drivers, and units
    const [eventsResponse, tripsResponse, driversResult, unitsResult] = await Promise.all([
      serviceFetch<{ events: any[] }>("tracking", `/trip-events${query}`),
      serviceFetch<any>("tracking", "/api/trips"),
      serviceFetch<{ drivers?: Array<Record<string, any>> }>("masterData", "/api/metadata/drivers").catch(() => ({ drivers: [] })),
      serviceFetch<{ units?: Array<Record<string, any>> }>("masterData", "/api/metadata/units").catch(() => ({ units: [] })),
    ]);

    const allTrips = Array.isArray(tripsResponse) ? tripsResponse : (tripsResponse?.value || []);
    const drivers = driversResult?.drivers || [];
    const units = unitsResult?.units || [];

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
      
      let driverName = "Unknown Driver";
      let unitNumber = "Unknown Unit";

      if (trip) {
        const driver = drivers.find((d: any) => d.driver_id === trip.driver_id || d.id === trip.driver_id);
        const unit = units.find((u: any) => u.unit_id === trip.unit_id || u.id === trip.unit_id);
        
        driverName = driver?.driver_name || driver?.name || trip.driver_id || "Unknown Driver";
        unitNumber = unit?.unit_number || unit?.unit_id || trip.unit_id || "Unknown Unit";
      }
      
      return {
        ...normalizedEvent,
        trip: trip ? {
          ...trip,
          driver: driverName,
          unit: unitNumber,
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
        // Update trip status in tracking service
        await serviceFetch("tracking", `/api/trips/${tripId}/status`, {
            method: "PATCH",
            body: {
              status: newStatus,
              triggeredBy: actor || "system",
              reason: `Event: ${eventLabel}`,
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

