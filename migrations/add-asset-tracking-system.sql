-- =====================================================
-- Asset Tracking and Cost Calculation System Migration
-- =====================================================
-- This migration adds comprehensive location tracking for units and trailers,
-- enabling accurate Fleet vs Brokerage cost comparison and preparing for
-- AI-powered trip consolidation.
--
-- Key Principles:
-- 1. Units have a HOME (where driver returns) and CURRENT LOCATION (where they are)
-- 2. Trailers are fluid inventory - no operational "home", only administrative domicile
-- 3. Trailers follow Units by default - only detach when drop_trailer = true
-- 4. Rounder vs Non-Rounder determines if UNIT returns home, not the trailer
-- 5. Empty miles only affect Fleet costs, never Brokerage
-- =====================================================

-- =====================================================
-- PHASE 1.1: Create Locations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'COMPANY_YARD', 'CUSTOMER', 'DRIVER_HOME', 'DROP_YARD', 'FUEL_STOP'
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip VARCHAR(20),
  country VARCHAR(50) DEFAULT 'USA',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_city_state ON locations(city, state);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);

-- Seed with Cambridge Terminal (company headquarters)
INSERT INTO locations (name, type, city, state, latitude, longitude)
VALUES ('Cambridge Terminal', 'COMPANY_YARD', 'Cambridge', 'OH', 40.0312, -81.5885)
ON CONFLICT DO NOTHING;

-- =====================================================
-- PHASE 1.2: Update Unit Profiles Table
-- =====================================================
-- Note: current_location_id already exists and references customers table
-- We need to clear it and update the FK constraint to point to locations instead

-- Drop existing FK constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_unit_profiles_current_location'
          AND table_name = 'unit_profiles'
    ) THEN
        ALTER TABLE unit_profiles DROP CONSTRAINT fk_unit_profiles_current_location;
    END IF;
END $$;

-- Clear existing current_location_id values (they reference customers, not locations)
UPDATE unit_profiles SET current_location_id = NULL WHERE current_location_id IS NOT NULL;

-- Home base: Where the driver/unit returns to (human needs to go home)
ALTER TABLE unit_profiles ADD COLUMN IF NOT EXISTS home_base_id UUID REFERENCES locations(id);

-- Current location: Where the unit IS right now (already exists, just update FK)
ALTER TABLE unit_profiles ADD COLUMN IF NOT EXISTS current_location_id UUID;
ALTER TABLE unit_profiles ADD COLUMN IF NOT EXISTS current_city VARCHAR(100);
ALTER TABLE unit_profiles ADD COLUMN IF NOT EXISTS current_state VARCHAR(2);
ALTER TABLE unit_profiles ADD COLUMN IF NOT EXISTS current_location_updated_at TIMESTAMP;

-- Add new FK constraint to locations table
ALTER TABLE unit_profiles
  ADD CONSTRAINT fk_unit_profiles_current_location_v2
  FOREIGN KEY (current_location_id) REFERENCES locations(id) ON DELETE SET NULL;

-- Default trailer for UX (auto-fill on dispatch, but overrideable)
ALTER TABLE unit_profiles ADD COLUMN IF NOT EXISTS default_trailer_id UUID REFERENCES trailers(trailer_id);

-- Operational status
-- Values: 'AVAILABLE', 'EN_ROUTE', 'DISPLACED', 'OUT_OF_SERVICE'
ALTER TABLE unit_profiles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'AVAILABLE';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_unit_profiles_status ON unit_profiles(status);
CREATE INDEX IF NOT EXISTS idx_unit_profiles_current_location ON unit_profiles(current_location_id);
CREATE INDEX IF NOT EXISTS idx_unit_profiles_home_base ON unit_profiles(home_base_id);

-- =====================================================
-- PHASE 1.3: Update Trailers Table
-- =====================================================
-- Note: current_location_id already exists and references customers table
-- We need to clear it and update the FK constraint to point to locations instead

-- Drop existing FK constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'trailers_current_location_id_fkey'
          AND table_name = 'trailers'
    ) THEN
        ALTER TABLE trailers DROP CONSTRAINT trailers_current_location_id_fkey;
    END IF;
END $$;

-- Clear existing current_location_id values (they reference customers, not locations)
UPDATE trailers SET current_location_id = NULL WHERE current_location_id IS NOT NULL;

