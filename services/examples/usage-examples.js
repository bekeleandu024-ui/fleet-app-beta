/**
 * Example Usage Scripts
 * 
 * Practical examples demonstrating how to use the distance service
 */

const { DistanceService } = require('../distance-service');
const { DatabaseDistanceService } = require('../database-integration');

// ============================================================================
// EXAMPLE 1: Simple Distance Calculation
// ============================================================================

async function example1_simpleCalculation() {
  console.log('═'.repeat(80));
  console.log('EXAMPLE 1: Simple Distance Calculation');
  console.log('═'.repeat(80) + '\n');

  const service = new DistanceService();

  // Calculate distance between two cities
  const result = await service.calculateDistance(
    'Guelph, ON, Canada',
    'Buffalo, NY, USA'
  );

  console.log('Distance from Guelph to Buffalo:');
  console.log(`  Distance: ${result.distanceMiles} miles`);
  console.log(`  Duration: ${result.durationHours} hours (${result.durationMinutes} minutes)`);
  console.log(`  Provider: ${result.provider}`);
  console.log(`  Cached: ${result.cached}`);

  if (result.warning) {
    console.log(`  Warning: ${result.warning}`);
  }
}

// ============================================================================
// EXAMPLE 2: Using Coordinates
// ============================================================================

async function example2_coordinatesBased() {
  console.log('\n' + '═'.repeat(80));
  console.log('EXAMPLE 2: Coordinate-Based Calculation');
  console.log('═'.repeat(80) + '\n');

  const service = new DistanceService();

  // Calculate distance using lat/lng coordinates
  const result = await service.calculateDistance(
    { lat: 43.5448, lng: -80.2482 }, // Guelph, ON
    { lat: 42.8864, lng: -78.8784 }  // Buffalo, NY
  );

  console.log('Distance using coordinates:');
  console.log(`  Distance: ${result.distanceMiles} miles`);
  console.log(`  Duration: ${result.durationHours} hours`);
}

// ============================================================================
// EXAMPLE 3: Batch Calculation
// ============================================================================

async function example3_batchCalculation() {
  console.log('\n' + '═'.repeat(80));
  console.log('EXAMPLE 3: Batch Distance Calculation');
  console.log('═'.repeat(80) + '\n');

  const service = new DistanceService();

  const routes = [
    { origin: 'Toronto, ON', destination: 'Detroit, MI' },
    { origin: 'Vancouver, BC', destination: 'Seattle, WA' },
    { origin: 'Montreal, QC', destination: 'New York, NY' },
    { origin: 'Calgary, AB', destination: 'Denver, CO' },
  ];

  console.log(`Calculating distances for ${routes.length} routes...\n`);

  const results = await service.calculateBatch(routes, { batchSize: 2 });

  results.forEach((item, index) => {
    console.log(`Route ${index + 1}: ${item.origin} → ${item.destination}`);
    if (item.result) {
      console.log(`  ✅ ${item.result.distanceMiles} miles (${item.result.durationHours} hours)`);
    } else {
      console.log(`  ❌ Error: ${item.error}`);
    }
  });
}

// ============================================================================
// EXAMPLE 4: Database Integration - Calculate Trip Distance
// ============================================================================

async function example4_calculateTripDistance() {
  console.log('\n' + '═'.repeat(80));
  console.log('EXAMPLE 4: Calculate Distance for a Trip');
  console.log('═'.repeat(80) + '\n');

  const dbService = new DatabaseDistanceService();

  try {
    // Replace with actual trip ID from your database
    const tripId = 'your-trip-uuid-here';

    console.log(`Calculating distance for trip ${tripId}...\n`);

    const result = await dbService.calculateTripDistance(tripId);

    console.log('Trip distance calculated:');
    console.log(`  Trip ID: ${result.tripId}`);
    console.log(`  Distance: ${result.distanceMiles} miles`);
    console.log(`  Duration: ${result.durationHours} hours`);
    console.log(`  Provider: ${result.provider}`);
    console.log(`  Updated in database: ${result.updated}`);

  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    await dbService.close();
  }
}

// ============================================================================
// EXAMPLE 5: Calculate All Missing Distances
// ============================================================================

