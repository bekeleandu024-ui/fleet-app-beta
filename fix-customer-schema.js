const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function fixCustomerSchema() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(60));
    console.log('COMPREHENSIVE SCHEMA FIX: Customers, Orders, Trips');
    console.log('='.repeat(60));
    
    // 1. Check current schema state
    console.log('\n📋 STEP 1: Checking current schema...\n');
    
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('customers', 'orders', 'trips', 'trip_costs', 'driver_profiles', 'unit_profiles')
    `);
    console.log('Tables found:', tables.rows.map(r => r.table_name));
    
    // Check customers table structure
    const customersSchema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `);
    console.log('\nCustomers table columns:');
    customersSchema.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
    
    // Check orders table customer columns
    const ordersSchema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name LIKE '%customer%'
    `);
    console.log('\nOrders table customer columns:');
    ordersSchema.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
    
    // Check trips table customer columns  
    const tripsSchema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trips' 
      AND (column_name LIKE '%customer%' OR column_name LIKE '%unit%' OR column_name = 'revenue' OR column_name = 'total_cost')
    `);
    console.log('\nTrips table relevant columns:');
    tripsSchema.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
    
    // Check trip for TRP-MJZIV31L
    console.log('\n📋 STEP 2: Checking TRP-MJZIV31L data...\n');
    
    const tripData = await client.query(`
      SELECT * FROM trips WHERE trip_number = 'TRP-MJZIV31L'
    `);
    if (tripData.rows.length > 0) {
      console.log('Trip TRP-MJZIV31L found:');
      const trip = tripData.rows[0];
      console.log(`  - id: ${trip.id}`);
      console.log(`  - trip_number: ${trip.trip_number}`);
      console.log(`  - order_id: ${trip.order_id}`);
      console.log(`  - order_ids: ${JSON.stringify(trip.order_ids)}`);
      console.log(`  - driver_id: ${trip.driver_id}`);
      console.log(`  - unit_id: ${trip.unit_id}`);
      console.log(`  - status: ${trip.status}`);
      console.log(`  - customer_name: ${trip.customer_name}`);
      console.log(`  - revenue: ${trip.revenue}`);
      console.log(`  - total_cost: ${trip.total_cost}`);
      
      // Get associated orders
      if (trip.order_ids && trip.order_ids.length > 0) {
        const orders = await client.query(`
          SELECT id, order_number, customer_id, customer_name, quoted_rate, total_weight_lbs, pickup_location, dropoff_location
          FROM orders 
          WHERE id = ANY($1::uuid[])
        `, [trip.order_ids]);
        
        console.log('\nAssociated Orders:');
        orders.rows.forEach(o => {
          console.log(`  Order ${o.order_number}:`);
          console.log(`    - id: ${o.id}`);
          console.log(`    - customer_id: ${o.customer_id}`);
          console.log(`    - customer_name: ${o.customer_name}`);
          console.log(`    - quoted_rate: ${o.quoted_rate}`);
          console.log(`    - pickup: ${o.pickup_location} -> ${o.dropoff_location}`);
        });
      }
      
      // Get driver info
      if (trip.driver_id) {
        const driver = await client.query(`
          SELECT driver_id, driver_name, unit_number, driver_type 
          FROM driver_profiles 
          WHERE driver_id = $1
        `, [trip.driver_id]);
        
        if (driver.rows.length > 0) {
          console.log('\nDriver Info:');
          const d = driver.rows[0];
          console.log(`  - driver_id: ${d.driver_id}`);
          console.log(`  - driver_name: ${d.driver_name}`);
          console.log(`  - unit_number: ${d.unit_number}`);
          console.log(`  - driver_type: ${d.driver_type}`);
          
          // Get unit from unit_profiles that matches driver
          const unit = await client.query(`
            SELECT unit_id, unit_number, driver_id 
            FROM unit_profiles 
            WHERE driver_id = $1
          `, [trip.driver_id]);
          
          if (unit.rows.length > 0) {
            console.log('\nUnit Info (should be linked to trip):');
            console.log(`  - unit_id: ${unit.rows[0].unit_id}`);
            console.log(`  - unit_number: ${unit.rows[0].unit_number}`);
          }
        }
      }
    } else {
      console.log('Trip TRP-MJZIV31L NOT FOUND');
    }
    
    // Check trip_costs table
    console.log('\n📋 STEP 3: Checking trip_costs table...\n');
    const tripCostsSchema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trip_costs'
      ORDER BY ordinal_position
    `);
    if (tripCostsSchema.rows.length > 0) {
      console.log('Current trip_costs columns:');
      tripCostsSchema.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
    } else {
      console.log('trip_costs table does not exist');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('SCHEMA ANALYSIS COMPLETE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixCustomerSchema();
