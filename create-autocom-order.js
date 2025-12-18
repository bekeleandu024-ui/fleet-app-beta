const { exec } = require('child_process');

async function createOrder() {
  try {
    console.log('📦 Creating order from load request...\n');
    
    const orderPayload = {
      customer: "AUTOCOM",
      pickup: "450 Trillium Dr, Kitchener, ON N2R 1K4, Canada",
      delivery: "10815 Pineville Rd, Charlotte, NC 28226, USA",
      window: "2026-01-06 08:00 - 2026-01-07 16:00",
      status: "New",
      ageHours: 0,
      cost: 2950,
      lane: "Kitchener, ON → Charlotte, NC",
      serviceLevel: "Cross-Border",
      commodity: "Dry Van - 20 Pallets (29,500 lb)",
      laneMiles: 650,
      reference: "AUTOCOM-JAN06"
    };
    
    console.log('📋 Order Details:');
    console.log(`  Customer: ${orderPayload.customer}`);
    console.log(`  Pickup: ${orderPayload.pickup}`);
    console.log(`  Delivery: ${orderPayload.delivery}`);
    console.log(`  Service: ${orderPayload.serviceLevel}`);
    console.log(`  Commodity: ${orderPayload.commodity}`);
    console.log('');
    
    console.log('🚀 Sending request to API...');
    const response = await fetch('http://localhost:3000/api/admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    const orderId = result.data.id;
    
    console.log('✅ Order created successfully!');
    console.log(`📦 Order ID: ${orderId}`);
    console.log(`🔗 Order URL: http://localhost:3000/orders/${orderId}`);
    console.log('');
    
    // Open the browser to the order detail page
    console.log('🌐 Opening order in browser...');
    const url = `http://localhost:3000/orders/${orderId}`;
    
    // Open browser based on OS
    const command = process.platform === 'win32' 
      ? `start ${url}`
      : process.platform === 'darwin'
      ? `open ${url}`
      : `xdg-open ${url}`;
    
    exec(command, (error) => {
      if (error) {
        console.log('⚠️  Could not open browser automatically');
        console.log(`Please open: ${url}`);
      } else {
        console.log('✅ Browser opened!');
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating order:', error.message);
    process.exit(1);
  }
}

createOrder();
