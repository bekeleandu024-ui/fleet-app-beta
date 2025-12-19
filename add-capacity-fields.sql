-- Add capacity fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_weight numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_pallets integer DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pallet_dimensions jsonb DEFAULT '[]';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stackable boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cubic_feet numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS linear_feet_required numeric DEFAULT 0;

-- Add capacity fields to unit_profiles
ALTER TABLE unit_profiles ADD COLUMN IF NOT EXISTS unit_type varchar(50) DEFAULT '53'' Dry Van';
ALTER TABLE unit_profiles ADD COLUMN IF NOT EXISTS max_weight numeric DEFAULT 45000;
ALTER TABLE unit_profiles ADD COLUMN IF NOT EXISTS max_cube numeric DEFAULT 3900;
ALTER TABLE unit_profiles ADD COLUMN IF NOT EXISTS linear_feet numeric DEFAULT 53;
ALTER TABLE unit_profiles ADD COLUMN IF NOT EXISTS pallet_positions integer DEFAULT 26;

-- Add capacity fields to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS current_weight numeric DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS current_cube numeric DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS current_linear_feet numeric DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS utilization_percent numeric DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS limiting_factor varchar(50);
