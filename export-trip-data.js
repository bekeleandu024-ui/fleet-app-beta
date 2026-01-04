const { Pool } = require('pg');
const pool = new Pool({connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'});

async function getFullTripData() {
  const client = await pool.connect();
  try {
    console.log('='.repeat(70));
    console.log('COMPLETE DATABASE VALUES FOR TRP-MJZIV31L');
    console.log('='.repeat(70));
    
    // 1. TRIPS TABLE
    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│ 1. TRIPS TABLE                                                       │');
    console.log('└─────────────────────────────────────────────────────────────────────┘');
    
    const trip = await client.query(`SELECT * FROM trips WHERE trip_number = 'TRP-MJZIV31L'`);
    if (trip.rows.length > 0) {
      const t = trip.rows[0];
      console.log('┌────────────────────────┬──────────────────────────────────────────────┐');
      console.log('│ Column                 │ Value                                        │');
      console.log('├────────────────────────┼──────────────────────────────────────────────┤');
      console.log(`│ id                     │ ${t.id} │`);
      console.log(`│ trip_number            │ ${t.trip_number}                                      │`);
      console.log(`│ order_id               │ ${t.order_id} │`);
      console.log(`│ order_ids              │ ${JSON.stringify(t.order_ids).substring(0, 40)}... │`);
      console.log(`│ status                 │ ${t.status}                                      │`);
      console.log(`│ driver_id              │ ${t.driver_id} │`);
      console.log(`│ driver_name            │ ${t.driver_name || 'NULL'}                                │`);
      console.log(`│ unit_id                │ ${t.unit_id} │`);
      console.log(`│ unit_number            │ ${t.unit_number || 'NULL'}                                        │`);
      console.log(`│ customer_id            │ ${t.customer_id || 'NULL'}                                    │`);
      console.log(`│ customer_name          │ ${t.customer_name || 'NULL'}                                        │`);
      console.log(`│ revenue                │ $${t.revenue || 'NULL'}                                        │`);
      console.log(`│ total_cost             │ $${t.total_cost || 'NULL (costing not run)'}                      │`);
      console.log(`│ pickup_location        │ ${t.pickup_location}                                │`);
      console.log(`│ dropoff_location       │ ${t.dropoff_location}                                  │`);
      console.log('└────────────────────────┴──────────────────────────────────────────────┘');
    }
    
    // 2. ORDERS TABLE
    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│ 2. ORDERS TABLE (2 orders in this trip)                             │');
    console.log('└─────────────────────────────────────────────────────────────────────┘');
    
    const orders = await client.query(`
      SELECT o.* FROM orders o
      JOIN trips t ON o.id = ANY(t.order_ids::uuid[])
      WHERE t.trip_number = 'TRP-MJZIV31L'
      ORDER BY o.order_number
    `);
    
    for (const o of orders.rows) {
      console.log(`\n>> ${o.order_number}`);
      console.log('┌────────────────────────┬──────────────────────────────────────────────┐');
      console.log('│ Column                 │ Value                                        │');
      console.log('├────────────────────────┼──────────────────────────────────────────────┤');
      console.log(`│ id                     │ ${o.id} │`);
      console.log(`│ order_number           │ ${o.order_number}                                       │`);
      console.log(`│ customer_id            │ ${o.customer_id}                                    │`);
      console.log(`│ customer_name          │ ${o.customer_name}                                        │`);
      console.log(`│ status                 │ ${o.status}                               │`);
      console.log(`│ dispatch_status        │ ${o.dispatch_status}                              │`);
      console.log(`│ pickup_location        │ ${o.pickup_location}                                │`);
      console.log(`│ dropoff_location       │ ${o.dropoff_location}                                  │`);
      console.log(`│ quoted_rate            │ $${o.quoted_rate}                                       │`);
      console.log(`│ total_weight_lbs       │ ${o.total_weight_lbs} lbs                                 │`);
      console.log(`│ required_equipment     │ ${o.required_equipment || 'NULL'}                                        │`);
      console.log('└────────────────────────┴──────────────────────────────────────────────┘');
    }
    
    // 3. DRIVER_PROFILES TABLE
    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│ 3. DRIVER_PROFILES TABLE                                            │');
    console.log('└─────────────────────────────────────────────────────────────────────┘');
    
    const driver = await client.query(`
      SELECT dp.* FROM driver_profiles dp
      JOIN trips t ON dp.driver_id = t.driver_id
      WHERE t.trip_number = 'TRP-MJZIV31L'
    `);
    
    if (driver.rows.length > 0) {
      const d = driver.rows[0];
      console.log('┌────────────────────────┬──────────────────────────────────────────────┐');
      console.log('│ Column                 │ Value                                        │');
      console.log('├────────────────────────┼──────────────────────────────────────────────┤');
      console.log(`│ driver_id              │ ${d.driver_id} │`);
      console.log(`│ driver_name            │ ${d.driver_name}                                │`);
      console.log(`│ unit_number            │ ${d.unit_number}                                        │`);
      console.log(`│ driver_type            │ ${d.driver_type}                                          │`);
      console.log(`│ is_active              │ ${d.is_active}                                        │`);
      console.log('└────────────────────────┴──────────────────────────────────────────────┘');
    }
    
    // 4. UNIT_PROFILES TABLE
    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│ 4. UNIT_PROFILES TABLE                                              │');
    console.log('└─────────────────────────────────────────────────────────────────────┘');
    
    const unit = await client.query(`
      SELECT up.* FROM unit_profiles up
      JOIN trips t ON up.unit_id = t.unit_id
      WHERE t.trip_number = 'TRP-MJZIV31L'
    `);
    
    if (unit.rows.length > 0) {
      const u = unit.rows[0];
      console.log('┌────────────────────────┬──────────────────────────────────────────────┐');
      console.log('│ Column                 │ Value                                        │');
      console.log('├────────────────────────┼──────────────────────────────────────────────┤');
      console.log(`│ unit_id                │ ${u.unit_id} │`);
      console.log(`│ unit_number            │ ${u.unit_number}                                        │`);
      console.log(`│ driver_id              │ ${u.driver_id} │`);
      console.log(`│ is_active              │ ${u.is_active}                                        │`);
      console.log('└────────────────────────┴──────────────────────────────────────────────┘');
    }
    
    // 5. CUSTOMERS TABLE (reference)
    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│ 5. CUSTOMERS TABLE (facility/yard reference)                        │');
    console.log('└─────────────────────────────────────────────────────────────────────┘');
    
    const customers = await client.query(`SELECT customer_id, customer_name, city FROM customers LIMIT 5`);
    console.log('┌──────────────────────────────────────┬─────────────────────────────────┐');
    console.log('│ customer_id                          │ customer_name / city            │');
    console.log('├──────────────────────────────────────┼─────────────────────────────────┤');
    for (const c of customers.rows) {
      console.log(`│ ${c.customer_id} │ ${c.customer_name.substring(0, 20).padEnd(20)} / ${c.city.padEnd(8)} │`);
    }
    console.log('└──────────────────────────────────────┴─────────────────────────────────┘');
    console.log('Note: customers table is for facility/yard locations, not order customers');
    
    // 6. TRIP_COSTS TABLE (new schema)
    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│ 6. TRIP_COSTS TABLE (new schema - ready for costing)                │');
    console.log('└─────────────────────────────────────────────────────────────────────┘');
    
    const costSchema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trip_costs'
      ORDER BY ordinal_position
    `);
    
    console.log('New trip_costs columns:');
    const cols = costSchema.rows.map(r => r.column_name);
    console.log(cols.join(', '));
    
    const tripCosts = await client.query(`
      SELECT * FROM trip_costs tc
      JOIN trips t ON tc.trip_id = t.id
      WHERE t.trip_number = 'TRP-MJZIV31L'
    `);
    
    if (tripCosts.rows.length === 0) {
      console.log('\n⚠️  No trip_costs record exists yet for TRP-MJZIV31L');
      console.log('   Costing needs to be calculated and inserted');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('DATA EXPORT COMPLETE');
    console.log('='.repeat(70));
    
  } finally {
    client.release();
    await pool.end();
  }
}

getFullTripData();
