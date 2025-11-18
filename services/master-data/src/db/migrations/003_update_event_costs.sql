-- Update event type costs to correct values
-- Border Crossing: $15, Drop/Hook: $15, Pickup: $30, Delivery: $30
-- All others: $0

-- Update existing event types with correct costs
UPDATE event_types SET cost_per_event = 15.00 WHERE event_code = 'BC';
UPDATE event_types SET cost_per_event = 15.00 WHERE event_code = 'DH';
UPDATE event_types SET cost_per_event = 30.00 WHERE event_code = 'PICKUP';
UPDATE event_types SET cost_per_event = 30.00 WHERE event_code = 'DELIVERY';
UPDATE event_types SET cost_per_event = 0.00 WHERE event_code IN ('LAYOVER', 'EXTRA_STOP');

-- Update new event codes if they exist
UPDATE event_types SET cost_per_event = 0.00 
WHERE event_code IN ('START', 'PICKUP_ARRIVE', 'BORDER_ARRIVE', 'DELIVERY_ARRIVE');

UPDATE event_types SET cost_per_event = 30.00 
WHERE event_code IN ('PICKUP_DEPART', 'DELIVERY_COMPLETE');

UPDATE event_types SET cost_per_event = 15.00 
WHERE event_code IN ('BORDER_CLEAR', 'DROP_HOOK');