-- Domicile: Administrative home (maintenance, registration) - NOT used for trip planning
ALTER TABLE trailers ADD COLUMN IF NOT EXISTS domicile_location_id UUID REFERENCES locations(id);

-- Current location: Where the trailer IS right now (already exists, just update FK later)
ALTER TABLE trailers ADD COLUMN IF NOT EXISTS current_location_id UUID;
ALTER TABLE trailers ADD COLUMN IF NOT EXISTS current_city VARCHAR(100);
ALTER TABLE trailers ADD COLUMN IF NOT EXISTS current_state VARCHAR(2);
ALTER TABLE trailers ADD COLUMN IF NOT EXISTS current_location_updated_at TIMESTAMP;

-- Add new FK constraint to locations table
ALTER TABLE trailers
  ADD CONSTRAINT trailers_current_location_id_fkey_v2
  FOREIGN KEY (current_location_id) REFERENCES locations(id) ON DELETE SET NULL;

-- Which unit is it attached to? (null = dropped/available for pickup)
ALTER TABLE trailers ADD COLUMN IF NOT EXISTS current_unit_id UUID REFERENCES unit_profiles(unit_id);

-- Operational status (already exists as ENUM, add new values if needed)
-- Existing values: 'Available', 'Loaded', 'Maintenance', 'Storage'
-- New values we want: 'IN_TRANSIT', 'SPOTTED' (note: 'Available' maps to 'AVAILABLE', 'Storage' maps to 'STORAGE')
DO $$
BEGIN
    -- Add 'Spotted' to trailer_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Spotted' AND enumtypid = 'trailer_status'::regtype) THEN
        ALTER TYPE trailer_status ADD VALUE 'Spotted';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trailers_status ON trailers(status);
CREATE INDEX IF NOT EXISTS idx_trailers_current_location ON trailers(current_location_id);
CREATE INDEX IF NOT EXISTS idx_trailers_current_unit ON trailers(current_unit_id);

-- =====================================================
-- PHASE 1.4: Update Orders Table
-- =====================================================
-- Is this a rounder? (Does the UNIT return to home base after delivery?)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_rounder BOOLEAN DEFAULT true;

-- Drop trailer at delivery? (Trailer detaches from unit)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS drop_trailer BOOLEAN DEFAULT false;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_orders_is_rounder ON orders(is_rounder);

-- =====================================================
-- PHASE 1.5: Update Trips Table
-- =====================================================
-- Asset assignment (dynamic per trip)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES unit_profiles(unit_id);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trailer_id UUID REFERENCES trailers(trailer_id);

-- Mile tracking
ALTER TABLE trips ADD COLUMN IF NOT EXISTS deadhead_miles DECIMAL(10,2) DEFAULT 0;
-- Empty miles: unit.current_location → first pickup

ALTER TABLE trips ADD COLUMN IF NOT EXISTS loaded_miles DECIMAL(10,2) DEFAULT 0;
-- Revenue miles: pickup → final delivery

ALTER TABLE trips ADD COLUMN IF NOT EXISTS return_miles DECIMAL(10,2) DEFAULT 0;
-- Empty return: final delivery → unit.home_base (only if rounder)

ALTER TABLE trips ADD COLUMN IF NOT EXISTS total_empty_miles DECIMAL(10,2) DEFAULT 0;
-- Calculated: deadhead_miles + return_miles

ALTER TABLE trips ADD COLUMN IF NOT EXISTS bobtail_return BOOLEAN DEFAULT false;
-- True if unit returned without trailer (drop_trailer = true AND is_rounder = true)

-- Trip type flags (copied from order for historical tracking)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_rounder BOOLEAN DEFAULT true;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS drop_trailer BOOLEAN DEFAULT false;

-- Create indexes for analytics and reporting
CREATE INDEX IF NOT EXISTS idx_trips_unit_id ON trips(unit_id);
CREATE INDEX IF NOT EXISTS idx_trips_trailer_id ON trips(trailer_id);
CREATE INDEX IF NOT EXISTS idx_trips_is_rounder ON trips(is_rounder);

-- =====================================================
-- PHASE 5: Data Migration
-- =====================================================
-- Migrate existing unit data to Cambridge Terminal
-- =====================================================
DO $$
DECLARE
  terminal_id UUID;
