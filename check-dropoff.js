
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function checkDropoff() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, status, dropoff_location, dropoff_lat, dropoff_lng FROM trips WHERE id = '4f8b1392-08d4-468e-9b62-57c1173666be'");
    console.log(res.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDropoff();
