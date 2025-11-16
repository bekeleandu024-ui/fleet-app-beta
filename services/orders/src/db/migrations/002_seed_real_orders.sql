-- Seed real orders from Excel data
-- Clear existing orders
TRUNCATE TABLE orders CASCADE;

-- Insert orders with complete data from Excel (using UUID for id, Excel ref in comment)
INSERT INTO orders (customer_id, order_type, status, pickup_location, dropoff_location, pickup_time, estimated_cost, created_at, updated_at)
VALUES
  -- OO Driver Orders (Excel ref: 936012, 936002, 936011, 936014, 936006, 936007)
  ('AUTOCOM', 'delivery', 'in_transit', 'Memphis, TN', 'Atlanta, GA', NOW() + INTERVAL '2 hours', 1485.00, NOW() - INTERVAL '18 hours', NOW()),
  ('CAMCOR', 'delivery', 'planning', 'Memphis, TN', 'Charlotte, NC', NOW() + INTERVAL '7 hours', 2376.67, NOW() - INTERVAL '5 hours', NOW()),
  ('CAMCOR', 'delivery', 'delivered', 'Memphis, TN', 'Charlotte, NC', NOW() - INTERVAL '3 hours', 2140.90, NOW() - INTERVAL '31 hours', NOW()),
  ('AUTOCOM', 'delivery', 'planning', 'Memphis, TN', 'Atlanta, GA', NOW() + INTERVAL '5 hours', 1500.00, NOW() - INTERVAL '3 hours', NOW()),
  ('CAMTAC', 'delivery', 'in_transit', 'Memphis, TN', 'Dallas, TX', NOW() + INTERVAL '6 hours', 1550.00, NOW() - INTERVAL '6 hours', NOW()),
  ('CAMTAC', 'delivery', 'in_transit', 'Memphis, TN', 'Dallas, TX', NOW() + INTERVAL '21 hours', 1425.00, NOW() - INTERVAL '21 hours', NOW()),
  ('CEMTOL', 'delivery', 'planning', 'Memphis, TN', 'Phoenix, AZ', NOW() + INTERVAL '3 hours', 1500.00, NOW() - INTERVAL '3 hours', NOW()),
  ('CEMTOL', 'delivery', 'in_transit', 'Memphis, TN', 'Phoenix, AZ', NOW() + INTERVAL '3 hours', 1400.00, NOW() - INTERVAL '3 hours', NOW()),
  ('COMTECH', 'delivery', 'planning', 'Memphis, TN', 'San Francisco, CA', NOW() + INTERVAL '4 hours', 1675.00, NOW() - INTERVAL '4 hours', NOW()),
  ('COMTECH', 'delivery', 'in_transit', 'Memphis, TN', 'San Francisco, CA', NOW() + INTERVAL '1 hour', 1425.00, NOW() - INTERVAL '1 hour', NOW()),
  ('CORVEX', 'delivery', 'planning', 'Memphis, TN', 'Los Angeles, CA', NOW() + INTERVAL '0 hours', 1060.00, NOW() + INTERVAL '0 hours', NOW()),
  ('CORVEX', 'delivery', 'in_transit', 'Memphis, TN', 'Los Angeles, CA', NOW() + INTERVAL '1 hour', 1425.00, NOW() - INTERVAL '1 hour', NOW()),

  -- RNR Driver Orders (Excel ref: 734408, 443515, 734393, 257456, 730112)
  ('THE CENTER', 'delivery', 'at_risk', 'Toronto, ON', 'Buffalo, NY', NOW() + INTERVAL '27 hours', 914.63, NOW() - INTERVAL '27 hours', NOW()),
  ('THE CENTER', 'delivery', 'planning', 'Toronto, ON', 'Buffalo, NY', NOW() + INTERVAL '5 hours', 1273.70, NOW() - INTERVAL '5 hours', NOW()),
  ('SPINIC', 'delivery', 'delivered', 'Toronto, ON', 'Chicago, IL', NOW() - INTERVAL '1 hour', 535.00, NOW() - INTERVAL '149 hours', NOW()),
  ('SPINIC', 'delivery', 'planning', 'Toronto, ON', 'Chicago, IL', NOW() + INTERVAL '0 hours', 535.00, NOW() + INTERVAL '0 hours', NOW()),
  ('AUTOCOM', 'delivery', 'in_transit', 'Toronto, ON', 'Detroit, MI', NOW() + INTERVAL '3 hours', 809.62, NOW() - INTERVAL '224.5 hours', NOW()),
  ('CAMCOR', 'delivery', 'in_transit', 'Toronto, ON', 'Detroit, MI', NOW() + INTERVAL '3 hours', 809.62, NOW() - INTERVAL '224.5 hours', NOW()),
  ('CAMTAC', 'delivery', 'planning', 'Seattle, WA', 'Portland, OR', NOW() + INTERVAL '31 hours', 566.43, NOW() - INTERVAL '31 hours', NOW()),
  ('CEMTOL', 'delivery', 'planning', 'Seattle, WA', 'Portland, OR', NOW() + INTERVAL '31 hours', 566.43, NOW() - INTERVAL '31 hours', NOW()),
  ('COMTECH', 'delivery', 'in_transit', 'Dallas, TX', 'Houston, TX', NOW() + INTERVAL '2 hours', 545.00, NOW() - INTERVAL '218 hours', NOW()),
  ('CORVEX', 'delivery', 'in_transit', 'Dallas, TX', 'Houston, TX', NOW() + INTERVAL '2 hours', 545.00, NOW() - INTERVAL '218 hours', NOW()),

  -- COM Driver Orders (Excel ref: 730111, 257453, 257459, 784399, 730107, 734409, 734406)
  ('THE CENTER', 'delivery', 'planning', 'Chicago, IL', 'Kansas City, MO', NOW() + INTERVAL '5 hours', 450.00, NOW() - INTERVAL '172 hours', NOW()),
  ('SPINIC', 'delivery', 'planning', 'Chicago, IL', 'Kansas City, MO', NOW() + INTERVAL '5 hours', 450.00, NOW() - INTERVAL '190 hours', NOW()),
  ('AUTOCOM', 'delivery', 'in_transit', 'Chicago, IL', 'Minneapolis, MN', NOW() + INTERVAL '1 hour', 400.00, NOW() - INTERVAL '156 hours', NOW()),
  ('CAMCOR', 'delivery', 'exception', 'Chicago, IL', 'Minneapolis, MN', NOW() + INTERVAL '1 hour', 1800.00, NOW() - INTERVAL '804 hours', NOW()),
  ('CAMTAC', 'delivery', 'exception', 'Chicago, IL', 'Minneapolis, MN', NOW() + INTERVAL '1 hour', 1300.00, NOW() - INTERVAL '809 hours', NOW()),
  ('CEMTOL', 'delivery', 'planning', 'Phoenix, AZ', 'Denver, CO', NOW() + INTERVAL '42 hours', 2032.50, NOW() - INTERVAL '290 hours', NOW()),
  ('COMTECH', 'delivery', 'planning', 'Phoenix, AZ', 'Denver, CO', NOW() + INTERVAL '42 hours', 2032.50, NOW() - INTERVAL '290 hours', NOW()),
  ('CORVEX', 'delivery', 'in_transit', 'Phoenix, AZ', 'Las Vegas, NV', NOW() + INTERVAL '3 hours', 1047.50, NOW() - INTERVAL '484 hours', NOW()),
  ('THE CENTER', 'delivery', 'in_transit', 'Phoenix, AZ', 'Las Vegas, NV', NOW() + INTERVAL '3 hours', 1047.50, NOW() - INTERVAL '484 hours', NOW()),
  ('SPINIC', 'delivery', 'planning', 'Phoenix, AZ', 'Albuquerque, NM', NOW() + INTERVAL '0 hours', 478.32, NOW() - INTERVAL '186.5 hours', NOW()),
  ('AUTOCOM', 'delivery', 'planning', 'Phoenix, AZ', 'Albuquerque, NM', NOW() + INTERVAL '0 hours', 1424.88, NOW() - INTERVAL '186.5 hours', NOW()),
  ('CAMCOR', 'delivery', 'exception', 'Dallas, TX', 'Memphis, TN', NOW() + INTERVAL '42 hours', 1425.00, NOW() - INTERVAL '657 hours', NOW()),
  ('CAMTAC', 'delivery', 'planning', 'Dallas, TX', 'Memphis, TN', NOW() + INTERVAL '1 hour', 1425.00, NOW() - INTERVAL '657 hours', NOW()),
  ('CEMTOL', 'delivery', 'in_transit', 'Dallas, TX', 'Atlanta, GA', NOW() + INTERVAL '21 hours', 737.50, NOW() - INTERVAL '283 hours', NOW());

-- Update the schema_migrations table
INSERT INTO schema_migrations (filename, applied_at)
VALUES ('002_seed_real_orders.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
