-- Update specific orders
-- Example: Change customer or status

-- Update a specific order status
UPDATE orders SET status = 'delivered' 
WHERE customer_id = 'AUTOCOM' AND pickup_location = 'Memphis, TN';

-- Add new orders
INSERT INTO orders (customer_id, order_type, status, pickup_location, dropoff_location, pickup_time, estimated_cost)
VALUES
  ('AUTOCOM', 'delivery', 'planning', 'Houston, TX', 'Austin, TX', NOW() + INTERVAL '12 hours', 350.00),
  ('CAMCOR', 'delivery', 'in_transit', 'Seattle, WA', 'Portland, OR', NOW() + INTERVAL '6 hours', 425.00);

-- Update the schema_migrations table
INSERT INTO schema_migrations (filename, applied_at)
VALUES ('003_update_orders.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
