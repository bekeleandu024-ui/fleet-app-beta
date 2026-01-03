const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet' });

async function checkSchema() {
  try {
    // Check driver_profiles
    const dp = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'driver_profiles'
    `);
    console.log('driver_profiles columns:', dp.rows.map(r => r.column_name));

    // Check unit_profiles
    const up = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'unit_profiles'
    `);
    console.log('\nunit_profiles columns:', up.rows.map(r => r.column_name));

    // Check trailers
    const tr = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trailers'
    `);
    console.log('\ntrailers columns:', tr.rows.map(r => r.column_name));

    // Check customers
    const cu = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customers'
    `);
    console.log('\ncustomers columns:', cu.rows.map(r => r.column_name));

  } finally {
    await pool.end();
  }
}

checkSchema().catch(console.error);
