-- Migration: Remove individual costing columns from unit_profiles
-- Keep only total_weekly_cost (individual costs are now derived from costing_rules table)

ALTER TABLE unit_profiles DROP COLUMN IF EXISTS truck_weekly_cost;
ALTER TABLE unit_profiles DROP COLUMN IF EXISTS trailer_weekly_cost;
ALTER TABLE unit_profiles DROP COLUMN IF EXISTS insurance_weekly_cost;
ALTER TABLE unit_profiles DROP COLUMN IF EXISTS isaac_weekly_cost;
ALTER TABLE unit_profiles DROP COLUMN IF EXISTS prepass_weekly_cost;
ALTER TABLE unit_profiles DROP COLUMN IF EXISTS sga_weekly_cost;
ALTER TABLE unit_profiles DROP COLUMN IF EXISTS dtops_weekly_cost;
ALTER TABLE unit_profiles DROP COLUMN IF EXISTS misc_weekly_cost;

-- Verify remaining columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'unit_profiles'
ORDER BY ordinal_position;
