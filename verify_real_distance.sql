-- ============================================================================
-- Verify Real Distance Implementation
-- Run these queries to check your distance calculation setup
-- ============================================================================

-- Step 1: Check if migration columns exist
-- Expected: Should return 5 rows showing new distance columns
-- ============================================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trips' 
  AND column_name IN ('distance_miles', 'duration_hours', 'distance_calculated_at', 
                      'distance_calculation_provider', 'distance_calculation_method')
ORDER BY column_name;

-- Step 2: Check if distance_cache table exists
-- Expected: Should return table info
-- ============================================================================
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'distance_cache';

-- Step 3: Get distance calculation coverage
-- Shows how many trips have distance vs missing
-- ============================================================================
SELECT 
    COUNT(*) as total_trips,
    COUNT(*) FILTER (WHERE distance_miles IS NOT NULL) as trips_with_distance,
    COUNT(*) FILTER (WHERE distance_miles IS NULL) as trips_missing_distance,
    ROUND(
        COUNT(*) FILTER (WHERE distance_miles IS NOT NULL)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) as coverage_percentage
FROM trips;

-- Step 4: View trips with coordinates but no distance
-- These are candidates for distance calculation
-- ============================================================================
SELECT 
    id,
    pickup_location,
    dropoff_location,
    pickup_lat,
    pickup_lng,
    dropoff_lat,
    dropoff_lng,
    distance_miles,
    status,
    created_at
FROM trips 
WHERE distance_miles IS NULL 
  AND pickup_lat IS NOT NULL 
  AND pickup_lng IS NOT NULL
  AND dropoff_lat IS NOT NULL 
  AND dropoff_lng IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: View recently calculated distances
-- Shows trips that have been successfully calculated
-- ============================================================================
SELECT 
    id,
    pickup_location,
    dropoff_location,
    distance_miles,
    duration_hours,
    distance_calculation_provider,
    distance_calculation_method,
    distance_calculated_at,
    created_at
FROM trips 
WHERE distance_miles IS NOT NULL
ORDER BY distance_calculated_at DESC NULLS LAST
LIMIT 10;

-- Step 6: Distance statistics by provider
-- Shows which API providers are being used
-- ============================================================================
SELECT 
    distance_calculation_provider,
    COUNT(*) as calculation_count,
    ROUND(AVG(distance_miles), 2) as avg_distance_miles,
    ROUND(AVG(duration_hours), 2) as avg_duration_hours,
    MIN(distance_calculated_at) as first_calculation,
    MAX(distance_calculated_at) as last_calculation
FROM trips 
WHERE distance_miles IS NOT NULL
GROUP BY distance_calculation_provider
ORDER BY calculation_count DESC;

-- Step 7: Check cache statistics
-- Shows cache performance
-- ============================================================================
SELECT 
    COUNT(*) as cached_routes,
    SUM(hit_count) as total_cache_hits,
    ROUND(AVG(hit_count), 2) as avg_hits_per_route,
    ROUND(AVG(distance_miles), 2) as avg_cached_distance,
    provider,
    COUNT(*) FILTER (WHERE expires_at > NOW()) as active_entries,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_entries
FROM distance_cache
GROUP BY provider
ORDER BY cached_routes DESC;

-- Step 8: Find trips with missing coordinates
-- These cannot be calculated and need coordinate data
-- ============================================================================
SELECT 
    id,
    pickup_location,
    dropoff_location,
    pickup_lat IS NULL as missing_pickup_lat,
    pickup_lng IS NULL as missing_pickup_lng,
    dropoff_lat IS NULL as missing_dropoff_lat,
    dropoff_lng IS NULL as missing_dropoff_lng,
    status,
    created_at
FROM trips 
WHERE distance_miles IS NULL
  AND (
    pickup_lat IS NULL OR 
    pickup_lng IS NULL OR 
    dropoff_lat IS NULL OR 
    dropoff_lng IS NULL
  )
ORDER BY created_at DESC
LIMIT 10;

-- Step 9: Distance calculation timeline
-- Shows when distances were calculated over time
-- ============================================================================
SELECT 
    DATE(distance_calculated_at) as calculation_date,
    COUNT(*) as trips_calculated,
    ROUND(AVG(distance_miles), 2) as avg_distance,
    MIN(distance_miles) as min_distance,
    MAX(distance_miles) as max_distance
FROM trips 
WHERE distance_calculated_at IS NOT NULL
GROUP BY DATE(distance_calculated_at)
ORDER BY calculation_date DESC
LIMIT 30;

-- Step 10: Trips with unusually high distances
-- May indicate calculation errors or very long routes
-- ============================================================================
SELECT 
    id,
    pickup_location,
    dropoff_location,
    distance_miles,
    duration_hours,
    distance_calculation_provider,
    distance_calculated_at
FROM trips 
WHERE distance_miles > 1000  -- More than 1000 miles
ORDER BY distance_miles DESC
LIMIT 10;

-- Step 11: Compare calculated vs planned/actual miles
-- Shows accuracy if you have existing mileage data
-- ============================================================================
SELECT 
    id,
    pickup_location,
    dropoff_location,
    planned_miles,
    actual_miles,
    distance_miles as calculated_miles,
    ROUND(ABS(distance_miles - COALESCE(actual_miles, planned_miles)), 2) as variance_miles,
    ROUND(
        ABS(distance_miles - COALESCE(actual_miles, planned_miles)) / 
        NULLIF(COALESCE(actual_miles, planned_miles), 0) * 100, 
        2
    ) as variance_percentage