BEGIN
  -- Get the Cambridge Terminal ID
  SELECT id INTO terminal_id FROM locations WHERE name = 'Cambridge Terminal';

  IF terminal_id IS NOT NULL THEN
    -- Set all units to home base and current location = Cambridge Terminal
    UPDATE unit_profiles
    SET
      home_base_id = terminal_id,
      current_location_id = terminal_id,
      current_city = 'Cambridge',
      current_state = 'OH',
      current_location_updated_at = NOW(),
      status = COALESCE(status, 'AVAILABLE')
    WHERE home_base_id IS NULL;

    RAISE NOTICE 'Migrated % units to Cambridge Terminal', (SELECT COUNT(*) FROM unit_profiles WHERE home_base_id = terminal_id);
  ELSE
    RAISE WARNING 'Cambridge Terminal location not found - skipping unit migration';
  END IF;
END $$;

-- =====================================================
-- Migrate existing trailer data to Cambridge Terminal
-- =====================================================
DO $$
DECLARE
  terminal_id UUID;
BEGIN
  -- Get the Cambridge Terminal ID
  SELECT id INTO terminal_id FROM locations WHERE name = 'Cambridge Terminal';

  IF terminal_id IS NOT NULL THEN
    -- Set all trailers to domicile and current location = Cambridge Terminal
    UPDATE trailers
    SET
      domicile_location_id = terminal_id,
      current_location_id = terminal_id,
      current_city = 'Cambridge',
      current_state = 'OH',
      current_location_updated_at = NOW(),
      status = COALESCE(status, 'Storage')  -- Use existing enum value
    WHERE domicile_location_id IS NULL;

    -- Attach trailers to units based on default_trailer_id (if set)
    UPDATE trailers t
    SET current_unit_id = u.unit_id,
        status = 'Storage'  -- Use existing enum value
    FROM unit_profiles u
    WHERE u.default_trailer_id = t.trailer_id
      AND t.current_unit_id IS NULL;

    RAISE NOTICE 'Migrated % trailers to Cambridge Terminal', (SELECT COUNT(*) FROM trailers WHERE domicile_location_id = terminal_id);
  ELSE
    RAISE WARNING 'Cambridge Terminal location not found - skipping trailer migration';
  END IF;
END $$;

-- =====================================================
-- Migrate existing orders - assume all were rounders
-- =====================================================
UPDATE orders
SET is_rounder = true, drop_trailer = false
WHERE is_rounder IS NULL;

-- =====================================================
-- Add helpful comments to tables
-- =====================================================
COMMENT ON TABLE locations IS 'Normalized location data for yards, customer facilities, and driver homes. Supports GPS coordinates for distance calculations.';
COMMENT ON COLUMN unit_profiles.home_base_id IS 'Where the driver/unit BELONGS and returns to (human needs to go home)';
COMMENT ON COLUMN unit_profiles.current_location_id IS 'Where the unit IS right now (operational location)';
COMMENT ON COLUMN unit_profiles.status IS 'AVAILABLE=ready at home, EN_ROUTE=on trip, DISPLACED=away from home awaiting backhaul, OUT_OF_SERVICE=maintenance';
COMMENT ON COLUMN trailers.domicile_location_id IS 'Administrative home for maintenance/registration (NOT used for trip planning)';
COMMENT ON COLUMN trailers.current_location_id IS 'Where the trailer IS right now (operational availability)';
COMMENT ON COLUMN trailers.current_unit_id IS 'Which unit the trailer is attached to (null = detached/dropped)';
COMMENT ON COLUMN trailers.status IS 'AVAILABLE=ready, IN_TRANSIT=moving, SPOTTED=dropped at location, STORAGE=at yard, OUT_OF_SERVICE=maintenance';
COMMENT ON COLUMN orders.is_rounder IS 'Does the UNIT return to home base after delivery? (affects return miles calculation)';
COMMENT ON COLUMN orders.drop_trailer IS 'Does the trailer detach at delivery? (trailer stays, unit leaves - possibly bobtail if rounder)';
COMMENT ON COLUMN trips.deadhead_miles IS 'Empty miles from unit current location to first pickup';
COMMENT ON COLUMN trips.loaded_miles IS 'Revenue miles from pickup to final delivery';
COMMENT ON COLUMN trips.return_miles IS 'Empty return miles from delivery to unit home base (0 if not a rounder)';
COMMENT ON COLUMN trips.total_empty_miles IS 'Sum of deadhead_miles + return_miles (only these miles affect fleet cost, never brokerage)';
COMMENT ON COLUMN trips.bobtail_return IS 'True if unit returned without trailer (drop_trailer=true AND is_rounder=true)';
