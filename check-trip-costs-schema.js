const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type, is_generated, generation_expression
      FROM information_schema.columns 
      WHERE table_name = 'trip_costs'
      ORDER BY ordinal_position
    `);
    console.log('trip_costs columns:');
    res.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type}) ${r.is_generated === 'ALWAYS' ? '[GENERATED]' : ''}`));
  } finally {
    client.release();
    await pool.end();
  }
}
check();
