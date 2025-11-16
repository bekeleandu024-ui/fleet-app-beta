// Test MCP Fleet Connector
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 6001,
  path: '/',
  method: 'GET'
};

console.log('Testing MCP Fleet Connector...\n');

// Test 1: Check if server is running
const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('✅ Server is responding');
    console.log('Response:', JSON.parse(data));
    console.log('\nServer has the following tools:', JSON.parse(data).tools);
  });
});

req.on('error', (error) => {
  console.error('❌ Error connecting to MCP server:', error.message);
});

req.end();
