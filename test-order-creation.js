// Use built-in fetch (Node 18+)

async function testOrderCreation() {
  try {
    console.log('🧪 Testing order creation through API...\n');
    
    const orderData = {
      reference: `TEST-${Date.now()}`,
      customer: 'TEST CUSTOMER',
      pickup: '123 Test St, Toronto, ON',
      delivery: '456 Main St, New York, NY',
      window: '2025-12-19 08:00 - 2025-12-19 17:00',
      status: 'New',
      ageHours: 0,
      cost: 1500,
      lane: 'Toronto-NYC',
      serviceLevel: 'Standard',
      commodity: 'General Freight',
      laneMiles: 500
    };
    
    console.log('📤 Sending order:', orderData);
    
    const response = await fetch('http://localhost:3000/api/admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed:', error);
      return;
    }
    
    const result = await response.json();
    console.log('\n✅ Order created:', result.data);
    console.log(`\n🔗 View at: http://localhost:3000/orders/${result.data.id}`);
    
    // Wait a moment then check if it's in the database
    console.log('\n⏳ Checking database in 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet',
    });
    
    const dbCheck = await pool.query('SELECT id, order_number, customer_id FROM orders WHERE id = $1', [result.data.id]);
    
    if (dbCheck.rows.length > 0) {
      console.log('✅ Order found in database:', dbCheck.rows[0]);
    } else {
      console.log('❌ Order NOT found in database!');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOrderCreation();
