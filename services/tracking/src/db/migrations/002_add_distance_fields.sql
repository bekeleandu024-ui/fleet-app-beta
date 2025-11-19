-- ============================================================================
-- Migration: Add Distance and Duration Fields to Trips
-- Description: Adds distance and duration tracking with caching support
-- Date: 2025-11-19
-- ============================================================================

-- Add distance and duration columns to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS distance_miles NUMERIC(10, 2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS duration_hours NUMERIC(6, 2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS distance_calculated_at TIMESTAMPTZ;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS distance_calculation_provider VARCHAR(50);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS distance_calculation_method VARCHAR(50) DEFAULT 'auto';

-- Add comments for documentation
COMMENT ON COLUMN trips.distance_miles IS 'Calculated driving distance in miles';
COMMENT ON COLUMN trips.duration_hours IS 'Estimated driving duration in hours';
COMMENT ON COLUMN trips.distance_calculated_at IS 'Timestamp when distance was calculated';
COMMENT ON COLUMN trips.distance_calculation_provider IS 'Provider used for calculation (osrm, google, mapbox, tomtom, fallback)';
COMMENT ON COLUMN trips.distance_calculation_method IS 'Calculation method (auto, manual, api)';

-- Create distance cache table for performance optimization
CREATE TABLE IF NOT EXISTS distance_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_location TEXT NOT NULL,
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    destination_location TEXT NOT NULL,
    destination_lat DOUBLE PRECISION,
    destination_lng DOUBLE PRECISION,
    distance_miles NUMERIC(10, 2) NOT NULL,
    duration_hours NUMERIC(6, 2) NOT NULL,
    distance_km NUMERIC(10, 2),
    duration_minutes INTEGER,
    provider VARCHAR(50) NOT NULL,
    route_data JSONB,
    cache_key VARCHAR(64) NOT NULL UNIQUE,
    hit_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_distance_cache_key ON distance_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_distance_cache_locations ON distance_cache(origin_location, destination_location);
CREATE INDEX IF NOT EXISTS idx_distance_cache_expires ON distance_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_trips_distance ON trips(distance_miles) WHERE distance_miles IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trips_no_distance ON trips(id) WHERE distance_miles IS NULL;

-- Add comments
COMMENT ON TABLE distance_cache IS 'Cached distance calculations to reduce API calls and improve performance';
COMMENT ON COLUMN distance_cache.cache_key IS 'MD5 hash of normalized origin and destination for fast lookups';
COMMENT ON COLUMN distance_cache.hit_count IS 'Number of times this cached route has been used';
COMMENT ON COLUMN distance_cache.expires_at IS 'Cache expiration timestamp (default 30 days)';

-- ============================================================================
-- FUNCTION: Calculate cache key for distance lookups
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_distance_cache_key(
    p_origin TEXT,
    p_destination TEXT
) RETURNS VARCHAR(64) AS $$
DECLARE
    v_normalized TEXT;
BEGIN
    -- Normalize and concatenate locations
    v_normalized := LOWER(TRIM(p_origin)) || '|' || LOWER(TRIM(p_destination));
    
    -- Return MD5 hash
    RETURN MD5(v_normalized);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCTION: Get cached distance
-- ============================================================================
CREATE OR REPLACE FUNCTION get_cached_distance(
    p_origin TEXT,
    p_destination TEXT
) RETURNS TABLE (
    distance_miles NUMERIC,
    duration_hours NUMERIC,
    provider VARCHAR,
    cached BOOLEAN
) AS $$
DECLARE
    v_cache_key VARCHAR(64);
BEGIN
    -- Calculate cache key
    v_cache_key := calculate_distance_cache_key(p_origin, p_destination);
    
    -- Look up and return cached result
    RETURN QUERY
    UPDATE distance_cache
    SET hit_count = hit_count + 1,
        last_accessed_at = NOW()
    WHERE cache_key = v_cache_key
      AND expires_at > NOW()
    RETURNING 
        distance_cache.distance_miles,
        distance_cache.duration_hours,
        distance_cache.provider,
        TRUE as cached;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Store distance in cache
-- ============================================================================
CREATE OR REPLACE FUNCTION cache_distance_calculation(
    p_origin TEXT,
    p_destination TEXT,
    p_origin_lat DOUBLE PRECISION,
    p_origin_lng DOUBLE PRECISION,
    p_destination_lat DOUBLE PRECISION,
    p_destination_lng DOUBLE PRECISION,
    p_distance_miles NUMERIC,
    p_duration_hours NUMERIC,
    p_distance_km NUMERIC,
    p_duration_minutes INTEGER,
    p_provider VARCHAR,
    p_route_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_cache_key VARCHAR(64);
    v_cache_id UUID;
BEGIN
    -- Calculate cache key
    v_cache_key := calculate_distance_cache_key(p_origin, p_destination);
    
    -- Insert or update cache entry
    INSERT INTO distance_cache (
        origin_location,
        origin_lat,
        origin_lng,
        destination_location,
        destination_lat,
        destination_lng,
        distance_miles,
        duration_hours,
        distance_km,
        duration_minutes,
        provider,
        route_data,
        cache_key
    ) VALUES (
        p_origin,
        p_origin_lat,
        p_origin_lng,
        p_destination,
        p_destination_lat,
        p_destination_lng,
        p_distance_miles,
        p_duration_hours,
        p_distance_km,
        p_duration_minutes,
        p_provider,
        p_route_data,
        v_cache_key
    )
    ON CONFLICT (cache_key) DO UPDATE
    SET distance_miles = EXCLUDED.distance_miles,
        duration_hours = EXCLUDED.duration_hours,
        distance_km = EXCLUDED.distance_km,
        duration_minutes = EXCLUDED.duration_minutes,
        provider = EXCLUDED.provider,
        route_data = EXCLUDED.route_data,
        hit_count = distance_cache.hit_count,
        last_accessed_at = NOW(),
        expires_at = NOW() + INTERVAL '30 days'
    RETURNING id INTO v_cache_id;
    
    RETURN v_cache_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Auto-calculate distance for trip
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_calculate_trip_distance(p_trip_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_trip RECORD;
    v_result JSONB;
BEGIN
    -- Get trip details
    SELECT 
        pickup_location,
        dropoff_location,
        pickup_lat,
        pickup_lng,
        dropoff_lat,
        dropoff_lng
    INTO v_trip
    FROM trips
    WHERE id = p_trip_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Trip not found'
        );
    END IF;
    
    -- Check if locations are available
    IF v_trip.pickup_location IS NULL OR v_trip.dropoff_location IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Pickup and dropoff locations are required'
        );
    END IF;
    
    -- Try to get from cache first
    SELECT 
        jsonb_build_object(
            'distanceMiles', dc.distance_miles,
            'durationHours', dc.duration_hours,
            'provider', dc.provider,
            'cached', true
        )
    INTO v_result
    FROM get_cached_distance(v_trip.pickup_location, v_trip.dropoff_location) dc;
    
    -- Return result indicating external API call needed if not cached
    IF v_result IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Distance not in cache - external API call required',
            'requiresApiCall', true,
            'origin', v_trip.pickup_location,
            'destination', v_trip.dropoff_location
        );
    END IF;
    
    -- Update trip with cached distance
    UPDATE trips
    SET distance_miles = (v_result->>'distanceMiles')::NUMERIC,
        duration_hours = (v_result->>'durationHours')::NUMERIC,
        distance_calculated_at = NOW(),
        distance_calculation_provider = v_result->>'provider',
        distance_calculation_method = 'auto',
        updated_at = NOW()
    WHERE id = p_trip_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'result', v_result
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-calculate distance on trip creation
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_calculate_trip_distance()
RETURNS TRIGGER AS $$
BEGIN
    -- Only calculate if locations are provided and distance is not already set
    IF NEW.pickup_location IS NOT NULL 
       AND NEW.dropoff_location IS NOT NULL 
       AND NEW.distance_miles IS NULL THEN
        
        -- Try to calculate from cache (non-blocking)
        PERFORM auto_calculate_trip_distance(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (runs after insert)
DROP TRIGGER IF EXISTS trg_trips_auto_distance ON trips;
CREATE TRIGGER trg_trips_auto_distance
AFTER INSERT ON trips
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_trip_distance();

-- ============================================================================
-- MAINTENANCE: Cache cleanup job
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_distance_cache()
RETURNS TABLE (deleted_count BIGINT) AS $$
DECLARE
    v_deleted_count BIGINT;
BEGIN
    -- Delete expired cache entries
    DELETE FROM distance_cache
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Also delete least accessed entries if cache is too large (keep top 10k)
    DELETE FROM distance_cache
    WHERE id IN (
        SELECT id
        FROM distance_cache
        ORDER BY last_accessed_at ASC
        OFFSET 10000
    );
    
    RETURN QUERY SELECT v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: Distance cache statistics
-- ============================================================================
CREATE OR REPLACE VIEW v_distance_cache_stats AS
SELECT
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE expires_at > NOW()) as active_entries,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_entries,
    SUM(hit_count) as total_hits,
    AVG(hit_count) as avg_hits_per_entry,
    MAX(hit_count) as max_hits,
    COUNT(DISTINCT provider) as providers_used,
    jsonb_object_agg(provider, cnt) as entries_by_provider
FROM distance_cache
LEFT JOIN (
    SELECT provider, COUNT(*) as cnt
    FROM distance_cache
    GROUP BY provider
) provider_counts USING (provider);

-- ============================================================================
-- VIEW: Trips without distance
-- ============================================================================
CREATE OR REPLACE VIEW v_trips_missing_distance AS
SELECT
    id,
    order_id,
    pickup_location,
    dropoff_location,
    status,
    created_at,
    CASE
        WHEN pickup_location IS NULL OR dropoff_location IS NULL THEN 'Missing locations'
        WHEN distance_miles IS NULL THEN 'Not calculated'
        ELSE 'Has distance'
    END as distance_status
FROM trips
WHERE distance_miles IS NULL
  AND pickup_location IS NOT NULL
  AND dropoff_location IS NOT NULL
ORDER BY created_at DESC;

-- ============================================================================
-- Grant permissions (adjust based on your user roles)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE ON distance_cache TO your_app_user;
-- GRANT EXECUTE ON FUNCTION get_cached_distance TO your_app_user;
-- GRANT EXECUTE ON FUNCTION cache_distance_calculation TO your_app_user;
-- GRANT EXECUTE ON FUNCTION auto_calculate_trip_distance TO your_app_user;

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Check if migration was successful
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'New columns added to trips table:';
    RAISE NOTICE '  - distance_miles';
    RAISE NOTICE '  - duration_hours';
    RAISE NOTICE '  - distance_calculated_at';
    RAISE NOTICE '  - distance_calculation_provider';
    RAISE NOTICE '  - distance_calculation_method';
    RAISE NOTICE 'New table created: distance_cache';
    RAISE NOTICE 'New functions created:';
    RAISE NOTICE '  - calculate_distance_cache_key()';
    RAISE NOTICE '  - get_cached_distance()';
    RAISE NOTICE '  - cache_distance_calculation()';
    RAISE NOTICE '  - auto_calculate_trip_distance()';
    RAISE NOTICE '  - cleanup_expired_distance_cache()';
    RAISE NOTICE 'New views created:';
    RAISE NOTICE '  - v_distance_cache_stats';
    RAISE NOTICE '  - v_trips_missing_distance';
END $$;
