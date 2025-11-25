
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function insertDummyCustoms() {
  const client = await pool.connect();
  try {
    // Get trip ID for unit 257454
    const tripRes = await client.query(`
      SELECT t.id, t.order_id, t.driver_id, t.unit_id, u.unit_number 
      FROM trips t
      JOIN unit_profiles u ON t.unit_id = u.unit_id
      WHERE u.unit_number = '257454' AND t.status = 'in_transit'
    `);
    
    if (tripRes.rows.length === 0) {
      console.log("No active trip found for 257454");
      return;
    }

    const trip = tripRes.rows[0];
    console.log(`Inserting customs data for Trip ID: ${trip.id}`);

    await client.query(`
      INSERT INTO customs_clearances (
        id, trip_id, order_id, driver_id, unit_id, status, border_crossing_point, 
        crossing_direction, priority,
        required_documents, submitted_documents, 
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 'Pending', 'Detroit-Windsor Tunnel',
        'Southbound', 'NORMAL',
        '["Commercial Invoice", "Bill of Lading", "ACE Manifest"]', 
        '["Commercial Invoice", "Bill of Lading"]',
        NOW(), NOW()
      )
    `, [trip.id, trip.order_id, trip.driver_id, trip.unit_id]);

    console.log("Dummy customs data inserted.");

  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

insertDummyCustoms();
