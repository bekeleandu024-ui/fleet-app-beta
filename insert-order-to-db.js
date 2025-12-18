const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function insertOrder() {
  const client = await pool.connect();
  
  try {
    console.log('💾 Inserting order into database...\n');
    
    const orderId = 'ed8a7fe8-23ec-4b3c-b7b1-a8a4e7b3592c';
    
    const insertQuery = `
      INSERT INTO orders (
        id, 
        old_id,
        order_number, 
        customer_id, 
        status, 
        pickup_location, 
        dropoff_location, 
        pickup_time, 
        order_type,
        estimated_cost,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id, order_number, customer_id, status
    `;
    
    const values = [
      orderId,
      'AUTOCOM001', // old_id
      'ORD-10001',
      'AUTOCOM',
      'pending',
      '450 Trillium Dr, Kitchener, ON N2R 1K4, Canada',
      '10815 Pineville Rd, Charlotte, NC 28226, USA',
      '2026-01-06 08:00:00',
      'Cross-Border',
      2950
    ];
    
    const result = await client.query(insertQuery, values);
    
    console.log('✅ Order inserted successfully!');
    console.log('Order details:', result.rows[0]);
    console.log('');
    console.log(`🔗 View at: http://localhost:3000/orders/${orderId}`);
    
  } catch (error) {
    console.error('❌ Error inserting order:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

insertOrder();