FROM trips 
WHERE distance_miles IS NOT NULL 
  AND (planned_miles IS NOT NULL OR actual_miles IS NOT NULL)
ORDER BY variance_percentage DESC NULLS LAST
LIMIT 10;

-- Step 12: Most frequently cached routes
-- Shows which routes are hit most often
-- ============================================================================
SELECT 
    origin_location,
    destination_location,
    distance_miles,
    duration_hours,
    provider,
    hit_count,
    created_at,
    last_accessed_at,
    expires_at
FROM distance_cache
ORDER BY hit_count DESC
LIMIT 20;

-- ============================================================================
-- Quick Fix Queries
-- ============================================================================

-- Fix A: Manually set distance for a specific trip (if you know the distance)
-- Uncomment and modify as needed:
-- UPDATE trips 
-- SET 
--     distance_miles = 108.23,
--     duration_hours = 1.97,
--     distance_calculated_at = NOW(),
--     distance_calculation_provider = 'manual',
--     distance_calculation_method = 'manual'
-- WHERE id = 'YOUR-TRIP-ID-HERE';

-- Fix B: Clear distance for a trip to force recalculation
-- Uncomment and modify as needed:
-- UPDATE trips 
-- SET 
--     distance_miles = NULL,
--     duration_hours = NULL,
--     distance_calculated_at = NULL,
--     distance_calculation_provider = NULL
-- WHERE id = 'YOUR-TRIP-ID-HERE';

-- Fix C: Add coordinates to a trip so distance can be calculated
-- Uncomment and modify as needed:
-- UPDATE trips 
-- SET 
--     pickup_lat = 43.5448,
--     pickup_lng = -80.2482,
--     dropoff_lat = 42.8864,
--     dropoff_lng = -78.8784
-- WHERE id = 'YOUR-TRIP-ID-HERE';

-- Fix D: Clean up expired cache entries
-- SELECT cleanup_expired_distance_cache();

-- Fix E: Get cache statistics using the view
-- SELECT * FROM v_distance_cache_stats;

-- Fix F: Find all trips missing distance using the view
-- SELECT * FROM v_trips_missing_distance LIMIT 20;

-- ============================================================================
-- Success Criteria Check
-- Run this to verify everything is working
-- ============================================================================
DO $$
DECLARE
    v_has_distance_column BOOLEAN;
    v_has_duration_column BOOLEAN;
    v_has_cache_table BOOLEAN;
    v_total_trips INTEGER;
    v_calculated_trips INTEGER;
    v_coverage_pct NUMERIC;
    v_cache_entries INTEGER;
BEGIN
    -- Check columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trips' AND column_name = 'distance_miles'
    ) INTO v_has_distance_column;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trips' AND column_name = 'duration_hours'
    ) INTO v_has_duration_column;
    
    -- Check cache table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'distance_cache'
    ) INTO v_has_cache_table;
    
    -- Get coverage stats
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE distance_miles IS NOT NULL),
        ROUND(COUNT(*) FILTER (WHERE distance_miles IS NOT NULL)::numeric / NULLIF(COUNT(*), 0) * 100, 2)
    INTO v_total_trips, v_calculated_trips, v_coverage_pct
    FROM trips;
    
    -- Get cache entries
    SELECT COUNT(*) INTO v_cache_entries FROM distance_cache;
    
    -- Print results
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Distance Calculation System Status';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Migration Status:';
    RAISE NOTICE '  ✓ distance_miles column: %', CASE WHEN v_has_distance_column THEN 'EXISTS' ELSE 'MISSING ❌' END;
    RAISE NOTICE '  ✓ duration_hours column: %', CASE WHEN v_has_duration_column THEN 'EXISTS' ELSE 'MISSING ❌' END;
    RAISE NOTICE '  ✓ distance_cache table: %', CASE WHEN v_has_cache_table THEN 'EXISTS' ELSE 'MISSING ❌' END;
    RAISE NOTICE '';
    RAISE NOTICE 'Calculation Coverage:';
    RAISE NOTICE '  Total trips: %', v_total_trips;
    RAISE NOTICE '  Calculated: %', v_calculated_trips;
    RAISE NOTICE '  Missing: %', v_total_trips - v_calculated_trips;
    RAISE NOTICE '  Coverage: %%%', v_coverage_pct;
    RAISE NOTICE '';
    RAISE NOTICE 'Cache Performance:';
    RAISE NOTICE '  Cached routes: %', v_cache_entries;
    RAISE NOTICE '';
    
    IF v_has_distance_column AND v_has_duration_column AND v_has_cache_table THEN
        RAISE NOTICE '✅ SUCCESS: Migration completed successfully!';
        IF v_coverage_pct < 50 THEN
            RAISE NOTICE '⚠️  WARNING: Low coverage (%.2%%). Run batch calculation.', v_coverage_pct;
        ELSIF v_coverage_pct >= 80 THEN
            RAISE NOTICE '🎉 EXCELLENT: %.2%% coverage!', v_coverage_pct;
        END IF;
    ELSE
        RAISE NOTICE '❌ ERROR: Migration incomplete. Run migration script.';
    END IF;
    
    RAISE NOTICE '============================================';
END $$;
