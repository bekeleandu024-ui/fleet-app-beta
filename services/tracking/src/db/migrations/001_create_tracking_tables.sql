CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    dispatch_id UUID,
    driver_id UUID NOT NULL,
    unit_id UUID,
    status TEXT NOT NULL,
    pickup_location TEXT NOT NULL,
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,
    dropoff_location TEXT NOT NULL,
    dropoff_lat DOUBLE PRECISION,
    dropoff_lng DOUBLE PRECISION,
    pickup_window_start TIMESTAMPTZ,
    pickup_window_end TIMESTAMPTZ,
    delivery_window_start TIMESTAMPTZ,
    delivery_window_end TIMESTAMPTZ,
    planned_start TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    pickup_arrival TIMESTAMPTZ,
    pickup_departure TIMESTAMPTZ,
    delivery_arrival TIMESTAMPTZ,
    delivery_departure TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    planned_miles NUMERIC,
    actual_miles NUMERIC,
    estimated_fuel_gallons NUMERIC,
    actual_fuel_gallons NUMERIC,
    pickup_dwell_minutes INTEGER,
    delivery_dwell_minutes INTEGER,
    on_time_pickup BOOLEAN DEFAULT TRUE,
    on_time_delivery BOOLEAN DEFAULT TRUE,
    route_history JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    pod_url TEXT,
    last_known_lat DOUBLE PRECISION,
    last_known_lng DOUBLE PRECISION,
    last_ping_at TIMESTAMPTZ,
    risk_level TEXT DEFAULT 'green',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trip_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sequence SMALLINT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    window_start TIMESTAMPTZ,
    window_end TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    departed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (trip_id, sequence)
);

CREATE TABLE IF NOT EXISTS trip_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    status TEXT,
    source TEXT,
    payload JSONB,
    triggered_by TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trip_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    driver_id UUID,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed NUMERIC,
    heading NUMERIC,
    odometer NUMERIC,
    fuel_level NUMERIC,
    source TEXT,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trip_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    exception_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_events_trip_id ON trip_events(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_events_trip_id_occurred_at ON trip_events(trip_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_locations_trip_id_recorded_at ON trip_locations(trip_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_exceptions_trip_id ON trip_exceptions(trip_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_dispatch ON trips(dispatch_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trips_updated
BEFORE UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_trip_stops_updated
BEFORE UPDATE ON trip_stops
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
