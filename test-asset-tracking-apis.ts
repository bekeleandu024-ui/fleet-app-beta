/**
 * Test script for Asset Tracking APIs
 * Tests locations, units, and trailers endpoints
 */

import pool from './lib/db';
import { getLocations, getCambridgeTerminal } from './lib/services/locations-service';

async function testAssetTrackingSystem() {
  console.log('🧪 Testing Asset Tracking System APIs\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Check database schema
    console.log('\n📊 Test 1: Database Schema Verification');
    console.log('-'.repeat(60));

    const schemaCheck = await pool.query(`
      SELECT
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name IN ('locations', 'unit_profiles', 'trailers', 'orders', 'trips')
        AND column_name IN (
          'home_base_id', 'current_location_id', 'status', 'domicile_location_id',
          'current_unit_id', 'is_rounder', 'drop_trailer', 'deadhead_miles',
          'return_miles', 'bobtail_return'
        )
      ORDER BY table_name, column_name
    `);

    console.log('✓ New columns found:', schemaCheck.rows.length);
    schemaCheck.rows.forEach(row => {
      console.log(`  - ${row.table_name}.${row.column_name} (${row.data_type})`);
    });

    // Test 2: Locations Service
    console.log('\n📍 Test 2: Locations Service');
    console.log('-'.repeat(60));

    const terminal = await getCambridgeTerminal();
    if (terminal) {
      console.log('✓ Cambridge Terminal found:');
      console.log(`  - ID: ${terminal.id}`);
      console.log(`  - Name: ${terminal.name}`);
      console.log(`  - Location: ${terminal.city}, ${terminal.state}`);
      console.log(`  - Coordinates: ${terminal.latitude}, ${terminal.longitude}`);
    } else {
      console.log('✗ Cambridge Terminal not found!');
    }

    const allLocations = await getLocations();
    console.log(`\n✓ Total locations in system: ${allLocations.length}`);

    // Test 3: Units with Location Data
    console.log('\n🚛 Test 3: Units with Location Tracking');
    console.log('-'.repeat(60));

    const unitsResult = await pool.query(`
      SELECT
        up.unit_number,
        up.status,
        up.current_city,
        up.current_state,
        home_loc.name AS home_base_name,
        home_loc.city AS home_base_city,
        t.unit_number AS trailer_number
      FROM unit_profiles up
      LEFT JOIN locations home_loc ON up.home_base_id = home_loc.id
      LEFT JOIN trailers t ON up.default_trailer_id = t.trailer_id
      WHERE up.is_active = true
      LIMIT 5
    `);

    console.log(`✓ Sample units (showing 5 of ${unitsResult.rowCount}):`);
    unitsResult.rows.forEach(unit => {
      console.log(`  - Unit ${unit.unit_number}`);
      console.log(`    Status: ${unit.status || 'N/A'}`);
      console.log(`    Current: ${unit.current_city || 'N/A'}, ${unit.current_state || 'N/A'}`);
      console.log(`    Home Base: ${unit.home_base_name || 'N/A'} (${unit.home_base_city || 'N/A'})`);
      console.log(`    Trailer: ${unit.trailer_number || 'None'}`);
    });

    // Test 4: Trailers with Attachment Status
    console.log('\n🚚 Test 4: Trailers with Attachment Tracking');
    console.log('-'.repeat(60));

    const trailersResult = await pool.query(`
      SELECT
        t.unit_number AS trailer_number,
        t.status,
        t.current_city,
        t.current_state,
        t.current_unit_id,
        up.unit_number AS attached_to_unit,
        domicile.name AS domicile_name
      FROM trailers t
      LEFT JOIN unit_profiles up ON t.current_unit_id = up.unit_id
      LEFT JOIN locations domicile ON t.domicile_location_id = domicile.id
      LIMIT 5
    `);

    console.log(`✓ Sample trailers (showing 5 of ${trailersResult.rowCount}):`);
    trailersResult.rows.forEach(trailer => {
      console.log(`  - Trailer ${trailer.trailer_number}`);
      console.log(`    Status: ${trailer.status || 'N/A'}`);
      console.log(`    Current: ${trailer.current_city || 'N/A'}, ${trailer.current_state || 'N/A'}`);
      console.log(`    Domicile: ${trailer.domicile_name || 'N/A'}`);
      console.log(`    Attached to: ${trailer.attached_to_unit || 'None'} ${trailer.current_unit_id ? '(attached)' : '(detached)'}`);
    });

    // Test 5: Orders with Rounder Flags
    console.log('\n📦 Test 5: Orders with Trip Type Flags');
    console.log('-'.repeat(60));

    const ordersResult = await pool.query(`
      SELECT
        order_number,
        pickup_location,
        dropoff_location,
        is_rounder,
        drop_trailer,
        status
      FROM orders
      WHERE is_rounder IS NOT NULL
      LIMIT 5
    `);

    console.log(`✓ Sample orders (showing 5 of ${ordersResult.rowCount}):`);
    ordersResult.rows.forEach(order => {
      console.log(`  - Order ${order.order_number}`);
      console.log(`    Route: ${order.pickup_location} → ${order.dropoff_location}`);
      console.log(`    Is Rounder: ${order.is_rounder ? 'Yes' : 'No'}`);
      console.log(`    Drop Trailer: ${order.drop_trailer ? 'Yes' : 'No'}`);
      console.log(`    Status: ${order.status}`);
    });

    // Test 6: Trip Mileage Tracking
    console.log('\n🛣️  Test 6: Trip Mileage Fields');
    console.log('-'.repeat(60));

    const tripsResult = await pool.query(`
      SELECT
        id,
        deadhead_miles,
        loaded_miles,
        return_miles,
        total_empty_miles,
        bobtail_return,
        is_rounder
      FROM trips
      WHERE deadhead_miles IS NOT NULL OR loaded_miles IS NOT NULL
      LIMIT 3
    `);

    if (tripsResult.rowCount === 0) {
      console.log('ℹ️  No trips with mileage data yet (expected for new schema)');
    } else {
      console.log(`✓ Sample trips with mileage (showing ${tripsResult.rowCount}):`);
      tripsResult.rows.forEach(trip => {
        console.log(`  - Trip ${trip.id.slice(0, 8)}`);
        console.log(`    Deadhead: ${trip.deadhead_miles || 0} mi`);
        console.log(`    Loaded: ${trip.loaded_miles || 0} mi`);
        console.log(`    Return: ${trip.return_miles || 0} mi`);
        console.log(`    Total Empty: ${trip.total_empty_miles || 0} mi`);
        console.log(`    Rounder: ${trip.is_rounder ? 'Yes' : 'No'}, Bobtail Return: ${trip.bobtail_return ? 'Yes' : 'No'}`);
      });
    }

    // Test 7: System Statistics
    console.log('\n📈 Test 7: System Statistics');
    console.log('-'.repeat(60));

    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM locations WHERE is_active = true) as active_locations,
        (SELECT COUNT(*) FROM unit_profiles WHERE is_active = true AND home_base_id IS NOT NULL) as units_with_home_base,
        (SELECT COUNT(*) FROM unit_profiles WHERE status = 'AVAILABLE') as available_units,
        (SELECT COUNT(*) FROM unit_profiles WHERE status = 'DISPLACED') as displaced_units,
        (SELECT COUNT(*) FROM trailers WHERE domicile_location_id IS NOT NULL) as trailers_with_domicile,
        (SELECT COUNT(*) FROM trailers WHERE current_unit_id IS NOT NULL) as attached_trailers,
        (SELECT COUNT(*) FROM trailers WHERE status = 'Spotted') as spotted_trailers,
        (SELECT COUNT(*) FROM orders WHERE is_rounder = true) as rounder_orders,
        (SELECT COUNT(*) FROM orders WHERE drop_trailer = true) as drop_trailer_orders
    `);

    const s = stats.rows[0];
    console.log('✓ System Overview:');
    console.log(`  Locations: ${s.active_locations} active`);
    console.log(`  Units: ${s.units_with_home_base} with home base, ${s.available_units} available, ${s.displaced_units} displaced`);
    console.log(`  Trailers: ${s.trailers_with_domicile} with domicile, ${s.attached_trailers} attached, ${s.spotted_trailers} spotted`);
    console.log(`  Orders: ${s.rounder_orders} rounders, ${s.drop_trailer_orders} drop trailer`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run tests
testAssetTrackingSystem().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
