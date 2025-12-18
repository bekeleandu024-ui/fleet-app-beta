
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function checkPickup() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, pickup_lat, pickup_lng FROM trips WHERE status = 'assigned'");
    console.log(res.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPickup();
