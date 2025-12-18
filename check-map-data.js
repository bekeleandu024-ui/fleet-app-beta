
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'fleet',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

async function checkTrips() {
  try {
    const client = await pool.connect();
    try {
      console.log("Checking trips table...");
      const res = await client.query(`
        SELECT id, status, last_known_lat, last_known_lng 
        FROM trips 
        WHERE status IN ('planned', 'planning', 'assigned', 'in_transit', 'en_route_to_pickup', 'at_pickup', 'departed_pickup', 'at_delivery')
      `);
      console.log(`Found ${res.rowCount} trips matching criteria.`);
      if (res.rowCount > 0) {
        console.log("First 5 rows:", res.rows.slice(0, 5));
      } else {
        console.log("No trips found matching the status criteria.");
        
        // Check all trips to see what statuses exist
        const allTrips = await client.query('SELECT status, count(*) FROM trips GROUP BY status');
        console.log("Trip counts by status:", allTrips.rows);
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error querying database:", err);
  } finally {
    await pool.end();
  }
}

checkTrips();
