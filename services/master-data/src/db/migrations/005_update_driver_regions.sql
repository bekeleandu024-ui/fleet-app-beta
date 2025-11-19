-- Update driver regions to be more distributed across Ontario
UPDATE driver_profiles SET region = 'Southern Ontario' WHERE driver_name = 'Adrian Radu';
UPDATE driver_profiles SET region = 'Southern Ontario' WHERE driver_name = 'Amarjeet Gandhi';
UPDATE driver_profiles SET region = 'Greater Toronto Area' WHERE driver_name = 'Borislav Pascasicek';
UPDATE driver_profiles SET region = 'Southern Ontario' WHERE driver_name = 'Chris Cuilliana';
UPDATE driver_profiles SET region = 'Greater Toronto Area' WHERE driver_name = 'Chris Osborne';
UPDATE driver_profiles SET region = 'Western Ontario' WHERE driver_name = 'Denac Starr';
UPDATE driver_profiles SET region = 'Greater Toronto Area' WHERE driver_name = 'Engjell Kefta';
UPDATE driver_profiles SET region = 'Southern Ontario' WHERE driver_name = 'Gabriel';
UPDATE driver_profiles SET region = 'Western Ontario' WHERE driver_name = 'Greg Mcintosh';
UPDATE driver_profiles SET region = 'Northern Ontario' WHERE driver_name = 'Greg Nemcosh';
UPDATE driver_profiles SET region = 'Greater Toronto Area' WHERE driver_name = 'Harjeet Singh';
UPDATE driver_profiles SET region = 'Western Ontario' WHERE driver_name = 'Jan Lojko';
UPDATE driver_profiles SET region = 'Eastern Ontario' WHERE driver_name = 'Jeff Churchill';
UPDATE driver_profiles SET region = 'Northern Ontario' WHERE driver_name = 'Jeff Jorgensen';
UPDATE driver_profiles SET region = 'Southern Ontario' WHERE driver_name = 'Johnni Pitman';
UPDATE driver_profiles SET region = 'Western Ontario' WHERE driver_name = 'Josip Straha';
UPDATE driver_profiles SET region = 'Greater Toronto Area' WHERE driver_name = 'Karl Bud';
UPDATE driver_profiles SET region = 'Southern Ontario' WHERE driver_name = 'Mario Cerni';
UPDATE driver_profiles SET region = 'Eastern Ontario' WHERE driver_name = 'Neil Bell';
UPDATE driver_profiles SET region = 'Greater Toronto Area' WHERE driver_name = 'Nermin Ciric';
UPDATE driver_profiles SET region = 'Western Ontario' WHERE driver_name = 'Penca Dragicevic';
UPDATE driver_profiles SET region = 'Greater Toronto Area' WHERE driver_name = 'Rajinder Kothari';
UPDATE driver_profiles SET region = 'Southern Ontario' WHERE driver_name = 'Robert Knight';
UPDATE driver_profiles SET region = 'Eastern Ontario' WHERE driver_name = 'Rob Sheets';
UPDATE driver_profiles SET region = 'Northern Ontario' WHERE driver_name = 'Ron Piche';
UPDATE driver_profiles SET region = 'Greater Toronto Area' WHERE driver_name = 'Satnam Singh';
UPDATE driver_profiles SET region = 'Western Ontario' WHERE driver_name = 'Tadeusz Dul';
UPDATE driver_profiles SET region = 'Eastern Ontario' WHERE driver_name = 'Thom Kelly';
UPDATE driver_profiles SET region = 'Southern Ontario' WHERE driver_name = 'Vedran Aleksic';
UPDATE driver_profiles SET region = 'Greater Toronto Area' WHERE driver_name = 'Yatin Midha';
UPDATE driver_profiles SET region = 'Southern Ontario' WHERE driver_name = 'Yin Tong';

-- Update units to inherit their driver's region
UPDATE unit_profiles 
SET region = (
  SELECT region 
  FROM driver_profiles 
  WHERE driver_profiles.driver_id = unit_profiles.driver_id
)
WHERE driver_id IS NOT NULL;

-- Set default region for units without drivers
UPDATE unit_profiles 
SET region = 'Southern Ontario' 
WHERE region IS NULL OR region = 'Ontario';
