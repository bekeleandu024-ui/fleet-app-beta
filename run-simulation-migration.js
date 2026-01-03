/**
 * Migration Runner: 008 Fleet vs. Brokerage Simulation Engine
 * Executes schema changes for Asset State tracking
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Fleet vs. Brokerage Simulation Migration...\n');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'migrations', '008_fleet_brokerage_simulation.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query('BEGIN');
    
    // Execute the full migration
    console.log('📦 Creating customers table...');
    console.log('🚚 Creating trailers table with enums...');
    console.log('⚙️  Updating unit_profiles with new columns...');
    console.log('👤 Updating driver_profiles with HOS tracking...');
    console.log('🌱 Seeding 8 customer locations...');
    console.log('📊 Creating dispatch helper views...\n');
    
    await client.query(sql);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify the migration
    console.log('🔍 Verifying migration results...\n');
    
    // Check customers table
    const customersResult = await client.query('SELECT COUNT(*) as count FROM customers');
    console.log(`   📍 Customers: ${customersResult.rows[0].count} records`);
    
    // Check trailers table exists
    const trailersCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'trailers' ORDER BY ordinal_position
    `);
    console.log(`   🚚 Trailers table: ${trailersCheck.rows.length} columns`);
    
    // Check unit_profiles new columns
    const unitsCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'unit_profiles' 
      AND column_name IN ('current_configuration', 'current_trailer_id', 'avg_fuel_consumption', 'current_location_id')
    `);
    console.log(`   🚛 Unit Profiles: ${unitsCheck.rows.length} new columns added`);
    
    // Check driver_profiles new columns  
    const driversCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'driver_profiles' 
      AND column_name IN ('available_to_start_at', 'last_shift_end_at', 'driver_category', 'hos_hours_remaining', 'current_status')
    `);
    console.log(`   👤 Driver Profiles: ${driversCheck.rows.length} new columns added`);
    
    // Show sample customers
    console.log('\n📍 Seeded Customer Locations:');
    const customers = await client.query('SELECT name, city, has_trailer_pool, pool_count_empty FROM customers ORDER BY name');
    customers.rows.forEach(c => {
      const pool = c.has_trailer_pool ? `🟢 Pool: ${c.pool_count_empty} empty` : '⚪ No pool';
      console.log(`   • ${c.name} (${c.city}) - ${pool}`);
    });
    
    // Show views created
    console.log('\n📊 Helper Views Created:');
    const views = await client.query(`
      SELECT table_name FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name IN ('dispatch_available_drivers', 'trailer_pool_availability', 'unit_status_summary')
    `);
    views.rows.forEach(v => console.log(`   • ${v.table_name}`));
    
    console.log('\n✨ Fleet vs. Brokerage Simulation Engine is ready!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    
    // Provide more context for common errors
    if (error.message.includes('already exists')) {
      console.log('\n💡 Tip: Some objects already exist. This migration is idempotent - safe to run again.');
    }
    
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
