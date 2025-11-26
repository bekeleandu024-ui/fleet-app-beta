const axios = require('axios');

async function testApi() {
  try {
    // We can't easily hit the Next.js API from a script without the server running and knowing the port.
    // But we can simulate the DB query logic.
    
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
    });
    
    const client = await pool.connect();
    const query = "SELECT * FROM trips WHERE status = 'closed'";
    const result = await client.query(query);
    console.log(`DB Query found ${result.rows.length} closed trips.`);
    
    client.release();
    await pool.end();
    
  } catch (err) {
    console.error('Error:', err);
  }
}

testApi();
