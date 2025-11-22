-- Migration 006: TMS Flow Enhancements
-- Adds fields and tables to support comprehensive Order→Trip→Event→Analytics flow
-- Preserves existing structure, only extends with minimal additions

-- ========================================
-- ORDERS TABLE ENHANCEMENTS
-- ========================================

-- Add customer and qualification fields
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS required_equipment VARCHAR(100),
  ADD COLUMN IF NOT EXISTS qualification_notes TEXT,
  ADD COLUMN IF NOT EXISTS quoted_rate NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS lane VARCHAR(100); -- "Toronto→Chicago"

-- Add pickup/delivery window columns (if not exists from pickup_time/dropoff_time)
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS pu_window_start TIMESTAMP,
  ADD COLUMN IF NOT EXISTS pu_window_end TIMESTAMP,
  ADD COLUMN IF NOT EXISTS del_window_start TIMESTAMP,
  ADD COLUMN IF NOT EXISTS del_window_end TIMESTAMP;

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_lane ON orders(lane);

-- ========================================
-- TRIPS TABLE ENHANCEMENTS
-- ========================================

-- Add revenue and margin tracking
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS revenue NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS expected_revenue NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS margin_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS final_margin_pct NUMERIC(5,2);

-- Add ETA and risk tracking
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS eta_prediction TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delay_risk_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS eta_baseline TIMESTAMP WITH TIME ZONE;

-- Add denormalized fields for performance
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS unit_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS lane VARCHAR(100);

-- Add week tracking for reporting
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS week_start DATE;

-- Add cost summary fields (can also reference trip_costs table)
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS profit NUMERIC(12,2);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_week_start ON trips(week_start);
CREATE INDEX IF NOT EXISTS idx_trips_driver_unit ON trips(driver_id, unit_id);
CREATE INDEX IF NOT EXISTS idx_trips_eta ON trips(eta_prediction);

-- ========================================
-- RATE CARDS TABLE (NEW)
-- ========================================

CREATE TABLE IF NOT EXISTS rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_type VARCHAR(50) NOT NULL, -- "Linehaul", "Shuttle", "Dedicated", "Regional"
  zone VARCHAR(50), -- "Regional", "Interstate", "Cross-border", "Local"
  description TEXT,
  
  -- Cost per mile breakdown
  fixed_cpm NUMERIC(6,3) DEFAULT 0,
  wage_cpm NUMERIC(6,3) DEFAULT 0,
  fuel_cpm NUMERIC(6,3) DEFAULT 0,
  truck_maint_cpm NUMERIC(6,3) DEFAULT 0,
  trailer_maint_cpm NUMERIC(6,3) DEFAULT 0,
  addons_cpm NUMERIC(6,3) DEFAULT 0,
  rolling_cpm NUMERIC(6,3) DEFAULT 0,
  total_cpm NUMERIC(6,3) GENERATED ALWAYS AS (
    fixed_cpm + wage_cpm + fuel_cpm + truck_maint_cpm + 
    trailer_maint_cpm + addons_cpm + rolling_cpm
  ) STORED,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  expired_date DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for rate lookup
CREATE INDEX IF NOT EXISTS idx_rate_cards_type_zone ON rate_cards(rate_type, zone);
CREATE INDEX IF NOT EXISTS idx_rate_cards_active ON rate_cards(is_active, effective_date);

-- ========================================
-- MARKET LANES TABLE (NEW)
-- ========================================

CREATE TABLE IF NOT EXISTS market_lanes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  lane VARCHAR(100) NOT NULL, -- "Toronto→Chicago"
  
  -- Market rate data
  rpm NUMERIC(6,2) NOT NULL, -- Revenue per mile
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Source and confidence
  source VARCHAR(100), -- "DAT", "Truckstop.com", "Manual Entry", "Customer Quote"
  confidence VARCHAR(20), -- "High", "Medium", "Low"
  sample_size INTEGER, -- Number of loads in sample
  
  -- Temporal tracking
  sample_date DATE NOT NULL,
  valid_until DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for market rate lookup
CREATE INDEX IF NOT EXISTS idx_market_lanes_lane ON market_lanes(lane);
CREATE INDEX IF NOT EXISTS idx_market_lanes_origin_dest ON market_lanes(origin, destination);
CREATE INDEX IF NOT EXISTS idx_market_lanes_date ON market_lanes(sample_date DESC);