async function example5_calculateMissingDistances() {
  console.log('\n' + '═'.repeat(80));
  console.log('EXAMPLE 5: Calculate Missing Distances for All Trips');
  console.log('═'.repeat(80) + '\n');

  const dbService = new DatabaseDistanceService();

  try {
    console.log('Fetching trips without distance data...\n');

    // First, check how many trips are missing distance
    const missingTrips = await dbService.getTripsMissingDistance(10);
    console.log(`Found ${missingTrips.length} trips without distance (showing first 10)\n`);

    // Calculate distances (limit to 10 for this example)
    console.log('Starting calculation...\n');
    const results = await dbService.calculateMissingDistances({
      limit: 10,
      batchSize: 5,
    });

    console.log('\nResults:');
    console.log(`  Total processed: ${results.total}`);
    console.log(`  ✅ Successful: ${results.successful}`);
    console.log(`  ❌ Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(err => {
        console.log(`  - Trip ${err.tripId}: ${err.error}`);
      });
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    await dbService.close();
  }
}

// ============================================================================
// EXAMPLE 6: Get Cache Statistics
// ============================================================================

async function example6_cacheStatistics() {
  console.log('\n' + '═'.repeat(80));
  console.log('EXAMPLE 6: Cache Statistics');
  console.log('═'.repeat(80) + '\n');

  const dbService = new DatabaseDistanceService();

  try {
    const stats = await dbService.getCacheStats();

    console.log('Database Cache:');
    console.log(`  Total entries: ${stats.database.totalEntries}`);
    console.log(`  Active entries: ${stats.database.activeEntries}`);
    console.log(`  Expired entries: ${stats.database.expiredEntries}`);
    console.log(`  Total hits: ${stats.database.totalHits}`);
    console.log(`  Average hits per entry: ${stats.database.avgHitsPerEntry}`);
    console.log(`  Providers used: ${stats.database.providersUsed}`);

    console.log('\nIn-Memory Service Cache:');
    console.log(`  Total requests: ${stats.service.requests}`);
    console.log(`  Cache hits: ${stats.service.cacheHits}`);
    console.log(`  Cache misses: ${stats.service.cacheMisses}`);
    console.log(`  Hit rate: ${stats.service.cacheHitRate}`);
    console.log(`  Errors: ${stats.service.errors}`);

  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    await dbService.close();
  }
}

// ============================================================================
// EXAMPLE 7: Preferred Provider
// ============================================================================

async function example7_preferredProvider() {
  console.log('\n' + '═'.repeat(80));
  console.log('EXAMPLE 7: Using Preferred Provider');
  console.log('═'.repeat(80) + '\n');

  const service = new DistanceService();

  // Try different providers
  const providers = ['osrm', 'mapbox', 'google'];

  for (const provider of providers) {
    try {
      console.log(`\nUsing provider: ${provider}`);
      const result = await service.calculateDistance(
        'Chicago, IL',
        'Milwaukee, WI',
        { preferredProvider: provider }
      );

      console.log(`  Distance: ${result.distanceMiles} miles`);
      console.log(`  Actual provider used: ${result.provider}`);
    } catch (error) {
      console.log(`  ❌ ${provider} failed: ${error.message}`);
    }
  }
}

// ============================================================================
// EXAMPLE 8: Cleanup Cache
// ============================================================================

async function example8_cleanupCache() {
  console.log('\n' + '═'.repeat(80));
  console.log('EXAMPLE 8: Cache Cleanup');
  console.log('═'.repeat(80) + '\n');

  const dbService = new DatabaseDistanceService();

  try {
    console.log('Running cache cleanup...\n');

    const result = await dbService.cleanupCache();

    console.log(`Deleted ${result.deletedCount} expired cache entries`);

  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    await dbService.close();
  }
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

async function runAllExamples() {
  try {
    // Basic examples (no database required)
    await example1_simpleCalculation();
    await example2_coordinatesBased();
    await example3_batchCalculation();
    await example7_preferredProvider();

    console.log('\n\n' + '═'.repeat(80));
    console.log('DATABASE EXAMPLES (Require database connection)');
    console.log('═'.repeat(80));
    console.log('\nSkipping database examples in this demo.');
    console.log('To run database examples, uncomment them below and ensure DB is configured.\n');

    // Database examples (uncomment when database is configured)
    // await example4_calculateTripDistance();
    // await example5_calculateMissingDistances();
    // await example6_cacheStatistics();
    // await example8_cleanupCache();

  } catch (error) {
    console.error('\nError running examples:', error.message);
  }
}

// ============================================================================
// MAIN
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Running all examples...\n');
    runAllExamples().catch(console.error);
  } else {
    const exampleNumber = parseInt(args[0]);
    const examples = {
      1: example1_simpleCalculation,
      2: example2_coordinatesBased,
      3: example3_batchCalculation,
      4: example4_calculateTripDistance,
      5: example5_calculateMissingDistances,
      6: example6_cacheStatistics,
      7: example7_preferredProvider,
      8: example8_cleanupCache,
    };

    if (examples[exampleNumber]) {
      console.log(`Running example ${exampleNumber}...\n`);
      examples[exampleNumber]().catch(console.error);
    } else {
      console.log('Invalid example number. Choose 1-8.');
    }
  }
}

module.exports = {
  example1_simpleCalculation,
  example2_coordinatesBased,
  example3_batchCalculation,
  example4_calculateTripDistance,
  example5_calculateMissingDistances,
  example6_cacheStatistics,
  example7_preferredProvider,
  example8_cleanupCache,
};
