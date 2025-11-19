-- Quick Diagnostic: Check Current Distance Values
-- Run this to see what distance values currently exist in your trips

SELECT 
    id,
    SUBSTRING(id::text, 1, 8) as trip_short_id,
    pickup_location,
    dropoff_location,
    
    -- NEW calculated columns (from migration)
    distance_miles as real_calculated_distance,
    duration_hours as real_calculated_duration,
    distance_calculated_at,
    distance_calculation_provider,
    
    -- OLD existing columns (mock/estimated data)
    planned_miles as old_planned_miles,
    actual_miles as old_actual_miles,
    
    -- What the API will return (priority order)
    COALESCE(
        distance_miles,      -- Priority 1: Real calculated (from migration)
        actual_miles,        -- Priority 2: Actual recorded
        planned_miles        -- Priority 3: Estimated/planned
    ) as api_will_return,
    
    -- Data source indicator
    CASE 
        WHEN distance_miles IS NOT NULL THEN '✅ REAL (calculated)'
        WHEN actual_miles IS NOT NULL THEN '⚠️ OLD (actual_miles)'
        WHEN planned_miles IS NOT NULL THEN '⚠️ OLD (planned_miles)'
        ELSE '❌ MISSING'
    END as data_source,
    
    status,
    created_at
FROM trips
ORDER BY created_at DESC
LIMIT 20;

-- Summary of distance data quality
SELECT 
    COUNT(*) as total_trips,
    COUNT(distance_miles) as has_real_distance,
    COUNT(actual_miles) as has_actual_miles,
    COUNT(planned_miles) as has_planned_miles,
    COUNT(*) - COUNT(distance_miles) as needs_calculation,
    ROUND(
        COUNT(distance_miles)::numeric / NULLIF(COUNT(*), 0) * 100,
        2
    ) as real_distance_coverage_pct
FROM trips;

-- Find the specific trip from screenshot (Seattle → Portland, ~750 miles)
SELECT 
    id,
    SUBSTRING(id::text, 1, 8) as trip_short_id,
    pickup_location,
    dropoff_location,
    distance_miles as real_distance,
    planned_miles as old_planned,
    actual_miles as old_actual,
    COALESCE(distance_miles, actual_miles, planned_miles) as currently_showing,
    status
FROM trips
WHERE 
    (pickup_location ILIKE '%seattle%' OR pickup_location ILIKE '%wa%')
    AND (dropoff_location ILIKE '%portland%' OR dropoff_location ILIKE '%or%')
ORDER BY created_at DESC
LIMIT 5;
