-- Drop dependent views
DROP VIEW IF EXISTS v_trips_missing_distance;
DROP VIEW IF EXISTS trip_event_timeline;

-- Fix type mismatch for trips.order_id
ALTER TABLE trips ALTER COLUMN order_id TYPE uuid USING order_id::uuid;

-- Add missing columns
ALTER TABLE trip_costs ADD COLUMN IF NOT EXISTS trip_id uuid;
ALTER TABLE unit_profiles ADD COLUMN IF NOT EXISTS current_location text;
ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS status text;

-- Recreate the views
CREATE VIEW v_trips_missing_distance AS
 SELECT trips.id,
    trips.order_id,
    trips.driver_id,
    trips.status,
    trips.pickup_location,
    trips.dropoff_location,
    trips.created_at
   FROM trips
  WHERE (trips.planned_miles IS NULL OR trips.planned_miles = 0::numeric) AND (trips.status <> ALL (ARRAY['cancelled'::text, 'closed'::text]));

CREATE VIEW trip_event_timeline AS
 SELECT te.id,
    te.trip_id,
    t.order_id,
    te.event_type,
    te.status,
    te.occurred_at,
    te.triggered_by,
    te.source
   FROM trip_events te
     JOIN trips t ON te.trip_id = t.id
  ORDER BY te.occurred_at DESC;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_order_id ON trips(order_id);
CREATE INDEX IF NOT EXISTS idx_trip_costs_trip_id ON trip_costs(trip_id);
