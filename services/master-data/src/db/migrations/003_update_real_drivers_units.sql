-- Clear existing sample data (handle foreign key constraints)
DELETE FROM trip_costs;
DELETE FROM unit_profiles;
DELETE FROM driver_profiles;

-- Insert real driver profiles with actual names and unit numbers
INSERT INTO driver_profiles (driver_name, unit_number, driver_type, oo_zone, base_wage_cpm, benefits_pct, performance_pct, safety_pct, step_pct, effective_wage_cpm, is_active) VALUES
('Vedran Aleksic', '936008', 'OO', 'ZONE1', 0.7200, 0.1200, 0.0500, 0.0300, 0.0200, 0.8640, true),
('Vedran Aleksic', '936006', 'OO', 'ZONE1', 0.7200, 0.1200, 0.0500, 0.0300, 0.0200, 0.8640, true),
('Thom Kelly', '257470', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Greg Nemcosh', '724305', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Rajinder Kothari', '257455', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Jan Lojko', '730111', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Ron Piche', '724392', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Amarjeet Gandhi', '734407', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Satnam Singh', '734408', 'RNR', NULL, 0.3800, 0.1200, 0.0500, 0.0300, 0.0200, 0.4560, true),
('Adrian Radu', '734406', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Rob Sheets', '257469', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Jeff Jorgensen', '734409', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Chris Osborne', '734457', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Karl Bud', '257467', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Gabriel', '257454', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Harjeet Singh', '724393', 'RNR', NULL, 0.3800, 0.1200, 0.0500, 0.0300, 0.0200, 0.4560, true),
('Chris Cuilliana', '936002', 'OO', 'ZONE2', 0.6800, 0.1200, 0.0500, 0.0300, 0.0200, 0.8160, true),
('Neil Bell', '734406', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Engjell Kefta', '257455', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Yatin Midha', '734408', 'RNR', NULL, 0.3800, 0.1200, 0.0500, 0.0300, 0.0200, 0.4560, true),
('Josip Straha', '936008', 'OO', 'ZONE1', 0.7200, 0.1200, 0.0500, 0.0300, 0.0200, 0.8640, true),
('Jeff Churchill', '734401', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Nermin Ciric', '936012', 'OO', 'ZONE2', 0.6800, 0.1200, 0.0500, 0.0300, 0.0200, 0.8160, true),
('Penca Dragicevic', '936005', 'OO', 'ZONE2', 0.6800, 0.1200, 0.0500, 0.0300, 0.0200, 0.8160, true),
('Tadeusz Dul', '936015', 'OO', 'ZONE2', 0.6800, 0.1200, 0.0500, 0.0300, 0.0200, 0.8160, true),
('Mario Cerni', '936011', 'OO', 'ZONE2', 0.6800, 0.1200, 0.0500, 0.0300, 0.0200, 0.8160, true),
('Denac Starr', '734404', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Johnni Pitman', '730110', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Greg Mcintosh', '734396', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Robert Knight', '734402', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Yin Tong', '936007', 'OO', 'ZONE2', 0.6800, 0.1200, 0.0500, 0.0300, 0.0200, 0.8160, true),
('Borislav Pascasicek', '257465', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true);

-- Insert unit profiles for each unit with appropriate weekly costs
-- COM (Company) drivers: Full truck + trailer costs
-- RNR (Rental) drivers: Reduced truck costs
-- OO (Owner Operator): No truck/trailer costs (they own it)

-- OO Units (Owner Operators - minimal fixed costs)
INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '936008', driver_id, 0.00, 0.00, 250.00, 35.00, 25.00, 180.00, 120.00, 75.00, 685.00, true FROM driver_profiles WHERE unit_number = '936008' LIMIT 1;

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '936006', driver_id, 0.00, 0.00, 250.00, 35.00, 25.00, 180.00, 120.00, 75.00, 685.00, true FROM driver_profiles WHERE unit_number = '936006' LIMIT 1;

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '936002', driver_id, 0.00, 0.00, 250.00, 35.00, 25.00, 180.00, 120.00, 75.00, 685.00, true FROM driver_profiles WHERE unit_number = '936002';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '936012', driver_id, 0.00, 0.00, 250.00, 35.00, 25.00, 180.00, 120.00, 75.00, 685.00, true FROM driver_profiles WHERE unit_number = '936012';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '936005', driver_id, 0.00, 0.00, 250.00, 35.00, 25.00, 180.00, 120.00, 75.00, 685.00, true FROM driver_profiles WHERE unit_number = '936005';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '936015', driver_id, 0.00, 0.00, 250.00, 35.00, 25.00, 180.00, 120.00, 75.00, 685.00, true FROM driver_profiles WHERE unit_number = '936015';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '936011', driver_id, 0.00, 0.00, 250.00, 35.00, 25.00, 180.00, 120.00, 75.00, 685.00, true FROM driver_profiles WHERE unit_number = '936011';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '936007', driver_id, 0.00, 0.00, 250.00, 35.00, 25.00, 180.00, 120.00, 75.00, 685.00, true FROM driver_profiles WHERE unit_number = '936007';

-- COM Units (Company drivers - full costs)
INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '257470', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '257470';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '724305', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '724305';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '257455', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '257455' LIMIT 1;

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '730111', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '730111';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '724392', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '724392';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '734407', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '734407';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '734406', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '734406' LIMIT 1;

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '257469', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '257469';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '734409', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '734409';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '734457', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '734457';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '257467', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '257467';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '257454', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '257454';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '734401', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '734401';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '734404', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '734404';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '730110', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '730110';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '734396', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '734396';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '734402', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '734402';

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '257465', driver_id, 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true FROM driver_profiles WHERE unit_number = '257465';

-- RNR Units (Rental drivers - reduced truck costs)
INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '734408', driver_id, 650.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1785.00, true FROM driver_profiles WHERE unit_number = '734408' LIMIT 1;

INSERT INTO unit_profiles (unit_number, driver_id, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) 
SELECT '724393', driver_id, 650.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1785.00, true FROM driver_profiles WHERE unit_number = '724393';
