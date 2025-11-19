#!/usr/bin/env node
/**
 * Add Coordinates to Trips and Calculate Distances
 * This script geocodes location names to get coordinates, then calculates distances
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

// Geocode a location using Nominatim (free, no API key needed)
async function geocode(location) {
  return new Promise((resolve, reject) => {
    const encodedLocation = encodeURIComponent(location);
    const options = {
      hostname: 'nominatim.openstreetmap.org',
      path: `/search?q=${encodedLocation}&format=json&limit=1`,
      headers: {
        'User-Agent': 'FleetApp/1.0'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json && json[0]) {
            resolve({
              lat: parseFloat(json[0].lat),
              lng: parseFloat(json[0].lon)
            });
          } else {
            reject(new Error('Location not found'));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// Calculate distance using OSRM
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
            resolve({
              distanceMiles: (route.distance / 1609.34).toFixed(2),
              durationHours: (route.duration / 3600).toFixed(2)
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
  console.log('  Add Coordinates and Calculate Distances');
  console.log('================================================\n');
  
  const client = await pool.connect();
  
  try {
    // Get trips without coordinates
    const result = await client.query(`
      SELECT 
        id,
        SUBSTRING(id::text, 1, 8) as short_id,
        pickup_location,
        dropoff_location
      FROM trips 
      WHERE (pickup_lat IS NULL OR dropoff_lat IS NULL)
        AND pickup_location IS NOT NULL
        AND dropoff_location IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20;
    `);
    
    const trips = result.rows;
    console.log(`Found ${trips.length} trips needing coordinates\n`);
    
    if (trips.length === 0) {
      console.log('✅ All trips already have coordinates!');
      return;
    }
    
    let successful = 0;
    let failed = 0;
    
    for (const trip of trips) {
      console.log(`\n${trip.short_id}: ${trip.pickup_location} → ${trip.dropoff_location}`);
      
      try {
        // Geocode pickup
        process.stdout.write('  Geocoding pickup... ');
        const pickupCoords = await geocode(trip.pickup_location);
        console.log(`✅ (${pickupCoords.lat}, ${pickupCoords.lng})`);
        await new Promise(resolve => setTimeout(resolve, 1100)); // Rate limit: 1 req/sec
        
        // Geocode dropoff
        process.stdout.write('  Geocoding dropoff... ');
        const dropoffCoords = await geocode(trip.dropoff_location);
        console.log(`✅ (${dropoffCoords.lat}, ${dropoffCoords.lng})`);
        await new Promise(resolve => setTimeout(resolve, 1100));
        
        // Calculate distance
        process.stdout.write('  Calculating distance... ');
        const distance = await calculateDistance(
          pickupCoords.lat,
          pickupCoords.lng,
          dropoffCoords.lat,
          dropoffCoords.lng
        );
        console.log(`✅ ${distance.distanceMiles} mi (${distance.durationHours}h)`);
        
        // Update database
        await client.query(`
          UPDATE trips 
          SET 
            pickup_lat = $1,
            pickup_lng = $2,
            dropoff_lat = $3,
            dropoff_lng = $4,
            distance_miles = $5,
            duration_hours = $6,
            distance_calculated_at = NOW(),
            distance_calculation_provider = 'osrm',
            distance_calculation_method = 'auto'
          WHERE id = $7
        `, [
          pickupCoords.lat, pickupCoords.lng,
          dropoffCoords.lat, dropoffCoords.lng,
          distance.distanceMiles, distance.durationHours,
          trip.id
        ]);
        
        successful++;
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
        failed++;
      }
    }
    
    console.log('\n\n================================================');
    console.log('  Complete!');
    console.log('================================================\n');
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
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
    console.log(`\n📊 Updated Coverage:`);
    console.log(`   Total trips: ${stats.total_trips}`);
    console.log(`   With distance: ${stats.has_distance}`);
    console.log(`   Coverage: ${stats.coverage_pct}%`);
    
    console.log('\n✅ Done! Restart your dev server to see real distances.\n');
    
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
