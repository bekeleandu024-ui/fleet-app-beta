const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkTripCosts() {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM trip_costs');
      console.log('Trip costs:', res.rows);

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkTripCosts();
