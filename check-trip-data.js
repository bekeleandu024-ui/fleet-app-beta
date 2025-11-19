#!/usr/bin/env node
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fleet',
  user: 'postgres',
  password: 'postgres',
});

async function main() {
  const client = await pool.connect();
  
  try {
    console.log('\n📊 Trip Distance Analysis\n');
    
    // Check overall stats
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(distance_miles) as has_distance_miles,
        COUNT(planned_miles) as has_planned_miles,
        COUNT(actual_miles) as has_actual_miles,
        COUNT(pickup_lat) as has_pickup_coords,
        COUNT(dropoff_lat) as has_dropoff_coords
      FROM trips;
    `);
    
    console.log('Overall Statistics:');
    console.log(statsResult.rows[0]);
    
    // Show sample trips
    console.log('\n📋 Sample Trips (first 5):');
    const sampleResult = await client.query(`
      SELECT 
        SUBSTRING(id::text, 1, 8) as short_id,
        pickup_location,
        dropoff_location,
        pickup_lat,
        pickup_lng,
        dropoff_lat,
        dropoff_lng,
        distance_miles,
        planned_miles,
        actual_miles
      FROM trips
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    
    console.table(sampleResult.rows);
    
  } finally {
    client.release();
    await pool.end();
  }
}

main();
