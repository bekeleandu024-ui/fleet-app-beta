-- Seed costing rules based on VBA logic

-- Base wage rates by driver type
INSERT INTO costing_rules (rule_key, rule_type, rule_value, description) VALUES
('BASE_WAGE', 'COM', 0.4500, 'Company driver base CPM'),
('BASE_WAGE', 'RNR', 0.3800, 'Rental driver base CPM'),
('BASE_WAGE', 'OO_ZONE1', 0.7200, 'Owner operator zone 1 base CPM'),
('BASE_WAGE', 'OO_ZONE2', 0.6800, 'Owner operator zone 2 base CPM'),
('BASE_WAGE', 'OO_ZONE3', 0.6500, 'Owner operator zone 3 base CPM'),
('BASE_WAGE', 'OO', 0.7000, 'Owner operator fallback base CPM');

-- Wage adders (percentages of base)
INSERT INTO costing_rules (rule_key, rule_type, rule_value, description) VALUES
('BENEFITS_PCT', 'GLOBAL', 0.1200, 'Benefits percentage of base wage'),
('PERF_PCT', 'GLOBAL', 0.0500, 'Performance bonus percentage'),
('SAFETY_PCT', 'GLOBAL', 0.0300, 'Safety bonus percentage'),
('STEP_PCT', 'GLOBAL', 0.0200, 'Step progression percentage');

-- Rolling costs (CPM)
INSERT INTO costing_rules (rule_key, rule_type, rule_value, description) VALUES
('TRK_RM_CPM', 'GLOBAL', 0.1200, 'Truck repair & maintenance CPM'),
('TRL_RM_CPM', 'GLOBAL', 0.0400, 'Trailer repair & maintenance CPM'),
('FUEL_CPM', 'COM', 0.4500, 'Fuel CPM for company drivers'),
('FUEL_CPM', 'RNR', 0.4200, 'Fuel CPM for rental drivers'),
('FUEL_CPM', 'OO', 0.5000, 'Fuel CPM for owner operators');

-- Weekly fixed costs (per week)
INSERT INTO costing_rules (rule_key, rule_type, rule_value, description) VALUES
('TRAILER_WK', 'GLOBAL', 250.00, 'Trailer lease per week'),
('INS_WK', 'GLOBAL', 450.00, 'Insurance per week'),
('ISSAC_WK', 'GLOBAL', 35.00, 'Isaac ELD per week'),
('PP_WK', 'GLOBAL', 25.00, 'PrePass per week'),
('SGA_WK', 'GLOBAL', 180.00, 'SG&A allocation per week'),
('DTOPS_WK', 'GLOBAL', 120.00, 'Dispatch/ops allocation per week'),
('MISC_WK', 'GLOBAL', 75.00, 'Miscellaneous weekly costs');

-- Accessorial costs (per event)
INSERT INTO costing_rules (rule_key, rule_type, rule_value, description) VALUES
('BC_PER', 'GLOBAL', 15.00, 'Border crossing cost per event'),
('DH_PER', 'GLOBAL', 15.00, 'Drop/hook cost per event'),
('PICK_PER', 'GLOBAL', 30.00, 'Pickup cost per event'),
('DEL_PER', 'GLOBAL', 30.00, 'Delivery cost per event');

-- Event types
INSERT INTO event_types (event_code, event_name, cost_per_event, is_automatic) VALUES
('START', 'Trip Started', 0.00, true),
('PICKUP_ARRIVE', 'Arrived at Pickup', 0.00, true),
('PICKUP_DEPART', 'Departed Pickup / Loaded', 30.00, true),
('BORDER_ARRIVE', 'Arrived at Border', 0.00, true),
('BORDER_CLEAR', 'Border Cleared', 15.00, true),
('DELIVERY_ARRIVE', 'Arrived at Delivery', 0.00, true),
('DELIVERY_COMPLETE', 'Delivery Complete', 30.00, true),
('LAYOVER', 'Layover/Detention', 0.00, false),
('EXTRA_STOP', 'Extra Stop', 0.00, false),
('DROP_HOOK', 'Drop/Hook', 15.00, false);

