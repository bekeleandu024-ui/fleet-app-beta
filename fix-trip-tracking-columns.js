const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function fixTripTrackingColumns() {
  const client = await pool.connect();
  try {
    console.log('='.repeat(80));
    console.log('FIX TRIP TRACKING COLUMNS');
    console.log('='.repeat(80));
    
    // ========================================================================
    // ANALYSIS PHASE
    // ========================================================================
    
    console.log('\n📊 PHASE 1: ANALYZING CURRENT DATA STATE\n');
    
    const analysis = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(delivery_departure) as has_delivery_departure,
        COUNT(delivery_dwell_minutes) as has_delivery_dwell,
        COUNT(delay_risk_pct) as has_delay_risk,
        COUNT(week_start) as has_week_start,
        COUNT(delivery_arrival) as has_delivery_arrival,
        COUNT(pickup_arrival) as has_pickup_arrival,
        COUNT(pickup_departure) as has_pickup_departure,
        COUNT(created_at) as has_created_at,
        COUNT(completed_at) as has_completed_at,
        COUNT(status) as has_status
      FROM trips
    `);
    console.log('Current state:');
    console.table(analysis.rows[0]);
    
    // Check statuses
    const statuses = await client.query(`
      SELECT status, COUNT(*) as cnt FROM trips GROUP BY status ORDER BY cnt DESC
    `);
    console.log('\nTrip statuses:');
    console.table(statuses.rows);
    
    // ========================================================================
    // FIX PHASE
    // ========================================================================
    
    console.log('\n' + '='.repeat(80));
    console.log('📝 PHASE 2: APPLYING FIXES');
    console.log('='.repeat(80));
    
    await client.query('BEGIN');
    
    // ---------------------------------------------------------------------
    // FIX 1: Populate week_start from created_at
    // week_start = start of the week (Monday) for the trip's creation date
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 1: Populating week_start from created_at...');
    
    const fixWeekStart = await client.query(`
      UPDATE trips
      SET week_start = DATE_TRUNC('week', created_at)::date
      WHERE week_start IS NULL
        AND created_at IS NOT NULL
    `);
    console.log(`   ✅ Updated ${fixWeekStart.rowCount} trips with week_start`);
    
    // ---------------------------------------------------------------------
    // FIX 2: Populate delivery_departure for completed trips
    // If completed but no delivery_departure, use completed_at
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 2: Populating delivery_departure for completed trips...');
    
    const fixDeliveryDeparture = await client.query(`
      UPDATE trips
      SET delivery_departure = COALESCE(completed_at, closed_at, delivery_arrival)
      WHERE delivery_departure IS NULL
        AND status IN ('completed', 'delivered', 'closed')
        AND (completed_at IS NOT NULL OR closed_at IS NOT NULL OR delivery_arrival IS NOT NULL)
    `);
    console.log(`   ✅ Updated ${fixDeliveryDeparture.rowCount} trips with delivery_departure`);
    
    // ---------------------------------------------------------------------
    // FIX 3: Calculate delivery_dwell_minutes
    // Time between delivery_arrival and delivery_departure
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 3: Calculating delivery_dwell_minutes...');
    
    const fixDeliveryDwell = await client.query(`
      UPDATE trips
      SET delivery_dwell_minutes = EXTRACT(EPOCH FROM (delivery_departure - delivery_arrival)) / 60
      WHERE delivery_dwell_minutes IS NULL
        AND delivery_arrival IS NOT NULL
        AND delivery_departure IS NOT NULL
        AND delivery_departure >= delivery_arrival
    `);
    console.log(`   ✅ Updated ${fixDeliveryDwell.rowCount} trips with delivery_dwell_minutes`);
    
    // Also calculate pickup_dwell_minutes if missing
    console.log('\n🔧 FIX 3b: Calculating pickup_dwell_minutes...');
    
    const fixPickupDwell = await client.query(`
      UPDATE trips
      SET pickup_dwell_minutes = EXTRACT(EPOCH FROM (pickup_departure - pickup_arrival)) / 60
      WHERE pickup_dwell_minutes IS NULL
        AND pickup_arrival IS NOT NULL
        AND pickup_departure IS NOT NULL
        AND pickup_departure >= pickup_arrival
    `);
    console.log(`   ✅ Updated ${fixPickupDwell.rowCount} trips with pickup_dwell_minutes`);
    
    // ---------------------------------------------------------------------
    // FIX 4: Calculate delay_risk_pct based on current status and time windows
    // This is a simplified calculation - in production this would be ML-based
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 4: Calculating delay_risk_pct...');
    
    // For completed trips: 0% risk (already done)
    const fixDelayRiskCompleted = await client.query(`
      UPDATE trips
      SET delay_risk_pct = 0
      WHERE delay_risk_pct IS NULL
        AND status IN ('completed', 'delivered', 'closed')
    `);
    console.log(`   ✅ Set delay_risk_pct = 0 for ${fixDelayRiskCompleted.rowCount} completed trips`);
    
    // For assigned/planned trips: base risk based on how close to pickup window
    const fixDelayRiskAssigned = await client.query(`
      UPDATE trips
      SET delay_risk_pct = CASE
        WHEN pickup_window_start IS NULL THEN 10  -- Unknown window = low default risk
        WHEN pickup_window_start > NOW() + INTERVAL '24 hours' THEN 5  -- More than 24h away = very low
        WHEN pickup_window_start > NOW() + INTERVAL '4 hours' THEN 15  -- 4-24h away = low
        WHEN pickup_window_start > NOW() THEN 25  -- Less than 4h = moderate
        WHEN pickup_window_start < NOW() THEN 50  -- Past window = elevated
        ELSE 10
      END
      WHERE delay_risk_pct IS NULL
        AND status IN ('assigned', 'planned')
    `);
    console.log(`   ✅ Calculated delay_risk_pct for ${fixDelayRiskAssigned.rowCount} assigned trips`);
    
    // For in-transit trips: risk based on delivery window proximity
    const fixDelayRiskInTransit = await client.query(`
      UPDATE trips
      SET delay_risk_pct = CASE
        WHEN delivery_window_end IS NULL THEN 20  -- Unknown window = moderate default
        WHEN delivery_window_end > NOW() + INTERVAL '8 hours' THEN 10  -- Plenty of time
        WHEN delivery_window_end > NOW() + INTERVAL '2 hours' THEN 30  -- Getting tight
        WHEN delivery_window_end > NOW() THEN 50  -- Very tight
        WHEN delivery_window_end < NOW() THEN 75  -- Already late
        ELSE 20
      END
      WHERE delay_risk_pct IS NULL
        AND status IN ('in_transit', 'at_pickup', 'at_delivery', 'en_route_to_pickup', 'departed_pickup')
    `);
    console.log(`   ✅ Calculated delay_risk_pct for ${fixDelayRiskInTransit.rowCount} in-transit trips`);
    
    // For any remaining NULL values, set a default
    const fixDelayRiskDefault = await client.query(`
      UPDATE trips
      SET delay_risk_pct = 15
      WHERE delay_risk_pct IS NULL
    `);
    console.log(`   ✅ Set default delay_risk_pct for ${fixDelayRiskDefault.rowCount} remaining trips`);
    
    await client.query('COMMIT');
    console.log('\n✅ All fixes committed successfully!');
    
    // ========================================================================
    // VERIFICATION PHASE
    // ========================================================================
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 PHASE 3: VERIFYING RESULTS');
    console.log('='.repeat(80));
    
    const after = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(delivery_departure) as has_delivery_departure,
        COUNT(delivery_dwell_minutes) as has_delivery_dwell,
        COUNT(delay_risk_pct) as has_delay_risk,
        COUNT(week_start) as has_week_start
      FROM trips
    `);
    console.log('\nAfter fix:');
    console.table(after.rows[0]);
    
    // Sample
    console.log('\n📋 Sample of Fixed Trips:');
    const sample = await client.query(`
      SELECT 
        trip_number,
        status,
        week_start,
        delivery_departure,
        delivery_dwell_minutes,
        delay_risk_pct
      FROM trips
      LIMIT 5
    `);
    console.table(sample.rows);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TRIP TRACKING COLUMNS FIX COMPLETE');
    console.log('='.repeat(80));
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error occurred, rolled back changes:', err);
    throw err;
  } finally {
    client.release();
  }
}

fixTripTrackingColumns()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
