
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function updateTrip() {
  const client = await pool.connect();
  try {
    // Update the specific trip we found earlier
    const query = `
      UPDATE trips 
      SET 
        last_known_lat = 43.8561, 
        last_known_lng = -79.3370,
        pickup_lat = 43.8561,
        pickup_lng = -79.3370
      WHERE id = '4f8b1392-08d4-468e-9b62-57c1173666be'
    `;
    await client.query(query);
    console.log("Updated trip with coordinates.");
  } finally {
    client.release();
    await pool.end();
  }
}

updateTrip();
