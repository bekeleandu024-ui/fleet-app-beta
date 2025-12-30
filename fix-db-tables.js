const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function analyzeAndFixData() {
  const client = await pool.connect();
  try {
    console.log('='.repeat(80));
    console.log('DATABASE DATA FIX SCRIPT');
    console.log('='.repeat(80));
    
    // ========================================================================
    // ANALYSIS PHASE
    // ========================================================================
    
    console.log('\n📊 PHASE 1: ANALYZING CURRENT DATA STATE\n');
    
    // Check trips with NULL financial data
    const tripsAnalysis = await client.query(`
      SELECT 
        COUNT(*) as total_trips,
        COUNT(total_cost) as has_total_cost,
        COUNT(revenue) as has_revenue,
        COUNT(profit) as has_profit,
        COUNT(margin_pct) as has_margin_pct,
        COUNT(driver_name) as has_driver_name,
        COUNT(unit_number) as has_unit_number,
        COUNT(customer_name) as has_customer_name,
        COUNT(lane) as has_lane,
        COUNT(dispatch_id) as has_dispatch_id
      FROM trips
    `);
    console.log('TRIPS Table Analysis:');
    console.table(tripsAnalysis.rows[0]);
    
    // Check trip_costs data availability
    const tripCostsAnalysis = await client.query(`
      SELECT 
        COUNT(*) as total_trip_costs,
        COUNT(trip_id) as has_trip_id,
        COUNT(total_cost) as has_total_cost,
        COUNT(revenue) as has_revenue,
        COUNT(profit) as has_profit,
        COUNT(margin_pct) as has_margin_pct,
        COUNT(driver_id) as has_driver_id,
        COUNT(unit_id) as has_unit_id
      FROM trip_costs
    `);
    console.log('\nTRIP_COSTS Table Analysis:');
    console.table(tripCostsAnalysis.rows[0]);
    
    // Check orders data
    const ordersAnalysis = await client.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(customer_name) as has_customer_name,
        COUNT(customer_id) as has_customer_id,
        COUNT(lane) as has_lane
      FROM orders
    `);
    console.log('\nORDERS Table Analysis:');
    console.table(ordersAnalysis.rows[0]);
    
    // Check dispatches data
    const dispatchesAnalysis = await client.query(`
      SELECT 
        COUNT(*) as total_dispatches,
        COUNT(order_id) as has_order_id,
        COUNT(driver_id) as has_driver_id
      FROM dispatches
    `);
    console.log('\nDISPATCHES Table Analysis:');
    console.table(dispatchesAnalysis.rows[0]);
    
    // Check driver_profiles data
    const driversAnalysis = await client.query(`
      SELECT 
        COUNT(*) as total_drivers,
        COUNT(driver_name) as has_driver_name,
        COUNT(unit_number) as has_unit_number
      FROM driver_profiles
    `);
    console.log('\nDRIVER_PROFILES Table Analysis:');
    console.table(driversAnalysis.rows[0]);
    
    // ========================================================================
    // FIX PHASE
    // ========================================================================
    
    console.log('\n' + '='.repeat(80));
    console.log('📝 PHASE 2: APPLYING FIXES');
    console.log('='.repeat(80));
    
    // Start transaction
    await client.query('BEGIN');
    
    // ---------------------------------------------------------------------
    // FIX 1: Update trips financial data from trip_costs
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 1: Syncing financial data from trip_costs to trips...');
    
    const fixFinancials = await client.query(`
      UPDATE trips t
      SET 
        total_cost = tc.total_cost,
        revenue = tc.revenue,
        profit = tc.profit,
        margin_pct = tc.margin_pct
      FROM trip_costs tc
      WHERE t.id = tc.trip_id::uuid
        AND (t.total_cost IS NULL OR t.revenue IS NULL OR t.profit IS NULL OR t.margin_pct IS NULL)
    `);
    console.log(`   ✅ Updated ${fixFinancials.rowCount} trips with financial data from trip_costs`);
    
    // Also try matching by order_id if trip_id doesn't match
    const fixFinancialsByOrder = await client.query(`
      UPDATE trips t
      SET 
        total_cost = COALESCE(t.total_cost, tc.total_cost),
        revenue = COALESCE(t.revenue, tc.revenue),
        profit = COALESCE(t.profit, tc.profit),
        margin_pct = COALESCE(t.margin_pct, tc.margin_pct)
      FROM trip_costs tc
      WHERE t.order_id::text = tc.order_id
        AND (t.total_cost IS NULL OR t.revenue IS NULL OR t.profit IS NULL OR t.margin_pct IS NULL)
    `);
    console.log(`   ✅ Updated ${fixFinancialsByOrder.rowCount} additional trips (matched by order_id)`);
    
    // ---------------------------------------------------------------------
    // FIX 2: Update trips contextual data from driver_profiles
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 2: Syncing driver context data to trips...');
    
    const fixDriverContext = await client.query(`
      UPDATE trips t
      SET 
        driver_name = dp.driver_name,
        unit_number = COALESCE(t.unit_number, dp.unit_number)
      FROM driver_profiles dp
      WHERE t.driver_id = dp.driver_id
        AND (t.driver_name IS NULL OR t.unit_number IS NULL)
    `);
    console.log(`   ✅ Updated ${fixDriverContext.rowCount} trips with driver_name and unit_number`);
    
    // ---------------------------------------------------------------------
    // FIX 3: Update trips unit_number from unit_profiles if unit_id exists
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 3: Syncing unit_number from unit_profiles...');
    
    const fixUnitNumber = await client.query(`
      UPDATE trips t
      SET unit_number = up.unit_number
      FROM unit_profiles up
      WHERE t.unit_id = up.unit_id
        AND t.unit_number IS NULL
        AND t.unit_id IS NOT NULL
    `);
    console.log(`   ✅ Updated ${fixUnitNumber.rowCount} trips with unit_number from unit_profiles`);
    
    // ---------------------------------------------------------------------
    // FIX 4: Update trips customer_name from orders
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 4: Syncing customer context to trips from orders...');
    
    // First, let's see what customer_id values exist in orders
    const customerIds = await client.query(`
      SELECT DISTINCT customer_id FROM orders WHERE customer_id IS NOT NULL LIMIT 20
    `);
    console.log('   Found customer_ids in orders:', customerIds.rows.map(r => r.customer_id));
    
    // Since there's no customers table, customer_id IS the customer name in many systems
    // Let's update trips.customer_name from orders where it might be stored
    const fixCustomerFromOrders = await client.query(`
      UPDATE trips t
      SET customer_name = o.customer_id
      FROM orders o
      WHERE t.order_id = o.id
        AND t.customer_name IS NULL
        AND o.customer_id IS NOT NULL
    `);
    console.log(`   ✅ Updated ${fixCustomerFromOrders.rowCount} trips with customer_name from orders.customer_id`);
    
    // ---------------------------------------------------------------------
    // FIX 5: Update trips lane from orders
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 5: Syncing lane data to trips from orders...');
    
    const fixLane = await client.query(`
      UPDATE trips t
      SET lane = o.lane
      FROM orders o
      WHERE t.order_id = o.id
        AND t.lane IS NULL
        AND o.lane IS NOT NULL
    `);
    console.log(`   ✅ Updated ${fixLane.rowCount} trips with lane from orders`);
    
    // If orders.lane is also NULL, generate lane from locations
    const generateLane = await client.query(`
      UPDATE trips t
      SET lane = CONCAT(
        SPLIT_PART(t.pickup_location, ',', 1), 
        ' → ', 
        SPLIT_PART(t.dropoff_location, ',', 1)
      )
      WHERE t.lane IS NULL
        AND t.pickup_location IS NOT NULL
        AND t.dropoff_location IS NOT NULL
    `);
    console.log(`   ✅ Generated lane for ${generateLane.rowCount} trips from pickup/dropoff locations`);
    
    // ---------------------------------------------------------------------
    // FIX 6: Link trips to dispatches via order_id
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 6: Linking trips to dispatches...');
    
    // Check if dispatches exist
    const dispatchCount = await client.query('SELECT COUNT(*) as cnt FROM dispatches');
    console.log(`   Found ${dispatchCount.rows[0].cnt} dispatches in the database`);
    
    if (parseInt(dispatchCount.rows[0].cnt) > 0) {
      // Match trips to dispatches by order_id AND driver_id
      const fixDispatchLink = await client.query(`
        UPDATE trips t
        SET dispatch_id = d.id
        FROM dispatches d
        WHERE (t.order_id::text = d.order_id OR t.order_id::text = d.order_id::text)
          AND (t.driver_id::text = d.driver_id OR t.driver_id::text = d.driver_id::text)
          AND t.dispatch_id IS NULL
      `);
      console.log(`   ✅ Linked ${fixDispatchLink.rowCount} trips to dispatches (by order_id + driver_id)`);
      
      // Also try matching just by order_id
      const fixDispatchLinkByOrder = await client.query(`
        UPDATE trips t
        SET dispatch_id = d.id
        FROM dispatches d
        WHERE (t.order_id::text = d.order_id OR t.order_id::text = d.order_id::text)
          AND t.dispatch_id IS NULL
      `);
      console.log(`   ✅ Linked ${fixDispatchLinkByOrder.rowCount} additional trips to dispatches (by order_id only)`);
    }
    
    // ---------------------------------------------------------------------
    // FIX 7: Update orders customer_name from customer_id (denormalized)
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 7: Setting orders.customer_name from customer_id...');
    
    // Since there's no customers table, customer_id IS the customer identifier
    // We'll use it as the customer_name for display purposes
    const fixOrdersCustomerName = await client.query(`
      UPDATE orders
      SET customer_name = customer_id
      WHERE customer_name IS NULL
        AND customer_id IS NOT NULL
    `);
    console.log(`   ✅ Updated ${fixOrdersCustomerName.rowCount} orders with customer_name = customer_id`);
    
    // ---------------------------------------------------------------------
    // FIX 8: Generate lane for orders if missing
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 8: Generating lane for orders from locations...');
    
    const fixOrdersLane = await client.query(`
      UPDATE orders
      SET lane = CONCAT(
        SPLIT_PART(pickup_location, ',', 1), 
        ' → ', 
        SPLIT_PART(dropoff_location, ',', 1)
      )
      WHERE lane IS NULL
        AND pickup_location IS NOT NULL
        AND dropoff_location IS NOT NULL
    `);
    console.log(`   ✅ Generated lane for ${fixOrdersLane.rowCount} orders`);
    
    // Commit transaction
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
        COUNT(*) as total_trips,
        COUNT(total_cost) as has_total_cost,
        COUNT(revenue) as has_revenue,
        COUNT(profit) as has_profit,
        COUNT(margin_pct) as has_margin_pct,
        COUNT(driver_name) as has_driver_name,
        COUNT(unit_number) as has_unit_number,
        COUNT(customer_name) as has_customer_name,
        COUNT(lane) as has_lane,
        COUNT(dispatch_id) as has_dispatch_id
      FROM trips
    `);
    console.log('\nTRIPS Table After Fix:');
    console.table(tripsAfter.rows[0]);
    
    // Re-check orders
    const ordersAfter = await client.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(customer_name) as has_customer_name,
        COUNT(lane) as has_lane
      FROM orders
    `);
    console.log('\nORDERS Table After Fix:');
    console.table(ordersAfter.rows[0]);
    
    // Show sample of fixed trips
    console.log('\n📋 Sample of Fixed Trips:');
    const sampleTrips = await client.query(`
      SELECT 
        trip_number,
        driver_name,
        unit_number,
        customer_name,
        lane,
        total_cost,
        revenue,
        profit,
        margin_pct,
        dispatch_id IS NOT NULL as has_dispatch
      FROM trips
      LIMIT 5
    `);
    console.table(sampleTrips.rows);
    
    // Show sample of fixed orders
    console.log('\n📋 Sample of Fixed Orders:');
    const sampleOrders = await client.query(`
      SELECT 
        order_number,
        customer_id,
        customer_name,
        lane
      FROM orders
      LIMIT 5
    `);
    console.table(sampleOrders.rows);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ DATABASE FIX COMPLETE');
    console.log('='.repeat(80));
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error occurred, rolled back changes:', err);
    throw err;
  } finally {
    client.release();
  }
}

analyzeAndFixData()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
