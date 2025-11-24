-- Fix: Change trips.order_id from UUID to VARCHAR to support human-readable order IDs
-- This allows orders with IDs like "RLOCL0001" instead of just UUIDs

-- Drop dependent views
DROP VIEW IF EXISTS v_trips_missing_distance CASCADE;
DROP VIEW IF EXISTS trip_event_timeline CASCADE;

-- Alter the column type
ALTER TABLE trips 
ALTER COLUMN order_id TYPE character varying(255) 
USING order_id::text;

-- Recreate the views
CREATE VIEW v_trips_missing_distance AS 
SELECT 
  id, 
  order_id, 
  driver_id, 
  status, 
  pickup_location, 
  dropoff_location, 
  created_at 
FROM trips 
WHERE (planned_miles IS NULL OR planned_miles = 0) 
  AND status NOT IN ('cancelled', 'closed');

CREATE VIEW trip_event_timeline AS 
SELECT 
  te.id, 
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
