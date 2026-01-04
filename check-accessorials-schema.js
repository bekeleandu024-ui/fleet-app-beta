const { Pool } = require('pg');
const pool = new Pool({connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'});

async function checkSchema() {
  const result = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'order_accessorials' 
    ORDER BY ordinal_position
  `);
  
  console.log('order_accessorials columns:');
  result.rows.forEach(row => {
    console.log(`  ${row.column_name}: ${row.data_type}`);
  });
  
  await pool.end();
}

checkSchema().catch(console.error);
