
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function checkAnyCoords() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT count(*) FROM trips WHERE last_known_lat IS NOT NULL OR pickup_lat IS NOT NULL");
    console.log("Trips with coords:", res.rows[0].count);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAnyCoords();
