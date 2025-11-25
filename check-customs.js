
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkCustoms() {
  const client = await pool.connect();
  try {
    // Get trip ID for unit 257454
    const tripRes = await client.query(`
      SELECT t.id, u.unit_number 
      FROM trips t
      JOIN unit_profiles u ON t.unit_id = u.unit_id
      WHERE u.unit_number = '257454' AND t.status = 'in_transit'
    `);
    
    if (tripRes.rows.length === 0) {
      console.log("No active trip found for 257454");
      return;
    }

    const tripId = tripRes.rows[0].id;
    console.log(`Trip ID: ${tripId}`);

    // Check customs clearance
    const customsRes = await client.query(`
      SELECT * FROM customs_clearances WHERE trip_id = $1
    `, [tripId]);

    console.log("Customs Data:", customsRes.rows);

  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

checkCustoms();
