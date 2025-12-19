const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

const NEW_DATA = [
  { unit: "734392", driver: "Ron Piche", type: "COM", truck_wk: 1015.16, region: "GTA" },
  { unit: "734401", driver: "Jeff Churchill", type: "COM", truck_wk: 1019.19, region: "GTA" },
  { unit: "734403", driver: "Paul Jessome", type: "COM", truck_wk: 1019.19, region: "GTA" },
  { unit: "734404", driver: "Denise Starr", type: "COM", truck_wk: 1019.19, region: "GTA" },
  { unit: "734409", driver: "Jeff Jorgensen", type: "COM", truck_wk: 1019.19, region: "GTA" },
  { unit: "257453", driver: "Sahil Verma", type: "COM", truck_wk: 696.75, region: "Montreal" },
  { unit: "257454", driver: "Gabriel", type: "COM", truck_wk: 696.75, region: "Montreal" },
  { unit: "257455", driver: "Rajinder Kothari", type: "COM", truck_wk: 696.75, region: "Montreal" },
  { unit: "257457", driver: "Chris Osborne", type: "COM", truck_wk: 696.75, region: "Montreal" },
  { unit: "257458", driver: "Ken Clark", type: "COM", truck_wk: 696.75, region: "Montreal" },
  { unit: "257459", driver: "William Reyes", type: "COM", truck_wk: 696.75, region: "Montreal" },
  { unit: "257460", driver: "Varun Kabilan", type: "COM", truck_wk: 696.75, region: "Montreal" },
  { unit: "257461", driver: "William Tsrakasu", type: "COM", truck_wk: 696.75, region: "Montreal" },
  { unit: "257462", driver: "Wendy Holden", type: "COM", truck_wk: 696.75, region: "Montreal" },
  { unit: "257464", driver: "Gurdip Dhaliwal", type: "COM", truck_wk: 696.75, region: "Montreal" },
  { unit: "257465", driver: "Borislav Pasaricek", type: "COM", truck_wk: 696.75, region: "Montreal" },
  { unit: "936002", driver: "Chris Guilliana", type: "OO", truck_wk: 0, region: "South West" },
  { unit: "936004", driver: "Joshua Newell", type: "OO", truck_wk: 0, region: "South West" },
  { unit: "936005", driver: "Perica Dragicevic", type: "OO", truck_wk: 0, region: "South West" },
  { unit: "936006", driver: "Vedran Aleksic", type: "OO", truck_wk: 0, region: "South West" },
  { unit: "936007", driver: "Yin Jin", type: "OO", truck_wk: 0, region: "South West" },
  { unit: "936008", driver: "Josip Strahja", type: "OO", truck_wk: 0, region: "South West" },
  { unit: "936009", driver: "Miroslav Kovacic", type: "OO", truck_wk: 0, region: "South West" },
  { unit: "936010", driver: "Slobodan Grbik", type: "OO", truck_wk: 0, region: "South West" },
  { unit: "730112", driver: "Harmeet Legha", type: "RNR", truck_wk: 832.33, region: "GTA" },
  { unit: "734393", driver: "Jagjeet Singh", type: "RNR", truck_wk: 1015.16, region: "GTA" },
  { unit: "443515", driver: "Avikash Badhan", type: "RNR", truck_wk: 529.24, region: "GTA" },
  { unit: "257456", driver: "Avinash Singh", type: "RNR", truck_wk: 696.75, region: "GTA" },
  { unit: "734408", driver: "Satnam Singh", type: "RNR", truck_wk: 1009.12, region: "GTA" }
];

async function ensureSchema(client) {
  console.log('Checking schema...');
  try {
    await client.query(`
      ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS region VARCHAR(50);
      ALTER TABLE unit_profiles ADD COLUMN IF NOT EXISTS region VARCHAR(50);
    `);
    console.log('Schema updated.');
  } catch (e) {
    console.error('Error updating schema:', e);
    throw e;
  }
}

async function seed() {
  const client = await pool.connect();
  try {
    await ensureSchema(client);
    await client.query('BEGIN');

    console.log('Deleting existing data...');
    // Delete dependent data first
    await client.query('DELETE FROM customs_documents');
    await client.query('DELETE FROM customs_activity_log');
    await client.query('DELETE FROM customs_clearances');
    await client.query('DELETE FROM trip_costs');
    await client.query('DELETE FROM trip_locations');
    await client.query('DELETE FROM trip_stops');
    await client.query('DELETE FROM trip_events');
    await client.query('DELETE FROM trip_exceptions');
    // await client.query('DELETE FROM active_trip_locations'); // View, cannot delete
    // await client.query('DELETE FROM trip_event_timeline'); // View
    await client.query('DELETE FROM week_miles_summary');
    await client.query('DELETE FROM trips');
    await client.query('DELETE FROM dispatches');
    
    await client.query('DELETE FROM unit_profiles');
    await client.query('DELETE FROM driver_profiles');

    console.log('Inserting new data...');
    for (const row of NEW_DATA) {
      const driverId = crypto.randomUUID();
      const unitId = crypto.randomUUID();

      // Insert Driver
      await client.query(`
        INSERT INTO driver_profiles (
          driver_id, driver_name, unit_number, driver_type, region, is_active, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, true, 'active', NOW(), NOW())
      `, [driverId, row.driver, row.unit, row.type, row.region]);

      // Insert Unit
      await client.query(`
        INSERT INTO unit_profiles (
          unit_id, unit_number, driver_id, truck_weekly_cost, region, is_active, current_location, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, true, NULL, NOW(), NOW())
      `, [unitId, row.unit, driverId, row.truck_wk, row.region]);
    }

    await client.query('COMMIT');
    console.log('Seeding completed successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error seeding data:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
