const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(60));
    console.log('COMPREHENSIVE DATABASE MIGRATION');
    console.log('Fixing: Customers, Orders, Trips, Trip Costs');
    console.log('='.repeat(60));
    
    await client.query('BEGIN');
    
    // ========================================
    // STEP 1: Fix orders table - customer_id and customer_name
    // ========================================
    console.log('\n📋 STEP 1: Fixing orders table customer fields...\n');
    
    // First, populate customer_name from customer_id where customer_name is null
    // The customer_id field currently stores text like "cust-cemtol" 
    // We want customer_name to be the display name (e.g., "CEMTOL")
    await client.query(`
      UPDATE orders 
      SET customer_name = UPPER(REPLACE(REPLACE(customer_id, 'cust-', ''), '-', ' '))
      WHERE customer_name IS NULL AND customer_id IS NOT NULL
    `);
    console.log('✓ Populated customer_name from customer_id patterns');
    
    // ========================================
    // STEP 2: Fix trips table - add missing fields, populate from orders/drivers
    // ========================================
    console.log('\n📋 STEP 2: Fixing trips table...\n');
    
    // Add customer_id column if it doesn't exist
    await client.query(`
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS customer_id VARCHAR(36)
    `);
    console.log('✓ Added customer_id column to trips');
    
    // Update trips with unit_id from unit_profiles based on driver_id
    await client.query(`
      UPDATE trips t
      SET unit_id = u.unit_id
      FROM unit_profiles u
      WHERE t.driver_id = u.driver_id
      AND t.unit_id IS NULL
    `);
    console.log('✓ Populated unit_id from driver -> unit relationship');
    
    // Update trips with unit_number from unit_profiles
    await client.query(`
      UPDATE trips t
      SET unit_number = u.unit_number
      FROM unit_profiles u
      WHERE t.unit_id = u.unit_id
      AND (t.unit_number IS NULL OR t.unit_number = '')
    `);
    console.log('✓ Populated unit_number from unit_profiles');
    
    // Update trips with revenue = sum of quoted_rates from all orders in order_ids
    await client.query(`
      UPDATE trips t
      SET revenue = (
        SELECT COALESCE(SUM(o.quoted_rate), 0)
        FROM orders o
        WHERE o.id = ANY(t.order_ids::uuid[])
      )
      WHERE t.revenue IS NULL OR t.revenue = 0
    `);
    console.log('✓ Populated revenue from sum of order quoted_rates');
    
    // Update trips with customer_name and customer_id from primary order
    await client.query(`
      UPDATE trips t
      SET 
        customer_name = o.customer_name,
        customer_id = o.customer_id
      FROM orders o
      WHERE t.order_id = o.id
      AND (t.customer_name IS NULL OR t.customer_name = '')
    `);
    console.log('✓ Populated customer_name and customer_id from primary order');
    
    // ========================================
    // STEP 3: Drop and recreate trip_costs table with proper schema
    // ========================================
    console.log('\n📋 STEP 3: Recreating trip_costs table...\n');
    
    // Drop existing trip_costs table
    await client.query(`DROP TABLE IF EXISTS trip_costs CASCADE`);
    console.log('✓ Dropped old trip_costs table');
    
    // Create new trip_costs table aligned with costing system
    await client.query(`
      CREATE TABLE trip_costs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        
        -- Driver/Unit info (denormalized for reporting)
        driver_id UUID REFERENCES driver_profiles(driver_id),
        driver_type VARCHAR(10) NOT NULL, -- COM, RNR, OO
        unit_id UUID REFERENCES unit_profiles(unit_id),
        
        -- Distance
        linehaul_miles DECIMAL(10,2) NOT NULL DEFAULT 0,
        deadhead_miles DECIMAL(10,2) NOT NULL DEFAULT 0,
        return_deadhead_miles DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_miles DECIMAL(10,2) GENERATED ALWAYS AS (linehaul_miles + deadhead_miles + return_deadhead_miles) STORED,
        
        -- Revenue
        revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
        
        -- Cost Breakdown (aligned with lib/cost-calculator.ts)
        fixed_cost DECIMAL(10,2) NOT NULL DEFAULT 0,        -- Daily overhead
        labor_cost DECIMAL(10,2) NOT NULL DEFAULT 0,        -- Driver wage
        fuel_cost DECIMAL(10,2) NOT NULL DEFAULT 0,         -- Fuel
        maintenance_cost DECIMAL(10,2) NOT NULL DEFAULT 0,  -- Truck/trailer maintenance
        events_cost DECIMAL(10,2) NOT NULL DEFAULT 0,       -- Border, picks, drops
        total_cost DECIMAL(12,2) GENERATED ALWAYS AS (fixed_cost + labor_cost + fuel_cost + maintenance_cost + events_cost) STORED,
        
        -- Events (for cost calculation)
        border_crossings INTEGER NOT NULL DEFAULT 0,
        pickup_count INTEGER NOT NULL DEFAULT 1,
        delivery_count INTEGER NOT NULL DEFAULT 1,
        
        -- Profitability
        profit DECIMAL(12,2) GENERATED ALWAYS AS (revenue - (fixed_cost + labor_cost + fuel_cost + maintenance_cost + events_cost)) STORED,
        margin_pct DECIMAL(6,2),
        cost_per_mile DECIMAL(8,4),
        revenue_per_mile DECIMAL(8,4),
        
        -- Trip Parameters
        duration_days DECIMAL(4,2) NOT NULL DEFAULT 1,
        is_rounder BOOLEAN NOT NULL DEFAULT true,
        
        -- Metadata
        calculation_source VARCHAR(50) DEFAULT 'manual', -- manual, dispatch_simulation, auto
        calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        calculated_by VARCHAR(100),
        notes TEXT,
        
        -- Timestamps
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✓ Created new trip_costs table');
    
    // Create indexes
    await client.query(`
      CREATE INDEX idx_trip_costs_trip_id ON trip_costs(trip_id);
      CREATE INDEX idx_trip_costs_driver_id ON trip_costs(driver_id);
      CREATE INDEX idx_trip_costs_driver_type ON trip_costs(driver_type);
      CREATE INDEX idx_trip_costs_calculated_at ON trip_costs(calculated_at);
    `);
    console.log('✓ Created indexes on trip_costs');
    
    // ========================================
    // STEP 4: Verify the fix for TRP-MJZIV31L
    // ========================================
    console.log('\n📋 STEP 4: Verifying TRP-MJZIV31L fix...\n');
    
    const tripResult = await client.query(`
      SELECT 
        t.id,
        t.trip_number,
        t.driver_id,
        t.unit_id,
        t.unit_number,
        t.customer_id,
        t.customer_name,
        t.revenue,
        t.total_cost,
        d.driver_name,
        d.driver_type,
        u.unit_number as unit_profile_number
      FROM trips t
      LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
      LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
      WHERE t.trip_number = 'TRP-MJZIV31L'
    `);
    
    if (tripResult.rows.length > 0) {
      const trip = tripResult.rows[0];
      console.log('TRP-MJZIV31L after migration:');
      console.log(`  - trip_number: ${trip.trip_number}`);
      console.log(`  - driver_name: ${trip.driver_name}`);
      console.log(`  - driver_type: ${trip.driver_type}`);
      console.log(`  - unit_id: ${trip.unit_id}`);
      console.log(`  - unit_number: ${trip.unit_number}`);
      console.log(`  - customer_id: ${trip.customer_id}`);
      console.log(`  - customer_name: ${trip.customer_name}`);
      console.log(`  - revenue: $${trip.revenue}`);
      console.log(`  - total_cost: $${trip.total_cost || 'NULL (needs costing)'}`);
    }
    
    // Show all orders for this trip
    const ordersResult = await client.query(`
      SELECT o.order_number, o.customer_id, o.customer_name, o.quoted_rate
      FROM orders o
      JOIN trips t ON o.id = ANY(t.order_ids::uuid[])
      WHERE t.trip_number = 'TRP-MJZIV31L'
    `);
    
    console.log('\nOrders in TRP-MJZIV31L:');
    let totalRevenue = 0;
    ordersResult.rows.forEach(o => {
      console.log(`  - ${o.order_number}: ${o.customer_name} (${o.customer_id}) - $${o.quoted_rate}`);
      totalRevenue += parseFloat(o.quoted_rate || 0);
    });
    console.log(`  TOTAL REVENUE: $${totalRevenue}`);
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETE');
    console.log('='.repeat(60));
    
    console.log('\nSummary of changes:');
    console.log('  1. orders.customer_name populated from customer_id patterns');
    console.log('  2. trips.unit_id populated from driver->unit relationship');
    console.log('  3. trips.unit_number populated from unit_profiles');
    console.log('  4. trips.revenue = SUM of order quoted_rates');
    console.log('  5. trips.customer_name/customer_id from primary order');
    console.log('  6. trip_costs table recreated with new costing schema');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
