#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

console.log('🧪 Testing Orders Tools Fix\n');

const mcpServer = spawn('node', ['./dist/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: {
    ...process.env,
    ORDERS_SERVICE: 'http://localhost:4002',
    MASTER_DATA_SERVICE: 'http://localhost:4001',
    DISPATCH_SERVICE: 'http://localhost:4003',
    TRACKING_SERVICE: 'http://localhost:4004',
  }
});

const rl = readline.createInterface({
  input: mcpServer.stdout,
  crlfDelay: Infinity
});

let testStep = 0;

const tests = [
  {
    name: 'Initialize',
    request: {
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    }
  },
  {
    name: 'Get Order Stats',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'get_order_stats',
        arguments: {}
      }
    }
  },
  {
    name: 'Search All Orders',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'search_orders',
        arguments: {}
      }
    }
  },
  {
    name: 'Search Orders by Customer',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'search_orders',
        arguments: { customer: 'AUTOCOM' }
      }
    }
  }
];

rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    const test = tests.find(t => t.request.id === response.id);
    
    if (response.error) {
      console.log(`❌ ${test?.name || 'Test'} FAILED`);
      console.log(`   Error: ${response.error.message}\n`);
    } else if (response.result) {
      console.log(`✅ ${test?.name || 'Test'} PASSED`);
      
      if (test?.name === 'Get Order Stats') {
        const content = response.result.content?.[0]?.text;
        if (content) {
          const data = JSON.parse(content);
          console.log(`   Total Orders: ${data.total}`);
          console.log(`   Stats: ${JSON.stringify(data.stats || data.byStatus)}\n`);
        }
      } else if (test?.name.includes('Search')) {
        const content = response.result.content?.[0]?.text;
        if (content) {
          const data = JSON.parse(content);
          console.log(`   Found: ${data.count} orders`);
          if (data.orders && data.orders.length > 0) {
            console.log(`   Sample: ${data.orders[0].customer} - ${data.orders[0].status}\n`);
          }
        }
      }
      
      runNextTest();
    }
  } catch (e) {
    // Ignore non-JSON lines
  }
});

function runNextTest() {
  testStep++;
  if (testStep >= tests.length) {
    console.log('🎉 All tests completed!\n');
    mcpServer.kill();
    process.exit(0);
    return;
  }
  
  setTimeout(() => {
    const test = tests[testStep];
    console.log(`Running: ${test.name}...`);
    mcpServer.stdin.write(JSON.stringify(test.request) + '\n');
  }, 500);
}

// Start first test
setTimeout(() => {
  console.log('Starting MCP server...\n');
  mcpServer.stdin.write(JSON.stringify(tests[0].request) + '\n');
}, 1000);

setTimeout(() => {
  console.error('\n⏱️ Test timeout');
  mcpServer.kill();
  process.exit(1);
}, 15000);
