const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet';

const pool = new Pool({
  connectionString,
});

async function checkTrips() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, status, closed_at FROM trips
    `);
    console.log('Trips in DB:', result.rows);
  } catch (err) {
    console.error('Error checking trips:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTrips();
