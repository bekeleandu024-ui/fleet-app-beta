CREATE OR REPLACE VIEW trip_event_timeline AS
SELECT
    t.id AS trip_id,
    t.order_id,
    t.dispatch_id,
    e.id AS event_id,
    e.event_type,
    e.status,
    e.source,
    e.payload,
    e.triggered_by,
    e.occurred_at
FROM trips t
JOIN trip_events e ON e.trip_id = t.id
ORDER BY e.occurred_at;

CREATE OR REPLACE VIEW active_trip_locations AS
SELECT DISTINCT ON (trip_id)
    trip_id,
    driver_id,
    latitude,
    longitude,
    speed,
    heading,
    odometer,
    fuel_level,
    source,
    recorded_at
FROM trip_locations
ORDER BY trip_id, recorded_at DESC;
