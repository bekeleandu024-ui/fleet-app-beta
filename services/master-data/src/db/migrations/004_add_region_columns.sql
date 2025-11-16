-- Add region column to driver_profiles
ALTER TABLE driver_profiles 
ADD COLUMN IF NOT EXISTS region VARCHAR(50);

-- Add region column to unit_profiles
ALTER TABLE unit_profiles 
ADD COLUMN IF NOT EXISTS region VARCHAR(50);

-- Create indexes for region filtering
CREATE INDEX IF NOT EXISTS idx_driver_profiles_region ON driver_profiles(region);
CREATE INDEX IF NOT EXISTS idx_unit_profiles_region ON unit_profiles(region);

-- Update drivers with region assignments (Ontario-based fleet)
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Adrian Radu';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Amarjeet Gandhi';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Borislav Pascasicek';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Chris Cuilliana';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Chris Osborne';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Denac Starr';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Engjell Kefta';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Gabriel';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Greg Mcintosh';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Greg Nemcosh';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Harjeet Singh';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Jan Lojko';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Jeff Churchill';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Jeff Jorgensen';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Johnni Pitman';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Josip Straha';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Karl Bud';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Mario Cerni';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Neil Bell';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Nermin Ciric';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Penca Dragicevic';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Rajinder Kothari';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Robert Knight';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Rob Sheets';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Ron Piche';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Satnam Singh';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Tadeusz Dul';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Thom Kelly';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Vedran Aleksic';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Yatin Midha';
UPDATE driver_profiles SET region = 'Ontario' WHERE driver_name = 'Yin Tong';

-- Update units with region assignments based on their driver
UPDATE unit_profiles 
SET region = (
  SELECT region 
  FROM driver_profiles 
  WHERE driver_profiles.driver_id = unit_profiles.driver_id
);

-- Set default region for any units without drivers
UPDATE unit_profiles 
SET region = 'Ontario' 
WHERE region IS NULL;
