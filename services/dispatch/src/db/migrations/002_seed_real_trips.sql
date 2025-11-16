-- Seed real trips/dispatches based on orders and real drivers
-- Clear existing dispatches
TRUNCATE TABLE dispatches CASCADE;

-- Get order IDs and assign them to real drivers
-- Note: This uses subqueries to get actual order and driver IDs from the database

-- Trips for OO (Owner Operator) Drivers
INSERT INTO dispatches (order_id, driver_id, status, assigned_at, picked_up_at, delivered_at)
SELECT 
  o.id::TEXT,
  '936008',  -- Vedran Aleksic
  'in_transit',
  NOW() - INTERVAL '18 hours',
  NOW() - INTERVAL '16 hours',
  NULL
FROM orders o
WHERE o.customer_id = 'AUTOCOM' AND o.pickup_location = 'Memphis, TN' AND o.dropoff_location = 'Atlanta, GA'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at, picked_up_at)
SELECT 
  o.id::TEXT,
  '936002',  -- Chris Cuilliana
  'in_transit',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '4 hours'
FROM orders o
WHERE o.customer_id = 'CAMTAC' AND o.pickup_location = 'Memphis, TN' AND o.dropoff_location = 'Dallas, TX' AND o.status = 'in_transit'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at, picked_up_at, delivered_at)
SELECT 
  o.id::TEXT,
  '936006',  -- Vedran Aleksic
  'delivered',
  NOW() - INTERVAL '31 hours',
  NOW() - INTERVAL '29 hours',
  NOW() - INTERVAL '3 hours'
FROM orders o
WHERE o.customer_id = 'CAMCOR' AND o.status = 'delivered' AND o.pickup_location = 'Memphis, TN'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '936011',  -- Mario Cerni
  'assigned',
  NOW() - INTERVAL '3 hours'
FROM orders o
WHERE o.customer_id = 'AUTOCOM' AND o.status = 'planning' AND o.dropoff_location = 'Atlanta, GA'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at, picked_up_at)
SELECT 
  o.id::TEXT,
  '936012',  -- Nermin Ciric
  'in_transit',
  NOW() - INTERVAL '21 hours',
  NOW() - INTERVAL '19 hours'
FROM orders o
WHERE o.customer_id = 'CAMTAC' AND o.pickup_location = 'Memphis, TN' AND o.dropoff_location = 'Dallas, TX' AND o.estimated_cost = 1425.00
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '936007',  -- Yin Tong
  'assigned',
  NOW() - INTERVAL '3 hours'
FROM orders o
WHERE o.customer_id = 'CEMTOL' AND o.pickup_location = 'Memphis, TN' AND o.dropoff_location = 'Phoenix, AZ' AND o.status = 'planning'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at, picked_up_at)
SELECT 
  o.id::TEXT,
  '936015',  -- Tadeusz Dul
  'in_transit',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '2 hours'
FROM orders o
WHERE o.customer_id = 'CEMTOL' AND o.status = 'in_transit' AND o.dropoff_location = 'Phoenix, AZ'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '936005',  -- Penca Dragicevic
  'assigned',
  NOW() - INTERVAL '4 hours'
FROM orders o
WHERE o.customer_id = 'COMTECH' AND o.pickup_location = 'Memphis, TN' AND o.dropoff_location = 'San Francisco, CA' AND o.status = 'planning'
LIMIT 1;

-- Trips for RNR (Rental) Drivers
INSERT INTO dispatches (order_id, driver_id, status, assigned_at, picked_up_at, delivered_at)
SELECT 
  o.id::TEXT,
  '734408',  -- Satnam Singh
  'delivered',
  NOW() - INTERVAL '149 hours',
  NOW() - INTERVAL '147 hours',
  NOW() - INTERVAL '1 hour'
FROM orders o
WHERE o.customer_id = 'SPINIC' AND o.status = 'delivered' AND o.pickup_location = 'Toronto, ON'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at, picked_up_at)
SELECT 
  o.id::TEXT,
  '724393',  -- Harjeet Singh
  'in_transit',
  NOW() - INTERVAL '224.5 hours',
  NOW() - INTERVAL '222 hours'
FROM orders o
WHERE o.customer_id = 'AUTOCOM' AND o.pickup_location = 'Toronto, ON' AND o.dropoff_location = 'Detroit, MI' AND o.status = 'in_transit'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at, picked_up_at)
SELECT 
  o.id::TEXT,
  '734408',  -- Satnam Singh (Yatin Midha)
  'in_transit',
  NOW() - INTERVAL '224.5 hours',
  NOW() - INTERVAL '222 hours'
FROM orders o
WHERE o.customer_id = 'CAMCOR' AND o.pickup_location = 'Toronto, ON' AND o.dropoff_location = 'Detroit, MI'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at, picked_up_at)
SELECT 
  o.id::TEXT,
  '724393',  -- Harjeet Singh
  'in_transit',
  NOW() - INTERVAL '218 hours',
  NOW() - INTERVAL '216 hours'
FROM orders o
WHERE o.customer_id = 'COMTECH' AND o.pickup_location = 'Dallas, TX' AND o.dropoff_location = 'Houston, TX'
LIMIT 1;

-- Trips for COM (Company) Drivers
INSERT INTO dispatches (order_id, driver_id, status, assigned_at, picked_up_at)
SELECT 
  o.id::TEXT,
  '730111',  -- Jan Lojko
  'in_transit',
  NOW() - INTERVAL '156 hours',
  NOW() - INTERVAL '154 hours'
