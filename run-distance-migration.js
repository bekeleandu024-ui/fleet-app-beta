#!/usr/bin/env node
/**
 * Run Distance Migration Script
 * This script adds distance_miles and duration_hours columns to the trips table
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read database connection from environment or use defaults
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fleet_tracking',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function runMigration() {
  console.log('\n================================================');
  console.log('  Distance Calculation Migration');
  console.log('================================================\n');

  const client = await pool.connect();
  
  try {
    console.log('✓ Connected to database');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'services/tracking/src/db/migrations/002_add_distance_fields.sql');
    console.log(`✓ Reading migration file: ${migrationPath}`);
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Run migration
    console.log('✓ Running migration...\n');
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify columns were added
    const checkResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trips' 
        AND column_name IN ('distance_miles', 'duration_hours')
      ORDER BY column_name;
    `);
    
    if (checkResult.rows.length === 2) {
      console.log('✅ Verified: New columns added to trips table:');
      checkResult.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('⚠️  Warning: Could not verify all columns were added');
    }
    
    // Check current distance coverage
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_trips,
        COUNT(distance_miles) as has_distance,
        COUNT(*) - COUNT(distance_miles) as needs_calculation
      FROM trips;
    `);
    
    const stats = statsResult.rows[0];
    console.log('\n📊 Current Statistics:');
    console.log(`   Total trips: ${stats.total_trips}`);
    console.log(`   With distance: ${stats.has_distance}`);
    console.log(`   Need calculation: ${stats.needs_calculation}`);
    
    if (stats.needs_calculation > 0) {
      console.log('\n⚠️  Next Step: Calculate distances for existing trips');
      console.log('   Run: curl -X POST http://localhost:3000/api/distance/missing/calculate');
    }
    
    console.log('\n================================================');
    console.log('  Migration Complete!');
    console.log('================================================\n');
    
  } catch (error) {
    console.error('\n❌ Error running migration:');
    console.error(error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n✓ Migration may have already been applied');
      console.log('  Checking if columns exist...\n');
      
      const checkResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'trips' 
          AND column_name IN ('distance_miles', 'duration_hours')
        ORDER BY column_name;
      `);
      
      if (checkResult.rows.length > 0) {
        console.log('✅ Columns already exist:');
        checkResult.rows.forEach(row => {
          console.log(`   - ${row.column_name}`);
        });
        console.log('\n✓ Your database is ready!');
      }
    } else {
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
