const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkDrivers() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT driver_id, driver_name FROM driver_profiles');
    console.log('Drivers:', res.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDrivers();