FROM orders o
WHERE o.customer_id = 'AUTOCOM' AND o.pickup_location = 'Chicago, IL' AND o.dropoff_location = 'Minneapolis, MN' AND o.status = 'in_transit'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '257470',  -- Thom Kelly
  'assigned',
  NOW() - INTERVAL '804 hours'
FROM orders o
WHERE o.customer_id = 'CAMCOR' AND o.status = 'exception' AND o.pickup_location = 'Chicago, IL'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '257455',  -- Rajinder Kothari
  'assigned',
  NOW() - INTERVAL '809 hours'
FROM orders o
WHERE o.customer_id = 'CAMTAC' AND o.status = 'exception' AND o.pickup_location = 'Chicago, IL'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at, picked_up_at)
SELECT 
  o.id::TEXT,
  '734409',  -- Jeff Jorgensen
  'in_transit',
  NOW() - INTERVAL '484 hours',
  NOW() - INTERVAL '482 hours'
FROM orders o
WHERE o.customer_id = 'CORVEX' AND o.pickup_location = 'Phoenix, AZ' AND o.dropoff_location = 'Las Vegas, NV'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at, picked_up_at)
SELECT 
  o.id::TEXT,
  '734406',  -- Adrian Radu
  'in_transit',
  NOW() - INTERVAL '484 hours',
  NOW() - INTERVAL '482 hours'
FROM orders o
WHERE o.customer_id = 'THE CENTER' AND o.pickup_location = 'Phoenix, AZ' AND o.dropoff_location = 'Las Vegas, NV'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '257469',  -- Rob Sheets
  'assigned',
  NOW() - INTERVAL '186.5 hours'
FROM orders o
WHERE o.customer_id = 'SPINIC' AND o.pickup_location = 'Phoenix, AZ' AND o.dropoff_location = 'Albuquerque, NM'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '734407',  -- Amarjeet Gandhi
  'assigned',
  NOW() - INTERVAL '186.5 hours'
FROM orders o
WHERE o.customer_id = 'AUTOCOM' AND o.pickup_location = 'Phoenix, AZ' AND o.dropoff_location = 'Albuquerque, NM'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at, picked_up_at)
SELECT 
  o.id::TEXT,
  '724392',  -- Ron Piche
  'in_transit',
  NOW() - INTERVAL '283 hours',
  NOW() - INTERVAL '281 hours'
FROM orders o
WHERE o.customer_id = 'CEMTOL' AND o.pickup_location = 'Dallas, TX' AND o.dropoff_location = 'Atlanta, GA'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '257467',  -- Karl Bud
  'assigned',
  NOW() - INTERVAL '172 hours'
FROM orders o
WHERE o.customer_id = 'THE CENTER' AND o.pickup_location = 'Chicago, IL' AND o.dropoff_location = 'Kansas City, MO'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '257454',  -- Gabriel
  'assigned',
  NOW() - INTERVAL '190 hours'
FROM orders o
WHERE o.customer_id = 'SPINIC' AND o.pickup_location = 'Chicago, IL' AND o.dropoff_location = 'Kansas City, MO'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '734396',  -- Greg Mcintosh
  'assigned',
  NOW() - INTERVAL '290 hours'
FROM orders o
WHERE o.customer_id = 'CEMTOL' AND o.pickup_location = 'Phoenix, AZ' AND o.dropoff_location = 'Denver, CO'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '734401',  -- Jeff Churchill
  'assigned',
  NOW() - INTERVAL '290 hours'
FROM orders o
WHERE o.customer_id = 'COMTECH' AND o.pickup_location = 'Phoenix, AZ' AND o.dropoff_location = 'Denver, CO'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '734404',  -- Denac Starr
  'assigned',
  NOW() - INTERVAL '657 hours'
FROM orders o
WHERE o.customer_id = 'CAMCOR' AND o.status = 'exception' AND o.pickup_location = 'Dallas, TX' AND o.dropoff_location = 'Memphis, TN'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '730110',  -- Johnni Pitman
  'assigned',
  NOW() - INTERVAL '657 hours'
FROM orders o
WHERE o.customer_id = 'CAMTAC' AND o.pickup_location = 'Dallas, TX' AND o.dropoff_location = 'Memphis, TN' AND o.status = 'planning'
LIMIT 1;

-- Additional trips for remaining drivers
INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '734402',  -- Robert Knight
  'assigned',
  NOW() - INTERVAL '27 hours'
FROM orders o
WHERE o.customer_id = 'THE CENTER' AND o.status = 'at_risk'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '257465',  -- Borislav Pascasicek
  'assigned',
  NOW() - INTERVAL '5 hours'
FROM orders o
WHERE o.customer_id = 'THE CENTER' AND o.status = 'planning' AND o.pickup_location = 'Toronto, ON'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '724305',  -- Greg Nemcosh
  'assigned',
  NOW()
FROM orders o
WHERE o.customer_id = 'SPINIC' AND o.status = 'planning' AND o.pickup_location = 'Toronto, ON' AND o.dropoff_location = 'Chicago, IL'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '257455',  -- Engjell Kefta
  'assigned',
  NOW() - INTERVAL '31 hours'
FROM orders o
WHERE o.customer_id = 'CAMTAC' AND o.pickup_location = 'Seattle, WA' AND o.dropoff_location = 'Portland, OR'
LIMIT 1;

INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
SELECT 
  o.id::TEXT,
  '734457',  -- Chris Osborne
  'assigned',
  NOW() - INTERVAL '31 hours'
FROM orders o
WHERE o.customer_id = 'CEMTOL' AND o.pickup_location = 'Seattle, WA' AND o.dropoff_location = 'Portland, OR'
LIMIT 1;
