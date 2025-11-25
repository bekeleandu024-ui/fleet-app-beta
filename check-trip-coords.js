
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkTrip() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT t.id, t.status, t.last_known_lat, t.last_known_lng, t.dropoff_lat, t.dropoff_lng, t.dropoff_location, u.unit_number
      FROM trips t
      JOIN unit_profiles u ON t.unit_id = u.unit_id
      WHERE u.unit_number = '257454' AND t.status = 'in_transit'
    `);
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

checkTrip();
