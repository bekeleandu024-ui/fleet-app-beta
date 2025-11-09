import { pool } from "../db/client";
import {
  DispatchView,
  DriverView,
  CustomerView,
  TripStatus,
  TripStop,
} from "../models/tracking";
import { mapTripRow, mapStopRow } from "../lib/parsers";
import { getActiveExceptions } from "./tripExceptionService";

export async function getDispatchView(): Promise<DispatchView[]> {
  const tripsResult = await pool.query(
    `SELECT * FROM trips
      WHERE status NOT IN ($1, $2)
      ORDER BY created_at DESC`,
    [TripStatus.CLOSED, TripStatus.CANCELLED]
  );

  const trips = tripsResult.rows.map(mapTripRow);

  const withExceptions = await Promise.all(
    trips.map(async (trip) => {
      const exceptions = await getActiveExceptions(trip.id);
      const risk = calculateRiskLevel(trip.status, exceptions);
      return {
        ...trip,
        active_exceptions: exceptions,
        risk_level: risk,
      };
    })
  );

  return withExceptions;
}

function calculateRiskLevel(
  status: TripStatus,
  exceptions: DispatchView["active_exceptions"]
): DispatchView["risk_level"] {
  if (status === TripStatus.DELAYED) {
    return "red";
  }
  if (exceptions.some((ex) => ex.severity === "critical")) {
    return "red";
  }
  if (exceptions.some((ex) => ex.severity === "high")) {
    return "yellow";
  }
  return "green";
}

export async function getDriverViewForDriver(
  driverId: string
): Promise<DriverView | null> {
  const tripResult = await pool.query(
    `SELECT * FROM trips
      WHERE driver_id = $1
      AND status NOT IN ($2,$3,$4)
      ORDER BY created_at DESC
      LIMIT 1`,
    [driverId, TripStatus.COMPLETED, TripStatus.CLOSED, TripStatus.CANCELLED]
  );

  if (!tripResult.rows.length) {
    return null;
  }

  const trip = mapTripRow(tripResult.rows[0]);

  const stops = await listStopsForTrip(trip.id);
  const currentStopIndex = resolveCurrentStopIndex(trip.status, stops);

  return {
    trip_id: trip.id,
    status: trip.status,
    pickup_location: trip.pickup_location,
    pickup_window_start: trip.pickup_window_start,
    pickup_window_end: trip.pickup_window_end,
    dropoff_location: trip.dropoff_location,
    delivery_window_start: trip.delivery_window_start,
    delivery_window_end: trip.delivery_window_end,
    special_instructions: trip.notes,
    stops,
    current_stop_index: currentStopIndex,
  };
}

function resolveCurrentStopIndex(status: TripStatus, stops: TripStop[]): number {
  if (!stops.length) {
    return 0;
  }

  switch (status) {
    case TripStatus.EN_ROUTE_TO_PICKUP:
      return 0;
    case TripStatus.AT_PICKUP:
    case TripStatus.LOADING:
      return 0;
    case TripStatus.DEPARTED_PICKUP:
    case TripStatus.IN_TRANSIT:
    case TripStatus.EN_ROUTE_TO_DELIVERY:
      return 1;
    case TripStatus.AT_DELIVERY:
    case TripStatus.UNLOADING:
    case TripStatus.DELIVERED:
      return Math.max(1, stops.length - 1);
    default:
      return Math.max(0, stops.length - 1);
  }
}

export async function getCustomerViewForOrder(
  orderId: string
): Promise<CustomerView | null> {
  const result = await pool.query(
    `SELECT * FROM trips
      WHERE order_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
    [orderId]
  );

  if (!result.rows.length) {
    return null;
  }

  const trip = mapTripRow(result.rows[0]);

  let status = "Scheduled";
  if (
    trip.status === TripStatus.DEPARTED_PICKUP ||
    trip.status === TripStatus.IN_TRANSIT ||
    trip.status === TripStatus.EN_ROUTE_TO_DELIVERY
  ) {
    status = "In Transit";
  } else if (trip.status === TripStatus.DELIVERED || trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CLOSED) {
    status = "Delivered";
  } else if (trip.status === TripStatus.AT_PICKUP || trip.status === TripStatus.LOADING) {
    status = "Picked Up";
  }

  return {
    order_id: trip.order_id,
    status,
    pickup_eta: trip.pickup_window_start?.toISOString(),
    delivery_eta: trip.delivery_window_end?.toISOString(),
    last_known_location: trip.current_lat && trip.current_lng ? `${trip.current_lat},${trip.current_lng}` : undefined,
    delivered_at: trip.delivery_departure,
    tracking_url: undefined,
  };
}

async function listStopsForTrip(tripId: string): Promise<TripStop[]> {
  const result = await pool.query(
    `SELECT * FROM trip_stops
      WHERE trip_id = $1
      ORDER BY sequence ASC`,
    [tripId]
  );
  return result.rows.map(mapStopRow);
}
