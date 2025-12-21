const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkTrip() {
  try {
    const tripId = '8e546194-f671-4b3d-a6a4-887c48db2ead';
    
    console.log('--- TRIP ---');
    const tripRes = await pool.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    const trip = tripRes.rows[0];
    console.log(JSON.stringify(trip, null, 2));

    if (trip && trip.order_id) {
      console.log('\n--- ORDER ---');
      const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [trip.order_id]);
      console.log(JSON.stringify(orderRes.rows[0], null, 2));
    }

    if (trip && trip.driver_id) {
      console.log('\n--- DRIVER ---');
      const driverRes = await pool.query('SELECT * FROM driver_profiles WHERE driver_id = $1', [trip.driver_id]);
      console.log(JSON.stringify(driverRes.rows[0], null, 2));
    }

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkTrip();
