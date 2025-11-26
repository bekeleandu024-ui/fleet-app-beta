const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet';

const pool = new Pool({
  connectionString,
});

async function checkTripStatuses() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT status, COUNT(*) 
      FROM trips 
      GROUP BY status
    `);
    
    console.log('Trip Status Counts:');
    res.rows.forEach(row => {
      console.log(`${row.status}: ${row.count}`);
    });

  } catch (err) {
    console.error('Error checking trips:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTripStatuses();
