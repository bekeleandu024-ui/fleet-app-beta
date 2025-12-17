const axios = require('axios');

async function checkOrdersService() {
  try {
    const response = await axios.get('http://localhost:4002/api/orders');
    console.log('Orders Service status:', response.status);
    console.log('Orders Service data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error fetching from Orders Service:', error.message);
  }
}

checkOrdersService();
