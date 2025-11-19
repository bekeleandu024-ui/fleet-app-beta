#!/usr/bin/env node
/**
 * Interactive Distance Migration Setup
 * This will prompt for database credentials and run the migration
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n================================================');
  console.log('  Distance Calculation Migration Setup');
  console.log('================================================\n');
  
  console.log('Enter your database connection details:');
  console.log('(Press Enter to use default values shown in brackets)\n');
  
  const dbHost = await question('Database host [localhost]: ') || 'localhost';
  const dbPort = await question('Database port [5432]: ') || '5432';
  const dbName = await question('Database name [fleet]: ') || 'fleet';
  const dbUser = await question('Database user [postgres]: ') || 'postgres';
  const dbPassword = await question('Database password: ');
  
  rl.close();
  
  if (!dbPassword) {
    console.log('\n❌ Error: Database password is required');
    process.exit(1);
  }
  
  const pool = new Pool({
    host: dbHost,
    port: parseInt(dbPort),
    database: dbName,
    user: dbUser,
    password: dbPassword,
  });
  
  const client = await pool.connect();
  
  try {
    console.log('\n✓ Connected to database successfully');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'services/tracking/src/db/migrations/002_add_distance_fields.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.log(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    console.log('✓ Reading migration file...');
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
        AND column_name IN ('distance_miles', 'duration_hours', 'distance_calculated_at', 
                            'distance_calculation_provider', 'distance_calculation_method')
      ORDER BY column_name;
    `);
    
    console.log('✅ New columns added to trips table:');
    checkResult.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name} (${row.data_type})`);
    });
    
    // Check if cache table was created
    const cacheCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'distance_cache';
    `);
    
    if (cacheCheck.rows.length > 0) {
      console.log('\n✅ distance_cache table created');
    }
    
    // Check current distance coverage
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_trips,
        COUNT(distance_miles) as has_distance,
        COUNT(*) - COUNT(distance_miles) as needs_calculation,
        ROUND(
          COUNT(distance_miles)::numeric / NULLIF(COUNT(*), 0) * 100,
          1
        ) as coverage_pct
      FROM trips;
    `);
    
    const stats = statsResult.rows[0];
    console.log('\n📊 Current Trip Statistics:');
    console.log(`   Total trips: ${stats.total_trips}`);
    console.log(`   With calculated distance: ${stats.has_distance}`);
    console.log(`   Need calculation: ${stats.needs_calculation}`);
    console.log(`   Coverage: ${stats.coverage_pct || 0}%`);
    
    if (parseInt(stats.needs_calculation) > 0) {
      console.log('\n================================================');
      console.log('  Next Step: Calculate Distances');
      console.log('================================================\n');
      console.log('Run this command to calculate distances for all trips:');
      console.log('  curl -X POST http://localhost:3000/api/distance/missing/calculate\n');
      console.log('Or run in PowerShell:');
      console.log('  Invoke-RestMethod -Uri "http://localhost:3000/api/distance/missing/calculate" -Method Post\n');
    } else {
      console.log('\n✅ All trips already have calculated distances!');
    }
    
    console.log('================================================');
    console.log('  Setup Complete!');
    console.log('================================================\n');
    console.log('✅ Database schema updated');
    console.log('✅ Ready to calculate real distances');
    console.log('\nRestart your dev server to see changes:');
    console.log('  npm run dev\n');
    
  } catch (error) {
    console.error('\n❌ Error during migration:');
    console.error(error.message);
    
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('\n✓ Migration appears to have been applied already');
      console.log('  Verifying columns exist...\n');
      
      const checkResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'trips' 
          AND column_name IN ('distance_miles', 'duration_hours')
        ORDER BY column_name;
      `);
      
      if (checkResult.rows.length >= 2) {
        console.log('✅ Required columns exist:');
        checkResult.rows.forEach(row => {
          console.log(`   ✓ ${row.column_name}`);
        });
        console.log('\n✅ Your database is ready!');
        console.log('\nNext: Calculate distances using the API endpoint above.');
      } else {
        console.log('⚠️  Some columns may be missing. Review the error above.');
      }
    } else {
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
