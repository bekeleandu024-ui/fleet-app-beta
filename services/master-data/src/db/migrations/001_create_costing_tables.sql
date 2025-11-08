-- Driver profiles with costing attributes
CREATE TABLE IF NOT EXISTS driver_profiles (
  driver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_name VARCHAR(255) NOT NULL,
  unit_number VARCHAR(50),
  driver_type VARCHAR(10) NOT NULL CHECK (driver_type IN ('COM', 'RNR', 'OO')),
  oo_zone VARCHAR(10) CHECK (oo_zone IN ('ZONE1', 'ZONE2', 'ZONE3')),
  base_wage_cpm DECIMAL(10, 4) NOT NULL DEFAULT 0,
  benefits_pct DECIMAL(5, 4) NOT NULL DEFAULT 0,
  performance_pct DECIMAL(5, 4) NOT NULL DEFAULT 0,
  safety_pct DECIMAL(5, 4) NOT NULL DEFAULT 0,
  step_pct DECIMAL(5, 4) NOT NULL DEFAULT 0,
  effective_wage_cpm DECIMAL(10, 4) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_profiles_driver_name ON driver_profiles(driver_name);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_unit_number ON driver_profiles(unit_number);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_driver_type ON driver_profiles(driver_type);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_is_active ON driver_profiles(is_active);

-- Unit profiles with weekly costs
CREATE TABLE IF NOT EXISTS unit_profiles (
  unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number VARCHAR(50) NOT NULL UNIQUE,
  driver_id UUID REFERENCES driver_profiles(driver_id),
  truck_weekly_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  trailer_weekly_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  insurance_weekly_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  isaac_weekly_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  prepass_weekly_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sga_weekly_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  dtops_weekly_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  misc_weekly_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_weekly_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unit_profiles_unit_number ON unit_profiles(unit_number);
CREATE INDEX IF NOT EXISTS idx_unit_profiles_driver_id ON unit_profiles(driver_id);
CREATE INDEX IF NOT EXISTS idx_unit_profiles_is_active ON unit_profiles(is_active);

-- Costing rules (global and type-specific rates)
CREATE TABLE IF NOT EXISTS costing_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  rule_value DECIMAL(10, 4) NOT NULL,
  description TEXT,
  effective_date TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(rule_key, rule_type, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_costing_rules_key_type ON costing_rules(rule_key, rule_type);
CREATE INDEX IF NOT EXISTS idx_costing_rules_is_active ON costing_rules(is_active);

-- Event types (border crossings, drop/hook, etc.)
CREATE TABLE IF NOT EXISTS event_types (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code VARCHAR(50) NOT NULL UNIQUE,
  event_name VARCHAR(255) NOT NULL,
  cost_per_event DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_automatic BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_types_event_code ON event_types(event_code);
CREATE INDEX IF NOT EXISTS idx_event_types_is_automatic ON event_types(is_automatic);

-- Event detection rules for auto-adding events
CREATE TABLE IF NOT EXISTS event_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code VARCHAR(50) NOT NULL REFERENCES event_types(event_code),
  trigger_type VARCHAR(100) NOT NULL,
  trigger_condition JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_rules_event_code ON event_rules(event_code);
CREATE INDEX IF NOT EXISTS idx_event_rules_trigger_type ON event_rules(trigger_type);

-- Trip costs with full breakdown
CREATE TABLE IF NOT EXISTS trip_costs (
  cost_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  driver_id UUID REFERENCES driver_profiles(driver_id),
  unit_id UUID REFERENCES unit_profiles(unit_id),
  driver_type VARCHAR(10),
  oo_zone VARCHAR(10),
  
  miles DECIMAL(10, 2) NOT NULL,
  direction VARCHAR(20),
  is_round_trip BOOLEAN NOT NULL DEFAULT false,
  
  border_crossings INTEGER NOT NULL DEFAULT 0,
  drop_hooks INTEGER NOT NULL DEFAULT 0,
  pickups INTEGER NOT NULL DEFAULT 0,
  deliveries INTEGER NOT NULL DEFAULT 0,
  
  fixed_cpm DECIMAL(10, 4) NOT NULL DEFAULT 0,
  wage_cpm DECIMAL(10, 4) NOT NULL DEFAULT 0,
  rolling_cpm DECIMAL(10, 4) NOT NULL DEFAULT 0,
  accessorial_cpm DECIMAL(10, 4) NOT NULL DEFAULT 0,
  total_cpm DECIMAL(10, 4) NOT NULL DEFAULT 0,
  
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  revenue DECIMAL(10, 2),
  rpm DECIMAL(10, 4),
  ppm DECIMAL(10, 4),
  profit DECIMAL(10, 2),
  margin_pct DECIMAL(5, 4),
  is_profitable BOOLEAN,
  
  calculation_formula JSONB NOT NULL,
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  calculated_by VARCHAR(255),
  
  actual_miles DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  variance DECIMAL(10, 2),
  variance_pct DECIMAL(5, 4),
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_costs_order_id ON trip_costs(order_id);
CREATE INDEX IF NOT EXISTS idx_trip_costs_driver_id ON trip_costs(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_costs_unit_id ON trip_costs(unit_id);
CREATE INDEX IF NOT EXISTS idx_trip_costs_calculated_at ON trip_costs(calculated_at);
CREATE INDEX IF NOT EXISTS idx_trip_costs_is_profitable ON trip_costs(is_profitable);

-- Week miles summary for fixed cost allocation
CREATE TABLE IF NOT EXISTS week_miles_summary (
  summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number VARCHAR(50) NOT NULL,
  week_start DATE NOT NULL,
  total_miles DECIMAL(10, 2) NOT NULL DEFAULT 0,
  trip_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(unit_number, week_start)
);

CREATE INDEX IF NOT EXISTS idx_week_miles_unit_week ON week_miles_summary(unit_number, week_start);

-- Function for updated_at trigger (created if not exists from other migrations)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_driver_profiles_updated_at ON driver_profiles;
CREATE TRIGGER update_driver_profiles_updated_at
  BEFORE UPDATE ON driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_unit_profiles_updated_at ON unit_profiles;
CREATE TRIGGER update_unit_profiles_updated_at
  BEFORE UPDATE ON unit_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_costing_rules_updated_at ON costing_rules;
CREATE TRIGGER update_costing_rules_updated_at
  BEFORE UPDATE ON costing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_types_updated_at ON event_types;
CREATE TRIGGER update_event_types_updated_at
  BEFORE UPDATE ON event_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_rules_updated_at ON event_rules;
CREATE TRIGGER update_event_rules_updated_at
  BEFORE UPDATE ON event_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trip_costs_updated_at ON trip_costs;
CREATE TRIGGER update_trip_costs_updated_at
  BEFORE UPDATE ON trip_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_week_miles_summary_updated_at ON week_miles_summary;
CREATE TRIGGER update_week_miles_summary_updated_at
  BEFORE UPDATE ON week_miles_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