-- ========================================
-- BUSINESS RULES TABLE (NEW)
-- ========================================

CREATE TABLE IF NOT EXISTS business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key VARCHAR(100) UNIQUE NOT NULL,
  
  -- Rule configuration
  scope VARCHAR(50) NOT NULL, -- "margin", "detention", "dwell", "utilization", "cost"
  rule_value NUMERIC(10,2) NOT NULL,
  unit VARCHAR(20), -- "%", "minutes", "$", "miles"
  
  -- Severity for violations
  severity VARCHAR(20) DEFAULT 'warning', -- "info", "warning", "critical"
  
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for rule lookup
CREATE INDEX IF NOT EXISTS idx_business_rules_scope ON business_rules(scope, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_rules_key ON business_rules(rule_key);

-- ========================================
-- SEED DEFAULT RATE CARDS
-- ========================================

INSERT INTO rate_cards (rate_type, zone, description, fixed_cpm, wage_cpm, fuel_cpm, truck_maint_cpm, trailer_maint_cpm, addons_cpm, rolling_cpm)
VALUES 
  ('Linehaul', 'Interstate', 'Standard long-haul interstate rate', 0.15, 0.45, 0.35, 0.08, 0.04, 0.05, 0.10),
  ('Linehaul', 'Regional', 'Regional linehaul within 500 miles', 0.18, 0.50, 0.30, 0.08, 0.04, 0.03, 0.12),
  ('Linehaul', 'Cross-border', 'US-Canada cross-border linehaul', 0.20, 0.55, 0.35, 0.10, 0.05, 0.10, 0.15),
  ('Shuttle', 'Local', 'Local shuttle service', 0.25, 0.40, 0.25, 0.10, 0.05, 0.02, 0.08),
  ('Dedicated', 'Regional', 'Dedicated regional route', 0.20, 0.48, 0.32, 0.09, 0.04, 0.04, 0.11)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- SEED DEFAULT BUSINESS RULES
-- ========================================

INSERT INTO business_rules (rule_key, scope, rule_value, unit, severity, description)
VALUES 
  ('min_margin_threshold', 'margin', 8.00, '%', 'critical', 'Minimum acceptable margin percentage'),
  ('target_margin', 'margin', 15.00, '%', 'warning', 'Target margin for profitability'),
  ('max_detention_minutes', 'detention', 120, 'minutes', 'warning', 'Maximum detention before charges apply'),
  ('max_dwell_pickup', 'dwell', 90, 'minutes', 'info', 'Expected max dwell time at pickup'),
  ('max_dwell_delivery', 'dwell', 120, 'minutes', 'info', 'Expected max dwell time at delivery'),
  ('border_crossing_fee', 'cost', 150.00, '$', 'info', 'Standard border crossing fee'),
  ('detention_rate_per_hour', 'cost', 75.00, '$', 'info', 'Hourly detention charge'),
  ('drop_hook_fee', 'cost', 50.00, '$', 'info', 'Drop and hook service fee')
ON CONFLICT (rule_key) DO NOTHING;

-- ========================================
-- SEED SAMPLE MARKET LANES
-- ========================================

INSERT INTO market_lanes (origin, destination, lane, rpm, source, confidence, sample_date)
VALUES 
  ('Toronto, ON', 'Chicago, IL', 'Toronto→Chicago', 2.85, 'DAT', 'High', CURRENT_DATE),
  ('Chicago, IL', 'Toronto, ON', 'Chicago→Toronto', 2.65, 'DAT', 'High', CURRENT_DATE),
  ('Toronto, ON', 'Detroit, MI', 'Toronto→Detroit', 3.20, 'Manual Entry', 'Medium', CURRENT_DATE),
  ('Montreal, QC', 'New York, NY', 'Montreal→New York', 2.95, 'Truckstop.com', 'High', CURRENT_DATE),
  ('Windsor, ON', 'Columbus, OH', 'Windsor→Columbus', 2.75, 'Customer Quote', 'Medium', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- MIGRATION TRACKING
-- ========================================

INSERT INTO schema_migrations (filename, applied_at)
VALUES ('006_tms_flow_enhancements.sql', NOW())
ON CONFLICT (filename) DO NOTHING;

-- Migration complete
