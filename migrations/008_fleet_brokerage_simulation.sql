-- ================================================================
-- Migration 008: Fleet vs. Brokerage Dispatch Simulation Engine
-- Adds Asset State tracking for dynamic dispatch simulation
-- ================================================================

-- ================================================================
-- 1. CREATE CUSTOMERS TABLE (must be created first for FK references)
-- ================================================================
CREATE TABLE IF NOT EXISTS customers (
  customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  full_address VARCHAR(500) NOT NULL UNIQUE,
  city VARCHAR(100) NOT NULL,
  has_trailer_pool BOOLEAN NOT NULL DEFAULT false,
  pool_count_empty INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_has_trailer_pool ON customers(has_trailer_pool);

-- ================================================================
-- 2. CREATE TRAILERS TABLE (after customers, before units update)
-- ================================================================
CREATE TYPE trailer_type AS ENUM ('Dry Van', 'Reefer', 'Flatbed');
CREATE TYPE trailer_status AS ENUM ('Available', 'Loaded', 'Maintenance', 'Storage');

CREATE TABLE IF NOT EXISTS trailers (
  trailer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number VARCHAR(50) NOT NULL UNIQUE,
  type trailer_type NOT NULL DEFAULT 'Dry Van',
  current_location_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
  status trailer_status NOT NULL DEFAULT 'Available',
  attached_unit_id UUID, -- FK added after units table is updated
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trailers_unit_number ON trailers(unit_number);
CREATE INDEX IF NOT EXISTS idx_trailers_type ON trailers(type);
CREATE INDEX IF NOT EXISTS idx_trailers_status ON trailers(status);
CREATE INDEX IF NOT EXISTS idx_trailers_current_location_id ON trailers(current_location_id);
CREATE INDEX IF NOT EXISTS idx_trailers_attached_unit_id ON trailers(attached_unit_id);

-- ================================================================
-- 3. UPDATE UNITS TABLE (Power Units / Cabs)
-- ================================================================
CREATE TYPE unit_configuration AS ENUM ('Bobtail', 'Coupled');

-- Add new columns to unit_profiles
ALTER TABLE unit_profiles 
  ADD COLUMN IF NOT EXISTS current_configuration unit_configuration DEFAULT 'Bobtail',
  ADD COLUMN IF NOT EXISTS current_trailer_id UUID,
  ADD COLUMN IF NOT EXISTS avg_fuel_consumption DECIMAL(5, 2) DEFAULT 6.5,
  ADD COLUMN IF NOT EXISTS current_location_id UUID;

-- Add foreign key constraints for units table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_unit_profiles_current_trailer'
  ) THEN
    ALTER TABLE unit_profiles 
      ADD CONSTRAINT fk_unit_profiles_current_trailer 
      FOREIGN KEY (current_trailer_id) REFERENCES trailers(trailer_id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_unit_profiles_current_location'
  ) THEN
    ALTER TABLE unit_profiles 
      ADD CONSTRAINT fk_unit_profiles_current_location 
      FOREIGN KEY (current_location_id) REFERENCES customers(customer_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK from trailers.attached_unit_id to unit_profiles now that units are updated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_trailers_attached_unit'
  ) THEN
    ALTER TABLE trailers 
      ADD CONSTRAINT fk_trailers_attached_unit 
      FOREIGN KEY (attached_unit_id) REFERENCES unit_profiles(unit_id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_unit_profiles_current_trailer_id ON unit_profiles(current_trailer_id);
CREATE INDEX IF NOT EXISTS idx_unit_profiles_current_location_id ON unit_profiles(current_location_id);
CREATE INDEX IF NOT EXISTS idx_unit_profiles_configuration ON unit_profiles(current_configuration);

-- ================================================================
-- 4. UPDATE DRIVERS TABLE (Dynamic Availability Logic)
-- ================================================================
CREATE TYPE driver_category AS ENUM ('Local', 'Highway', 'Team');
CREATE TYPE driver_duty_status AS ENUM ('Off Duty', 'On Duty', 'Driving');

-- Add new columns to driver_profiles
ALTER TABLE driver_profiles
  ADD COLUMN IF NOT EXISTS available_to_start_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_shift_end_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS driver_category driver_category DEFAULT 'Highway',
  ADD COLUMN IF NOT EXISTS hos_hours_remaining DECIMAL(4, 2) DEFAULT 11.0,
  ADD COLUMN IF NOT EXISTS current_status driver_duty_status DEFAULT 'Off Duty';

CREATE INDEX IF NOT EXISTS idx_driver_profiles_available_to_start_at ON driver_profiles(available_to_start_at);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_driver_category ON driver_profiles(driver_category);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_current_status ON driver_profiles(current_status);

-- ================================================================
-- 5. SEED CUSTOMERS TABLE (8 Records)
-- ================================================================
INSERT INTO customers (name, full_address, city, has_trailer_pool, pool_count_empty) VALUES
  ('Walmart Distribution Center', '7755 Logistics Way, Milton, ON L9T 5B8', 'Milton', true, 12),
  ('Amazon YYZ4 Fulfillment', '12 Brewster Road, Brampton, ON L6T 5M8', 'Brampton', true, 8),
  ('Costco Wholesale Depot', '500 Copper Creek Drive, Markham, ON L6B 1N8', 'Markham', true, 5),
  ('Sobeys National DC', '3250 Harvester Road, Burlington, ON L7N 3W9', 'Burlington', true, 10),
  ('Metro Distribution', '1800 Appleby Line, Burlington, ON L7L 6Y6', 'Burlington', false, 0),
  ('Home Depot RDC Toronto', '1500 Creditstone Road, Vaughan, ON L4K 5V3', 'Vaughan', true, 6),
  ('Canadian Tire Warehouse', '8650 Jane Street, Vaughan, ON L4K 0B3', 'Vaughan', false, 0),
  ('Loblaws Distribution', '2275 Lakeshore Boulevard West, Toronto, ON M8V 3Y3', 'Toronto', true, 15)
ON CONFLICT (full_address) DO NOTHING;

-- ================================================================
-- 6. UPDATE EXISTING DRIVER DATA WITH DEFAULTS
-- ================================================================
UPDATE driver_profiles 
SET 
  available_to_start_at = NOW() + INTERVAL '1 hour',
  last_shift_end_at = NOW() - INTERVAL '10 hours',
  driver_category = CASE 
    WHEN region = 'GTA' THEN 'Local'::driver_category
    WHEN driver_type = 'OO' THEN 'Highway'::driver_category
    ELSE 'Highway'::driver_category
  END,
  hos_hours_remaining = 11.0,
  current_status = 'Off Duty'::driver_duty_status
WHERE available_to_start_at IS NULL;

-- ================================================================
-- 7. UPDATE EXISTING UNIT DATA WITH DEFAULTS
-- ================================================================
UPDATE unit_profiles
SET 
  current_configuration = 'Bobtail'::unit_configuration,
  avg_fuel_consumption = CASE 
    WHEN truck_weekly_cost > 900 THEN 5.8  -- Newer/premium trucks
    WHEN truck_weekly_cost > 600 THEN 6.2  -- Mid-tier trucks
    ELSE 6.8  -- Older/OO trucks
  END
WHERE current_configuration IS NULL OR avg_fuel_consumption IS NULL;

-- ================================================================
-- 8. HELPER VIEWS FOR DISPATCH SIMULATION
-- ================================================================

-- View: Available drivers with full context
CREATE OR REPLACE VIEW dispatch_available_drivers AS
SELECT 
  dp.driver_id,
  dp.driver_name,
  dp.driver_type,
  dp.driver_category,
  dp.region,
  dp.available_to_start_at,
  dp.hos_hours_remaining,
  dp.current_status,
  up.unit_id,
  up.unit_number,
  up.current_configuration,
  up.current_trailer_id,
  up.avg_fuel_consumption,
  up.current_location_id,
  c.name AS current_location_name,
  c.city AS current_city,
  t.trailer_id,
  t.unit_number AS trailer_number,
  t.type AS trailer_type
FROM driver_profiles dp
LEFT JOIN unit_profiles up ON dp.unit_number = up.unit_number
LEFT JOIN customers c ON up.current_location_id = c.customer_id
LEFT JOIN trailers t ON up.current_trailer_id = t.trailer_id
WHERE dp.is_active = true
  AND dp.current_status != 'Driving'
  AND (dp.available_to_start_at IS NULL OR dp.available_to_start_at <= NOW());

-- View: Trailer pool availability by location
CREATE OR REPLACE VIEW trailer_pool_availability AS
SELECT 
  c.customer_id,
  c.name AS location_name,
  c.city,
  c.has_trailer_pool,
  c.pool_count_empty,
  COUNT(t.trailer_id) FILTER (WHERE t.status = 'Available') AS available_trailers,
  COUNT(t.trailer_id) FILTER (WHERE t.status = 'Loaded') AS loaded_trailers,
  COUNT(t.trailer_id) AS total_trailers_on_site
FROM customers c
LEFT JOIN trailers t ON t.current_location_id = c.customer_id
WHERE c.has_trailer_pool = true
GROUP BY c.customer_id, c.name, c.city, c.has_trailer_pool, c.pool_count_empty;

-- View: Unit status summary
CREATE OR REPLACE VIEW unit_status_summary AS
SELECT 
  up.unit_id,
  up.unit_number,
  up.current_configuration,
  up.avg_fuel_consumption,
  dp.driver_name,
  dp.driver_category,
  dp.current_status AS driver_status,
  dp.hos_hours_remaining,
  c.name AS current_location,
  c.city,
  t.unit_number AS trailer_number,
  t.type AS trailer_type,
  t.status AS trailer_status
FROM unit_profiles up
LEFT JOIN driver_profiles dp ON up.unit_number = dp.unit_number
LEFT JOIN customers c ON up.current_location_id = c.customer_id
LEFT JOIN trailers t ON up.current_trailer_id = t.trailer_id
WHERE up.is_active = true;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
