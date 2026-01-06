-- Migration: Remove individual costing columns from driver_profiles
-- Keep only effective_wage_cpm (individual rates are now derived from costing_rules table)

ALTER TABLE driver_profiles DROP COLUMN IF EXISTS base_wage_cpm;
ALTER TABLE driver_profiles DROP COLUMN IF EXISTS benefits_pct;
ALTER TABLE driver_profiles DROP COLUMN IF EXISTS performance_pct;
ALTER TABLE driver_profiles DROP COLUMN IF EXISTS safety_pct;
ALTER TABLE driver_profiles DROP COLUMN IF EXISTS step_pct;

-- Verify remaining columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'driver_profiles'
ORDER BY ordinal_position;
