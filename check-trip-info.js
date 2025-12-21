const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet' });

async function getTripInfo() {
  const tripId = 'ed89c494-40e3-4cdb-85c1-0550b99f571c';
  
  // Get trip
  const trip = await pool.query('SELECT * FROM trips WHERE id = $1', [tripId]);
  console.log('=== TRIP ===');
  console.log(JSON.stringify(trip.rows[0], null, 2));
  
  // Get order if linked
  if (trip.rows[0]?.order_id) {
    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [trip.rows[0].order_id]);
    console.log('\n=== ORDER ===');
    console.log(JSON.stringify(order.rows[0], null, 2));
  }
  
  // Get trip costs
  const costs = await pool.query('SELECT * FROM trip_costs WHERE trip_id = $1', [tripId]);
  console.log('\n=== TRIP COSTS ===');
  console.log(JSON.stringify(costs.rows, null, 2));
  
  // Get trip stops
  const stops = await pool.query('SELECT * FROM trip_stops WHERE trip_id = $1 ORDER BY sequence', [tripId]);
  console.log('\n=== TRIP STOPS ===');
  console.log(JSON.stringify(stops.rows, null, 2));
  
  // Get driver info
  if (trip.rows[0]?.driver_id) {
    const driver = await pool.query('SELECT * FROM driver_profiles WHERE driver_id = $1', [trip.rows[0].driver_id]);
    console.log('\n=== DRIVER ===');
    console.log(JSON.stringify(driver.rows[0], null, 2));
  }
  
  // Get unit info
  if (trip.rows[0]?.unit_id) {
    const unit = await pool.query('SELECT * FROM unit_profiles WHERE unit_id = $1', [trip.rows[0].unit_id]);
    console.log('\n=== UNIT ===');
    console.log(JSON.stringify(unit.rows[0], null, 2));
  }
  
  await pool.end();
}
getTripInfo().catch(e => console.error(e));
