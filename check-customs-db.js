const pool = require('./lib/db').default;

async function checkCustoms() {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT count(*) FROM customs_clearances');
      console.log('Count:', res.rows[0]);
      
      const tripsRes = await client.query('SELECT count(*) FROM trips');
      console.log('Trips Count:', tripsRes.rows[0]);

      // Check if there are trips without customs clearances
      const missingRes = await client.query(`
        SELECT count(*) 
        FROM trips t 
        LEFT JOIN customs_clearances c ON t.id = c.trip_id 
        WHERE c.id IS NULL
      `);
      console.log('Trips without customs:', missingRes.rows[0]);

    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkCustoms();
