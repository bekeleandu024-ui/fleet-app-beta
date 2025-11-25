import { NextResponse } from "next/server";
import { serviceFetch } from "@/lib/service-client";

export async function GET() {
  try {
    // 1. Fetch active trips
    const tripsResponse = await serviceFetch<any>("tracking", "/api/trips");
    const allTrips = Array.isArray(tripsResponse) ? tripsResponse : (tripsResponse.value || []);
    
    const activeStatuses = ["planned", "planning", "assigned", "in_transit", "en_route_to_pickup", "at_pickup", "departed_pickup", "at_delivery"];
    const activeTrips = allTrips.filter((t: any) => activeStatuses.includes(t.status.toLowerCase()));

    // 2. Fetch drivers and units for names
    const [driversResult, unitsResult] = await Promise.allSettled([
      serviceFetch<{ drivers?: Array<Record<string, any>> }>("masterData", "/api/metadata/drivers"),
      serviceFetch<{ units?: Array<Record<string, any>> }>("masterData", "/api/metadata/units"),
    ]);

    const drivers = driversResult.status === "fulfilled" && driversResult.value?.drivers ? driversResult.value.drivers : [];
    const units = unitsResult.status === "fulfilled" && unitsResult.value?.units ? unitsResult.value.units : [];

    // 3. Fetch latest event for each active trip to get location
    const fleetData = await Promise.all(activeTrips.map(async (trip: any) => {
      try {
        const eventsResponse = await serviceFetch<any>("tracking", `/trip-events?tripId=${trip.id}`);
        const events = eventsResponse.events || [];
        
        // Sort events by timestamp descending
        const sortedEvents = events.sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        const lastEvent = sortedEvents[0];
        
        // Extract coordinates from event_data (backend structure) or top level
        const eventData = lastEvent?.event_data || lastEvent?.payload || {};
        const coords = eventData.coordinates || lastEvent?.coordinates;
        
        let lat = coords?.lat || lastEvent?.lat;
        let lng = coords?.lng || coords?.lon || lastEvent?.lng || lastEvent?.lon;
        
        // Find driver and unit names
        const driver = drivers.find((d: any) => d.driver_id === trip.driver_id || d.id === trip.driver_id);
        const unit = units.find((u: any) => u.unit_id === trip.unit_id || u.id === trip.unit_id);

        const driverName = driver?.driver_name || driver?.name || `Driver ${trip.driver_id.slice(0, 6)}`;
        const unitNumber = unit?.unit_number || unit?.unit_id?.slice(0, 8) || trip.unit_id?.slice(0, 8) || "N/A";

        return {
          id: trip.id,
          driverId: trip.driver_id,
          unitId: trip.unit_id,
          status: trip.status,
          location: eventData.location || lastEvent?.location || trip.pickup_location, // Fallback to pickup
          lat: lat ? parseFloat(lat) : undefined,
          lng: lng ? parseFloat(lng) : undefined,
          lastUpdate: lastEvent?.timestamp || trip.updated_at,
          driverName,
          unitNumber,
          speed: 0, // We don't have real speed yet unless in telemetry
        };
      } catch (e) {
        console.error(`Error fetching events for trip ${trip.id}`, e);
        return null;
      }
    }));

    // Filter out nulls
    const validFleetData = fleetData.filter(Boolean);

    return NextResponse.json({ fleet: validFleetData });
  } catch (error) {
    console.error("Error fetching fleet data:", error);
    return NextResponse.json({ error: "Failed to fetch fleet data" }, { status: 500 });
  }
}
