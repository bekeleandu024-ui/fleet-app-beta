
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function checkSchema() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'unit_profiles'");
    console.log('Unit columns:', res.rows.map(r => r.column_name));
    
    const res2 = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'trips'");
    console.log('Trip columns:', res2.rows.map(r => r.column_name));
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
