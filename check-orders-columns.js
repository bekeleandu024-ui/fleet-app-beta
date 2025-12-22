const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function checkOrdersColumns() {
  const client = await pool.connect();
  try {
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 orders table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkOrdersColumns();
