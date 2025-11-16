/**
 * Quick test to verify MCP server loads correctly
 */

const { spawn } = require('child_process');

console.log('🧪 Testing MCP Server...\n');

// Set environment variables
const env = {
  ...process.env,
  PORT: '6001',
  ORDERS_SERVICE: 'http://localhost:4002',
  MASTER_DATA_SERVICE: 'http://localhost:4001',
  DISPATCH_SERVICE: 'http://localhost:4003',
  TRACKING_SERVICE: 'http://localhost:4004'
};

// Start MCP server
const mcp = spawn('node', ['dist/index.js'], { env });

let output = '';

mcp.stdout.on('data', (data) => {
  output += data.toString();
  console.log('📤 STDOUT:', data.toString().trim());
});

mcp.stderr.on('data', (data) => {
  console.error('❌ STDERR:', data.toString().trim());
});

mcp.on('close', (code) => {
  console.log(`\n✅ MCP server exited with code ${code}`);
  
  if (output.includes('MCP HTTP endpoint listening') && output.includes('MCP server running on stdio')) {
    console.log('✅ SUCCESS: MCP server started correctly!');
    console.log('\n📋 Next steps:');
    console.log('  1. Start backend services: docker-compose up -d');
    console.log('  2. Configure Claude Desktop to connect to this MCP server');
    console.log('  3. Use natural language to query your fleet: "Show me all orders"');
  }
});

// Send initialize request (MCP protocol)
setTimeout(() => {
  console.log('\n📨 Sending MCP initialize request...');
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  }) + '\n');
}, 1000);

// Request tools list
setTimeout(() => {
  console.log('📨 Requesting tools list...');
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  }) + '\n');
}, 2000);

// Exit after 3 seconds
setTimeout(() => {
  console.log('\n🛑 Stopping test...');
  mcp.kill();
}, 3500);
