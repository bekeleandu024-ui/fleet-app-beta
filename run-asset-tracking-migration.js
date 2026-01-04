const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add-asset-tracking-system.sql'),
      'utf8'
    );

    console.log('Running asset tracking system migration...\n');

    const result = await pool.query(sql);

    console.log('\n✓ Migration completed successfully!');
    console.log('\nChecking results...');

    // Verify locations table
    const locationsCheck = await pool.query(
      "SELECT COUNT(*) as count FROM locations WHERE name = 'Cambridge Terminal'"
    );
    console.log(`✓ Cambridge Terminal location: ${locationsCheck.rows[0].count > 0 ? 'Created' : 'Not found'}`);

    // Verify unit_profiles columns
    const unitsCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'unit_profiles'
        AND column_name IN ('home_base_id', 'current_location_id', 'status', 'default_trailer_id')
      ORDER BY column_name
    `);
    console.log(`✓ Unit profiles columns added: ${unitsCheck.rows.map(r => r.column_name).join(', ')}`);

    // Verify trailers columns
    const trailersCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'trailers'
        AND column_name IN ('domicile_location_id', 'current_location_id', 'current_unit_id', 'status')
      ORDER BY column_name
    `);
    console.log(`✓ Trailers columns added: ${trailersCheck.rows.map(r => r.column_name).join(', ')}`);

    // Verify orders columns
    const ordersCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'orders'
        AND column_name IN ('is_rounder', 'drop_trailer')
      ORDER BY column_name
    `);
    console.log(`✓ Orders columns added: ${ordersCheck.rows.map(r => r.column_name).join(', ')}`);

    // Verify trips columns
    const tripsCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'trips'
        AND column_name IN ('deadhead_miles', 'loaded_miles', 'return_miles', 'total_empty_miles', 'bobtail_return', 'unit_id', 'trailer_id')
      ORDER BY column_name
    `);
    console.log(`✓ Trips columns added: ${tripsCheck.rows.map(r => r.column_name).join(', ')}`);

    // Check migration results
    const unitsMigrated = await pool.query(
      "SELECT COUNT(*) as count FROM unit_profiles WHERE home_base_id IS NOT NULL"
    );
    console.log(`✓ Units migrated to Cambridge Terminal: ${unitsMigrated.rows[0].count}`);

    const trailersMigrated = await pool.query(
      "SELECT COUNT(*) as count FROM trailers WHERE domicile_location_id IS NOT NULL"
    );
    console.log(`✓ Trailers migrated to Cambridge Terminal: ${trailersMigrated.rows[0].count}`);

    const ordersMigrated = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE is_rounder IS NOT NULL"
    );
    console.log(`✓ Orders migrated with rounder flags: ${ordersMigrated.rows[0].count}`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
