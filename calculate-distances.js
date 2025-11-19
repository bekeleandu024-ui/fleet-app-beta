#!/usr/bin/env node
/**
 * Calculate Real Distances for All Trips
 * This script uses the distance service to calculate distances directly
 */

const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fleet',
  user: 'postgres',
  password: 'postgres',
});

// Simple OSRM distance calculation
async function calculateDistance(originLat, originLng, destLat, destLng) {
  return new Promise((resolve, reject) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code === 'Ok' && json.routes && json.routes[0]) {
            const route = json.routes[0];
            const distanceMeters = route.distance;
            const durationSeconds = route.duration;
            
            resolve({
              distanceMiles: (distanceMeters / 1609.34).toFixed(2),
              durationHours: (durationSeconds / 3600).toFixed(2),
              provider: 'osrm'
            });
          } else {
            reject(new Error('No route found'));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('\n================================================');
  console.log('  Calculating Real Distances for All Trips');
  console.log('================================================\n');
  
  const client = await pool.connect();
  
  try {
    // Get all trips with coordinates but no distance
    const result = await client.query(`
      SELECT 
        id, 
        pickup_location,
        dropoff_location,
        pickup_lat, 
        pickup_lng, 
        dropoff_lat, 
        dropoff_lng
      FROM trips 
      WHERE distance_miles IS NULL 
        AND pickup_lat IS NOT NULL 
        AND pickup_lng IS NOT NULL
        AND dropoff_lat IS NOT NULL 
        AND dropoff_lng IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 50;
    `);
    
    const trips = result.rows;
    console.log(`Found ${trips.length} trips to calculate\n`);
    
    if (trips.length === 0) {
      console.log('✅ All trips already have calculated distances!');
      return;
    }
    
    let successful = 0;
    let failed = 0;
    
    for (const trip of trips) {
      const shortId = String(trip.id).substring(0, 8);
      process.stdout.write(`${trip.pickup_location} → ${trip.dropoff_location} ... `);
      
      try {
        const distance = await calculateDistance(
          trip.pickup_lat,
          trip.pickup_lng,
          trip.dropoff_lat,
          trip.dropoff_lng
        );
        
        await client.query(`
          UPDATE trips 
          SET 
            distance_miles = $1,
            duration_hours = $2,
            distance_calculated_at = NOW(),
            distance_calculation_provider = $3,
            distance_calculation_method = 'auto'
          WHERE id = $4
        `, [distance.distanceMiles, distance.durationHours, distance.provider, trip.id]);
        
        console.log(`✅ ${distance.distanceMiles} mi`);
        successful++;
        
        // Rate limiting - wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        failed++;
      }
    }
    
    console.log('\n================================================');
    console.log('  Calculation Complete!');
    console.log('================================================\n');
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total processed: ${successful + failed}`);
    
    // Show updated statistics
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_trips,
        COUNT(distance_miles) as has_distance,
        ROUND(
          COUNT(distance_miles)::numeric / NULLIF(COUNT(*), 0) * 100,
          1
        ) as coverage_pct
      FROM trips;
    `);
    
    const stats = statsResult.rows[0];
    console.log(`\n📊 Updated Statistics:`);
    console.log(`   Total trips: ${stats.total_trips}`);
    console.log(`   With distance: ${stats.has_distance}`);
    console.log(`   Coverage: ${stats.coverage_pct}%`);
    
    console.log('\n✅ Done! Restart your dev server to see the changes.\n');
    
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
