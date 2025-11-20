import {
  Trip,
  TripStatus,
  TripStop,
  TripEvent,
  TripException,
  LocationPoint,
} from "../models/tracking";

export function mapTripRow(row: any): Trip {
  return {
    id: row.id,
    dispatch_id: row.dispatch_id,
    order_id: row.order_id,
    driver_id: row.driver_id,
    unit_id: row.unit_id || undefined,
    status: row.status as TripStatus,
    pickup_location: row.pickup_location,
    pickup_lat: row.pickup_lat ?? undefined,
    pickup_lng: row.pickup_lng ?? undefined,
    dropoff_location: row.dropoff_location,
    dropoff_lat: row.dropoff_lat ?? undefined,
    dropoff_lng: row.dropoff_lng ?? undefined,
    pickup_window_start: row.pickup_window_start ?? undefined,
    pickup_window_end: row.pickup_window_end ?? undefined,
    delivery_window_start: row.delivery_window_start ?? undefined,
    delivery_window_end: row.delivery_window_end ?? undefined,
    current_lat: row.last_known_lat ?? undefined,
    current_lng: row.last_known_lng ?? undefined,
    last_ping: row.last_ping_at ?? undefined,
    planned_start: row.planned_start ?? undefined,
    actual_start: row.actual_start ?? undefined,
    pickup_arrival: row.pickup_arrival ?? undefined,
    pickup_departure: row.pickup_departure ?? undefined,
    delivery_arrival: row.delivery_arrival ?? undefined,
    delivery_departure: row.delivery_departure ?? undefined,
    completed_at: row.completed_at ?? undefined,
  closed_at: row.closed_at ?? undefined,
    planned_miles: row.planned_miles ?? undefined,
    actual_miles: row.actual_miles ?? undefined,
    distance_miles: row.distance_miles ?? undefined,
    duration_hours: row.duration_hours ?? undefined,
    distance_calculated_at: row.distance_calculated_at ?? undefined,
    distance_calculation_provider: row.distance_calculation_provider ?? undefined,
    distance_calculation_method: row.distance_calculation_method ?? undefined,
    estimated_fuel_gallons: row.estimated_fuel_gallons ?? undefined,
    actual_fuel_gallons: row.actual_fuel_gallons ?? undefined,
    pickup_dwell_minutes: row.pickup_dwell_minutes ?? undefined,
    delivery_dwell_minutes: row.delivery_dwell_minutes ?? undefined,
    on_time_pickup: row.on_time_pickup,
    on_time_delivery: row.on_time_delivery,
  route_history: normalizeRouteHistory(row.route_history),
    notes: row.notes ?? undefined,
    pod_url: row.pod_url ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapStopRow(row: any): TripStop {
  return {
    sequence: row.sequence,
    location: row.location,
    type: row.type,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    window_start: row.window_start ?? undefined,
    window_end: row.window_end ?? undefined,
    arrived_at: row.arrived_at ?? undefined,
    departed_at: row.departed_at ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export function mapEventRow(row: any): TripEvent {
  return {
    id: row.id,
    trip_id: row.trip_id,
    event_type: row.event_type,
    event_data: row.payload,
    triggered_by: row.triggered_by ?? undefined,
    timestamp: row.occurred_at,
  };
}

export function mapExceptionRow(row: any): TripException {
  return {
    id: row.id,
    trip_id: row.trip_id,
    exception_type: row.exception_type,
    severity: row.severity,
    message: row.message,
    resolved: row.resolved,
    resolved_at: row.resolved_at ?? undefined,
    created_at: row.created_at,
  };
}

export function mapLocationRow(row: any): LocationPoint {
  return {
    lat: Number(row.latitude),
    lng: Number(row.longitude),
    timestamp: row.recorded_at?.toISOString?.() ?? row.recorded_at,
    speed: row.speed !== null && row.speed !== undefined ? Number(row.speed) : undefined,
    heading: row.heading !== null && row.heading !== undefined ? Number(row.heading) : undefined,
    source: row.source ?? undefined,
  };
}

function normalizeRouteHistory(value: unknown): LocationPoint[] | undefined {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value as LocationPoint[];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as LocationPoint[]) : undefined;
    } catch (error) {
      console.error("Failed to parse route history", error);
      return undefined;
    }
  }

  return undefined;
}
