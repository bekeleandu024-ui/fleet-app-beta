const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function fixMilesTracking() {
  const client = await pool.connect();
  try {
    console.log('='.repeat(80));
    console.log('FIX MILES TRACKING DATA');
    console.log('='.repeat(80));
    
    // ========================================================================
    // ANALYSIS PHASE
    // ========================================================================
    
    console.log('\n📊 PHASE 1: ANALYZING CURRENT DATA STATE\n');
    
    // Check trips miles data
    const tripsAnalysis = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(planned_miles) as has_planned_miles,
        COUNT(distance_miles) as has_distance_miles,
        COUNT(actual_miles) as has_actual_miles,
        COUNT(actual_fuel_gallons) as has_actual_fuel,
        COUNT(estimated_fuel_gallons) as has_estimated_fuel
      FROM trips
    `);
    console.log('TRIPS miles analysis:');
    console.table(tripsAnalysis.rows[0]);
    
    // Check trip_costs miles data
    const costsAnalysis = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(miles) as has_miles,
        COUNT(actual_miles) as has_actual_miles
      FROM trip_costs
    `);
    console.log('TRIP_COSTS miles analysis:');
    console.table(costsAnalysis.rows[0]);
    
    // Sample of trips with miles data
    const sampleTrips = await client.query(`
      SELECT trip_number, status, planned_miles, distance_miles, actual_miles
      FROM trips LIMIT 5
    `);
    console.log('Sample trips before fix:');
    console.table(sampleTrips.rows);
    
    // ========================================================================
    // FIX PHASE
    // ========================================================================
    
    console.log('\n' + '='.repeat(80));
    console.log('📝 PHASE 2: APPLYING FIXES');
    console.log('='.repeat(80));
    
    await client.query('BEGIN');
    
    // ---------------------------------------------------------------------
    // FIX 1: Populate actual_miles in trips from distance_miles or planned_miles
    // For completed trips, actual_miles should equal the calculated distance
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 1: Populating trips.actual_miles from available distance data...');
    
    // For completed/delivered trips, use distance_miles as actual_miles
    const fixActualMilesFromDistance = await client.query(`
      UPDATE trips
      SET actual_miles = distance_miles
      WHERE actual_miles IS NULL
        AND distance_miles IS NOT NULL
        AND status IN ('completed', 'delivered', 'closed')
    `);
    console.log(`   ✅ Updated ${fixActualMilesFromDistance.rowCount} completed trips with actual_miles from distance_miles`);
    
    // For other trips with distance_miles, also populate actual_miles
    const fixActualMilesAll = await client.query(`
      UPDATE trips
      SET actual_miles = distance_miles
      WHERE actual_miles IS NULL
        AND distance_miles IS NOT NULL
    `);
    console.log(`   ✅ Updated ${fixActualMilesAll.rowCount} additional trips with actual_miles from distance_miles`);
    
    // If still NULL, use planned_miles as fallback
    const fixActualMilesFromPlanned = await client.query(`
      UPDATE trips
      SET actual_miles = planned_miles
      WHERE actual_miles IS NULL
        AND planned_miles IS NOT NULL
    `);
    console.log(`   ✅ Updated ${fixActualMilesFromPlanned.rowCount} trips with actual_miles from planned_miles (fallback)`);
    
    // ---------------------------------------------------------------------
    // FIX 2: Sync planned_miles from distance_miles if planned is NULL
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 2: Syncing planned_miles from distance_miles...');
    
    const fixPlannedMiles = await client.query(`
      UPDATE trips
      SET planned_miles = distance_miles
      WHERE planned_miles IS NULL
        AND distance_miles IS NOT NULL
    `);
    console.log(`   ✅ Updated ${fixPlannedMiles.rowCount} trips with planned_miles from distance_miles`);
    
    // ---------------------------------------------------------------------
    // FIX 3: Calculate estimated_fuel_gallons (assuming ~6 MPG for trucks)
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 3: Calculating estimated_fuel_gallons...');
    
    const AVG_MPG = 6.5; // Average MPG for semi trucks
    
    const fixEstimatedFuel = await client.query(`
      UPDATE trips
      SET estimated_fuel_gallons = ROUND((COALESCE(distance_miles, planned_miles) / ${AVG_MPG})::numeric, 2)
      WHERE estimated_fuel_gallons IS NULL
        AND (distance_miles IS NOT NULL OR planned_miles IS NOT NULL)
    `);
    console.log(`   ✅ Calculated estimated_fuel_gallons for ${fixEstimatedFuel.rowCount} trips (using ${AVG_MPG} MPG)`);
    
    // ---------------------------------------------------------------------
    // FIX 4: Populate actual_fuel_gallons for completed trips
    // For completed trips, actual fuel = estimated fuel (until real tracking exists)
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 4: Populating actual_fuel_gallons for completed trips...');
    
    const fixActualFuel = await client.query(`
      UPDATE trips
      SET actual_fuel_gallons = estimated_fuel_gallons
      WHERE actual_fuel_gallons IS NULL
        AND estimated_fuel_gallons IS NOT NULL
        AND status IN ('completed', 'delivered', 'closed')
    `);
    console.log(`   ✅ Updated ${fixActualFuel.rowCount} completed trips with actual_fuel_gallons`);
    
    // ---------------------------------------------------------------------
    // FIX 5: Update trip_costs.actual_miles from trips or trip_costs.miles
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 5: Populating trip_costs.actual_miles...');
    
    // First try to match with trips table
    const fixCostsActualMilesFromTrips = await client.query(`
      UPDATE trip_costs tc
      SET actual_miles = t.actual_miles
      FROM trips t
      WHERE tc.trip_id = t.id
        AND tc.actual_miles IS NULL
        AND t.actual_miles IS NOT NULL
    `);
    console.log(`   ✅ Updated ${fixCostsActualMilesFromTrips.rowCount} trip_costs with actual_miles from trips (by trip_id)`);
    
    // Also match by order_id
    const fixCostsActualMilesFromTripsByOrder = await client.query(`
      UPDATE trip_costs tc
      SET actual_miles = t.actual_miles
      FROM trips t
      WHERE tc.order_id = t.order_id::text
        AND tc.actual_miles IS NULL
        AND t.actual_miles IS NOT NULL
    `);
    console.log(`   ✅ Updated ${fixCostsActualMilesFromTripsByOrder.rowCount} trip_costs with actual_miles from trips (by order_id)`);
    
    // Use the calculated miles column as fallback for actual_miles
    const fixCostsActualMilesFromMiles = await client.query(`
      UPDATE trip_costs
      SET actual_miles = miles
      WHERE actual_miles IS NULL
        AND miles IS NOT NULL
    `);
    console.log(`   ✅ Updated ${fixCostsActualMilesFromMiles.rowCount} trip_costs with actual_miles from miles column`);
    
    await client.query('COMMIT');
    console.log('\n✅ All fixes committed successfully!');
    
    // ========================================================================
    // VERIFICATION PHASE
    // ========================================================================
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 PHASE 3: VERIFYING RESULTS');
    console.log('='.repeat(80));
    
    // Re-check trips
    const tripsAfter = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(planned_miles) as has_planned_miles,
        COUNT(distance_miles) as has_distance_miles,
        COUNT(actual_miles) as has_actual_miles,
        COUNT(actual_fuel_gallons) as has_actual_fuel,
        COUNT(estimated_fuel_gallons) as has_estimated_fuel
      FROM trips
    `);
    console.log('\nTRIPS miles after fix:');
    console.table(tripsAfter.rows[0]);
    
    // Re-check trip_costs
    const costsAfter = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(miles) as has_miles,
        COUNT(actual_miles) as has_actual_miles
      FROM trip_costs
    `);
    console.log('TRIP_COSTS miles after fix:');
    console.table(costsAfter.rows[0]);
    
    // Sample of fixed trips
    console.log('\n📋 Sample of Fixed Trips:');
    const sampleFixed = await client.query(`
      SELECT 
        trip_number, 
        status,
        planned_miles,
        distance_miles,
        actual_miles,
        estimated_fuel_gallons,
        actual_fuel_gallons
      FROM trips
      LIMIT 5
    `);
    console.table(sampleFixed.rows);
    
    // Sample of fixed trip_costs
    console.log('\n📋 Sample of Fixed Trip Costs:');
    const sampleCosts = await client.query(`
      SELECT 
        order_id,
        miles,
        actual_miles,
        total_cost
      FROM trip_costs
      LIMIT 5
    `);
    console.table(sampleCosts.rows);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ MILES TRACKING FIX COMPLETE');
    console.log('='.repeat(80));
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error occurred, rolled back changes:', err);
    throw err;
  } finally {
    client.release();
  }
}

fixMilesTracking()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
