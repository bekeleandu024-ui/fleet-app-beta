/**
 * Distance Service Test Suite
 * 
 * Comprehensive tests for distance calculation service
 */

const { DistanceService, GeocodingService } = require('../distance-service');

// ============================================================================
// TEST UTILITIES
// ============================================================================

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    console.error(`❌ FAIL: ${message}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual: ${actual}`);
    return false;
  }
  console.log(`✅ PASS: ${message}`);
  return true;
}

function assertNotNull(actual, message) {
  if (actual === null || actual === undefined) {
    console.error(`❌ FAIL: ${message} - value is null/undefined`);
    return false;
  }
  console.log(`✅ PASS: ${message}`);
  return true;
}

function assertInRange(actual, min, max, message) {
  if (actual < min || actual > max) {
    console.error(`❌ FAIL: ${message}`);
    console.error(`   Expected range: ${min} - ${max}`);
    console.error(`   Actual: ${actual}`);
    return false;
  }
  console.log(`✅ PASS: ${message}`);
  return true;
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  console.log('🧪 Starting Distance Service Tests\n');
  console.log('═'.repeat(80));
  
  let passed = 0;
  let failed = 0;

  // Initialize service
  const service = new DistanceService();

  // -------------------------------------------------------------------------
  // TEST 1: Guelph to Buffalo (real-world example from requirements)
  // -------------------------------------------------------------------------
  console.log('\n📍 TEST 1: Guelph, ON → Buffalo, NY (Real Example)');
  console.log('-'.repeat(80));
  try {
    const result = await service.calculateDistance(
      'Guelph, ON, Canada',
      'Buffalo, NY, USA'
    );
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (assertNotNull(result.distanceMiles, 'Distance calculated')) passed++; else failed++;
    
    // Expected ~108 miles based on requirements
    const distance = parseFloat(result.distanceMiles);
    if (assertInRange(distance, 90, 130, 'Distance in expected range (90-130 miles)')) passed++; else failed++;
    
    if (assertNotNull(result.durationHours, 'Duration calculated')) passed++; else failed++;
    if (assertNotNull(result.provider, 'Provider specified')) passed++; else failed++;
    
  } catch (error) {
    console.error(`❌ FAIL: Error calculating Guelph to Buffalo - ${error.message}`);
    failed += 4;
  }

  // -------------------------------------------------------------------------
  // TEST 2: Toronto to Detroit (cross-border)
  // -------------------------------------------------------------------------
  console.log('\n📍 TEST 2: Toronto, ON → Detroit, MI (Cross-Border)');
  console.log('-'.repeat(80));
  try {
    const result = await service.calculateDistance(
      'Toronto, ON, Canada',
      'Detroit, MI, USA'
    );
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (assertNotNull(result.distanceMiles, 'Distance calculated')) passed++; else failed++;
    
    // Expected ~230 miles
    const distance = parseFloat(result.distanceMiles);
    if (assertInRange(distance, 200, 260, 'Distance in expected range (200-260 miles)')) passed++; else failed++;
    
  } catch (error) {
    console.error(`❌ FAIL: Error calculating Toronto to Detroit - ${error.message}`);
    failed += 2;
  }

  // -------------------------------------------------------------------------
  // TEST 3: Using Coordinates
  // -------------------------------------------------------------------------
  console.log('\n🗺️  TEST 3: Coordinate-Based Calculation');
  console.log('-'.repeat(80));
  try {
    const result = await service.calculateDistance(
      { lat: 43.5448, lng: -80.2482 }, // Guelph
      { lat: 42.8864, lng: -78.8784 }  // Buffalo
    );
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (assertNotNull(result.distanceMiles, 'Distance calculated from coordinates')) passed++; else failed++;
    
    const distance = parseFloat(result.distanceMiles);
    if (assertInRange(distance, 90, 130, 'Distance matches expected range')) passed++; else failed++;
    
  } catch (error) {
    console.error(`❌ FAIL: Error with coordinate-based calculation - ${error.message}`);
    failed += 2;
  }

  // -------------------------------------------------------------------------
  // TEST 4: Caching
  // -------------------------------------------------------------------------
  console.log('\n💾 TEST 4: Cache Functionality');
  console.log('-'.repeat(80));
  try {
    // First call (cache miss)
    const result1 = await service.calculateDistance(
      'Vancouver, BC, Canada',
      'Seattle, WA, USA'
    );
    
    if (assertEqual(result1.cached, false, 'First call is not cached')) passed++; else failed++;
    
    // Second call (cache hit)
    const result2 = await service.calculateDistance(
      'Vancouver, BC, Canada',
      'Seattle, WA, USA'
    );
    
    if (assertEqual(result2.cached, true, 'Second call uses cache')) passed++; else failed++;
    
    // Results should match
    if (assertEqual(result1.distanceMiles, result2.distanceMiles, 'Cached result matches original')) passed++; else failed++;
    
  } catch (error) {
    console.error(`❌ FAIL: Error testing cache - ${error.message}`);
    failed += 3;
  }

  // -------------------------------------------------------------------------
  // TEST 5: Batch Processing
  // -------------------------------------------------------------------------
  console.log('\n📦 TEST 5: Batch Distance Calculation');
  console.log('-'.repeat(80));
  try {
    const pairs = [
      { origin: 'Montreal, QC, Canada', destination: 'New York, NY, USA' },
      { origin: 'Calgary, AB, Canada', destination: 'Denver, CO, USA' },
      { origin: 'Winnipeg, MB, Canada', destination: 'Minneapolis, MN, USA' },
    ];
    
    const results = await service.calculateBatch(pairs, { batchSize: 2 });
    
    if (assertEqual(results.length, 3, 'All pairs processed')) passed++; else failed++;
    
    const successful = results.filter(r => r.result !== null).length;
    if (assertEqual(successful >= 2, true, 'At least 2 successful calculations')) passed++; else failed++;
    
  } catch (error) {
    console.error(`❌ FAIL: Error in batch processing - ${error.message}`);
    failed += 2;
  }

  // -------------------------------------------------------------------------
  // TEST 6: Geocoding
  // -------------------------------------------------------------------------
  console.log('\n🌍 TEST 6: Geocoding Service');
  console.log('-'.repeat(80));
  try {
    const result = await GeocodingService.geocode('Buffalo, NY, USA');
    
    if (assertNotNull(result, 'Geocoding returned result')) passed++; else failed++;
    if (assertNotNull(result?.lat, 'Latitude present')) passed++; else failed++;
    if (assertNotNull(result?.lng, 'Longitude present')) passed++; else failed++;
    
    // Buffalo coordinates should be approximately 42.88, -78.88
    if (assertInRange(result.lat, 42.5, 43.2, 'Latitude in Buffalo range')) passed++; else failed++;
    if (assertInRange(result.lng, -79.2, -78.5, 'Longitude in Buffalo range')) passed++; else failed++;
    
  } catch (error) {
    console.error(`❌ FAIL: Error in geocoding - ${error.message}`);
    failed += 5;
  }

  // -------------------------------------------------------------------------
  // TEST 7: Service Statistics
  // -------------------------------------------------------------------------
  console.log('\n📊 TEST 7: Service Statistics');
  console.log('-'.repeat(80));
  try {
    const stats = service.getStats();
    
    console.log('Statistics:', JSON.stringify(stats, null, 2));
    
    if (assertNotNull(stats.requests, 'Request count tracked')) passed++; else failed++;
    if (assertNotNull(stats.cacheHits, 'Cache hits tracked')) passed++; else failed++;
    if (assertNotNull(stats.cacheHitRate, 'Cache hit rate calculated')) passed++; else failed++;
    if (assertEqual(stats.requests > 0, true, 'Requests were made')) passed++; else failed++;
    
  } catch (error) {
    console.error(`❌ FAIL: Error getting stats - ${error.message}`);
    failed += 4;
  }

  // -------------------------------------------------------------------------
  // TEST 8: Error Handling
  // -------------------------------------------------------------------------
  console.log('\n⚠️  TEST 8: Error Handling');
  console.log('-'.repeat(80));
  try {
    // Invalid location should fail gracefully
    const result = await service.calculateDistance(
      'NonexistentCity12345, ZZ',
      'AnotherFakeCity67890, YY'
    );
    
    // Should either return fallback or throw
    if (result.provider === 'fallback' || result.warning) {
      console.log('✅ PASS: Fallback used for invalid locations');
      passed++;
    } else {
      console.log('❌ FAIL: Should use fallback for invalid locations');
      failed++;
    }
    
  } catch (error) {
    // Error is acceptable for invalid locations
    console.log('✅ PASS: Error properly thrown for invalid locations');
    passed++;
  }

  // -------------------------------------------------------------------------
  // TEST 9: US Domestic Route
  // -------------------------------------------------------------------------
  console.log('\n🇺🇸 TEST 9: US Domestic Route (Chicago to Atlanta)');
  console.log('-'.repeat(80));
  try {
    const result = await service.calculateDistance(
      'Chicago, IL, USA',
      'Atlanta, GA, USA'
    );
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (assertNotNull(result.distanceMiles, 'Distance calculated')) passed++; else failed++;
    
    // Expected ~700 miles
    const distance = parseFloat(result.distanceMiles);
    if (assertInRange(distance, 650, 750, 'Distance in expected range (650-750 miles)')) passed++; else failed++;
    
  } catch (error) {
    console.error(`❌ FAIL: Error calculating Chicago to Atlanta - ${error.message}`);
    failed += 2;
  }

  // -------------------------------------------------------------------------
  // TEST 10: Canadian Domestic Route
  // -------------------------------------------------------------------------
  console.log('\n🇨🇦 TEST 10: Canadian Domestic Route (Toronto to Montreal)');
  console.log('-'.repeat(80));
  try {
    const result = await service.calculateDistance(
      'Toronto, ON, Canada',
      'Montreal, QC, Canada'
    );
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (assertNotNull(result.distanceMiles, 'Distance calculated')) passed++; else failed++;
    
    // Expected ~350 miles
    const distance = parseFloat(result.distanceMiles);
    if (assertInRange(distance, 300, 400, 'Distance in expected range (300-400 miles)')) passed++; else failed++;
    
  } catch (error) {
    console.error(`❌ FAIL: Error calculating Toronto to Montreal - ${error.message}`);
    failed += 2;
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n' + '═'.repeat(80));
  console.log('📋 TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed`);
  }

  // Final stats
  console.log('\n📊 Final Service Statistics:');
  console.log(JSON.stringify(service.getStats(), null, 2));

  return failed === 0;
}

// ============================================================================
// RUN TESTS
// ============================================================================

if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error running tests:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
