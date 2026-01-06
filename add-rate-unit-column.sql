-- Migration: Add rate_unit column to costing_rules table
-- This column describes the unit of measurement for each rate
-- Examples: '$/Mile', '$/Week', '$/Event', '% of base'

-- Add the rate_unit column
ALTER TABLE costing_rules 
ADD COLUMN IF NOT EXISTS rate_unit VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN costing_rules.rate_unit IS 'Unit of measurement for the rate (e.g., $/Mile, $/Week, $/Event, % of base)';

-- Update existing records based on the NOTE column patterns from the costing rules spreadsheet:

-- Per Mile rates
UPDATE costing_rules SET rate_unit = '$/Mile' 
WHERE rule_key IN ('BASE_WAGE', 'TRK_RM_CPM', 'TRL_RM_CPM', 'FUEL_CPM') 
  AND rate_unit IS NULL;

-- Percentage of base rates  
UPDATE costing_rules SET rate_unit = '% of base'
WHERE rule_key IN ('SAFETY_PCT', 'BENEFITS_PCT', 'PERF_PCT', 'STEP_PCT')
  AND rate_unit IS NULL;

-- Per Event rates
UPDATE costing_rules SET rate_unit = '$/Event'
WHERE rule_key IN ('BC_PER', 'DH_PER', 'PICK_PER', 'DEL_PER')
  AND rate_unit IS NULL;

-- Per Week rates
UPDATE costing_rules SET rate_unit = '$/Week'
WHERE rule_key IN ('MISC_WK', 'SGA_WK', 'DTOPS_WK', 'ISSAC_WK', 'PP_WK', 'INS_WK', 'TRAILER_WK')
  AND rate_unit IS NULL;

-- Default rate (RPM)
UPDATE costing_rules SET rate_unit = 'Default RPM'
WHERE rule_key = 'RPM_DEFAULT'
  AND rate_unit IS NULL;

-- Verify the update
SELECT rule_key, rule_type, rule_value, rate_unit, description 
FROM costing_rules 
WHERE is_active = true
ORDER BY rule_key;
