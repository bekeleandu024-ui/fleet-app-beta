-- AI Performance Optimization Indexes
-- These indexes speed up the AI insights API queries by optimizing joins and lookups

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_id ON orders(id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_time ON orders(pickup_time);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_window_start ON orders(pu_window_start);

-- Trips table indexes  
CREATE INDEX IF NOT EXISTS idx_trips_id ON trips(id);
CREATE INDEX IF NOT EXISTS idx_trips_order_id ON trips(order_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_unit_id ON trips(unit_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

-- Driver profiles indexes
CREATE INDEX IF NOT EXISTS idx_driver_profiles_id ON driver_profiles(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_active ON driver_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_region ON driver_profiles(region);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_unit ON driver_profiles(unit_number);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_active_region ON driver_profiles(is_active, region, driver_type);

-- Unit profiles indexes
CREATE INDEX IF NOT EXISTS idx_unit_profiles_id ON unit_profiles(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_profiles_number ON unit_profiles(unit_number);
CREATE INDEX IF NOT EXISTS idx_unit_profiles_active ON unit_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_unit_profiles_region ON unit_profiles(region);
CREATE INDEX IF NOT EXISTS idx_unit_profiles_active_region ON unit_profiles(is_active, region);

-- Composite indexes for common join patterns
CREATE INDEX IF NOT EXISTS idx_driver_unit_join ON driver_profiles(unit_number, is_active);

-- Analyze tables to update statistics
ANALYZE orders;
ANALYZE trips;
ANALYZE driver_profiles;
ANALYZE unit_profiles;