-- Event detection rules
INSERT INTO event_rules (event_code, trigger_type, trigger_condition) VALUES
('START', 'TRIP_STATUS', '{"status_change": "Planning->In Transit"}'),
('PICKUP_ARRIVE', 'LOCATION', '{"proximity_to": "pickup_location", "radius_miles": 1}'),
('PICKUP_DEPART', 'LOCATION', '{"departed_from": "pickup_location", "radius_miles": 1}'),
('BORDER_ARRIVE', 'LOCATION', '{"proximity_to": "border_crossing", "radius_miles": 5}'),
('BORDER_CLEAR', 'BORDER_CROSSING', '{"countries": ["USA", "CANADA"], "cleared": true}'),
('DELIVERY_ARRIVE', 'LOCATION', '{"proximity_to": "delivery_location", "radius_miles": 1}'),
('DELIVERY_COMPLETE', 'TRIP_STATUS', '{"status_change": "At Delivery->Completed"}');

-- Sample driver profiles
INSERT INTO driver_profiles (driver_name, unit_number, driver_type, oo_zone, base_wage_cpm, benefits_pct, performance_pct, safety_pct, step_pct, effective_wage_cpm, is_active) VALUES
('John Smith', 'UNIT-101', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Jane Doe', 'UNIT-102', 'COM', NULL, 0.4500, 0.1200, 0.0500, 0.0300, 0.0200, 0.5400, true),
('Mike Johnson', 'UNIT-201', 'RNR', NULL, 0.3800, 0.1200, 0.0500, 0.0300, 0.0200, 0.4560, true),
('Sarah Williams', 'UNIT-301', 'OO', 'ZONE1', 0.7200, 0.1200, 0.0500, 0.0300, 0.0200, 0.8640, true),
('Bob Anderson', 'UNIT-302', 'OO', 'ZONE2', 0.6800, 0.1200, 0.0500, 0.0300, 0.0200, 0.8160, true),
('Lisa Brown', 'UNIT-303', 'OO', 'ZONE3', 0.6500, 0.1200, 0.0500, 0.0300, 0.0200, 0.7800, true);

-- Sample unit profiles
INSERT INTO unit_profiles (unit_number, truck_weekly_cost, trailer_weekly_cost, insurance_weekly_cost, isaac_weekly_cost, prepass_weekly_cost, sga_weekly_cost, dtops_weekly_cost, misc_weekly_cost, total_weekly_cost, is_active) VALUES
('UNIT-101', 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true),
('UNIT-102', 850.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1985.00, true),
('UNIT-201', 650.00, 250.00, 450.00, 35.00, 25.00, 180.00, 120.00, 75.00, 1785.00, true),
('UNIT-301', 0.00, 0.00, 250.00, 35.00, 25.00, 180.00, 120.00, 75.00, 685.00, true),
('UNIT-302', 0.00, 0.00, 250.00, 35.00, 25.00, 180.00, 120.00, 75.00, 685.00, true),
('UNIT-303', 0.00, 0.00, 250.00, 35.00, 25.00, 180.00, 120.00, 75.00, 685.00, true);

-- Link drivers to units
UPDATE unit_profiles SET driver_id = (SELECT driver_id FROM driver_profiles WHERE driver_name = 'John Smith') WHERE unit_number = 'UNIT-101';
UPDATE unit_profiles SET driver_id = (SELECT driver_id FROM driver_profiles WHERE driver_name = 'Jane Doe') WHERE unit_number = 'UNIT-102';
UPDATE unit_profiles SET driver_id = (SELECT driver_id FROM driver_profiles WHERE driver_name = 'Mike Johnson') WHERE unit_number = 'UNIT-201';
UPDATE unit_profiles SET driver_id = (SELECT driver_id FROM driver_profiles WHERE driver_name = 'Sarah Williams') WHERE unit_number = 'UNIT-301';
UPDATE unit_profiles SET driver_id = (SELECT driver_id FROM driver_profiles WHERE driver_name = 'Bob Anderson') WHERE unit_number = 'UNIT-302';
UPDATE unit_profiles SET driver_id = (SELECT driver_id FROM driver_profiles WHERE driver_name = 'Lisa Brown') WHERE unit_number = 'UNIT-303';
