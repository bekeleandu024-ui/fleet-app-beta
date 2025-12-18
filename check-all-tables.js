const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkTableStructure(tableName) {
  try {
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    console.log(`\n📋 ${tableName} Table Structure:`);
    result.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error(`❌ Error checking ${tableName}:`, error.message);
  }
}

async function main() {
  await checkTableStructure('trips');
  await checkTableStructure('driver_profiles');
  await checkTableStructure('unit_profiles');
  await pool.end();
}

main();
