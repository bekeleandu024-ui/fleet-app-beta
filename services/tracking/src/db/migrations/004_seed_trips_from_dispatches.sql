-- Seed trips from dispatches with order details
-- Clear existing trips
TRUNCATE TABLE trips CASCADE;

-- Create trips from dispatches, joining with orders and driver_profiles for location and driver details
INSERT INTO trips (
  order_id,
  dispatch_id,
  driver_id,
  status,
  pickup_location,
  dropoff_location,
  planned_start,
  actual_start,
  pickup_departure,
  completed_at,
  risk_level,
  notes,
  created_at,
  updated_at
)
SELECT 
  d.order_id::UUID,
  d.id::UUID,
  dp.driver_id,  -- Get UUID from driver_profiles by matching unit_number
  CASE d.status
    WHEN 'assigned' THEN 'assigned'
    WHEN 'in_transit' THEN 'in_transit'
    WHEN 'delivered' THEN 'completed'
    ELSE 'assigned'
  END,
  o.pickup_location,
  o.dropoff_location,
  d.assigned_at,
  d.picked_up_at,
  d.picked_up_at,
  d.delivered_at,
  CASE 
    WHEN o.status = 'exception' THEN 'red'
    WHEN o.status = 'at_risk' THEN 'yellow'
    WHEN d.status = 'in_transit' THEN 'green'
    ELSE 'green'
  END,
  'Migrated from dispatch records',
  d.created_at,
  d.updated_at
FROM dispatches d
JOIN orders o ON d.order_id::UUID = o.id
JOIN driver_profiles dp ON d.driver_id = dp.unit_number  -- Match dispatch driver_id (unit#) to driver's unit_number
WHERE o.pickup_location IS NOT NULL 
  AND o.dropoff_location IS NOT NULL
  AND dp.driver_id IS NOT NULL;
