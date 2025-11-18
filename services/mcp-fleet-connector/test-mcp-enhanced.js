#!/usr/bin/env node

/**
 * Test script for Fleet Management MCP Server
 * 
 * This script tests all the available tools to ensure they work correctly.
 * Run this before connecting Claude Desktop to verify everything is working.
 */

const { spawn } = require('child_process');
const readline = require('readline');

const mcpServerPath = './dist/index.js';

// Test tool calls
const testCases = [
  {
    name: 'List all orders',
    call: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'search_orders',
        arguments: {}
      }
    }
  },
  {
    name: 'Search orders by customer',
    call: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'search_orders',
        arguments: { customer: 'Brightline' }
      }
    }
  },
  {
    name: 'List ready drivers',
    call: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'list_drivers',
        arguments: { status: 'Ready' }
      }
    }
  },
  {
    name: 'List all trips',
    call: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'list_trips',
        arguments: {}
      }
    }
  },
  {
    name: 'List all units',
    call: {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'list_units',
        arguments: {}
      }
    }
  },
  {
    name: 'Get available units in a location',
    call: {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'get_available_units',
        arguments: { location: 'Chicago' }
      }
    }
  },
  {
    name: 'List available tools',
    call: {
      jsonrpc: '2.0',
      id: 0,
      method: 'tools/list',
      params: {}
    }
  }
];

console.log('🧪 Fleet Management MCP Server Test Suite\n');
console.log('Starting MCP server...\n');

// Start the MCP server
const mcpServer = spawn('node', [mcpServerPath], {
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

let currentTestIndex = 0;
let responses = [];

// Send initialize request first
const initRequest = {
  jsonrpc: '2.0',
  id: -1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

setTimeout(() => {
  mcpServer.stdin.write(JSON.stringify(initRequest) + '\n');
}, 500);

// Handle responses
rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    
    if (response.id === -1) {
      // Initialize complete, start tests
      console.log('✅ MCP Server initialized\n');
      runNextTest();
    } else if (response.id >= 0) {
      responses.push(response);
      const testCase = testCases.find(tc => tc.call.id === response.id);
      
      if (response.error) {
        console.log(`❌ Test ${response.id}: ${testCase?.name || 'Unknown'}`);
        console.log(`   Error: ${response.error.message}\n`);
      } else {
        console.log(`✅ Test ${response.id}: ${testCase?.name || 'Unknown'}`);
        
        // Show summary of results
        if (response.result?.content) {
          const content = response.result.content[0]?.text;
          if (content) {
            try {
              const data = JSON.parse(content);
              if (data.count !== undefined) {
                console.log(`   Found ${data.count} items`);
              } else if (data.tools) {
                console.log(`   ${data.tools.length} tools available`);
              }
            } catch (e) {
              // Not JSON, that's okay
            }
          }
        }
        console.log('');
      }
      
      runNextTest();
    }
  } catch (e) {
    // Ignore non-JSON lines (like stderr output)
  }
});

function runNextTest() {
  if (currentTestIndex >= testCases.length) {
    console.log('\n🎉 All tests completed!\n');
    console.log('Summary:');
    console.log(`- Total tests: ${testCases.length}`);
    console.log(`- Passed: ${responses.filter(r => !r.error).length}`);
    console.log(`- Failed: ${responses.filter(r => r.error).length}`);
    console.log('\nYou can now configure Claude Desktop with this MCP server.');
    console.log('See CLAUDE_DESKTOP_SETUP.md for instructions.\n');
    
    mcpServer.kill();
    process.exit(0);
    return;
  }
  
  const testCase = testCases[currentTestIndex];
  currentTestIndex++;
  
  setTimeout(() => {
    mcpServer.stdin.write(JSON.stringify(testCase.call) + '\n');
  }, 1000); // Wait 1 second between tests
}

mcpServer.on('error', (error) => {
  console.error('❌ Failed to start MCP server:', error);
  process.exit(1);
});

mcpServer.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n❌ MCP server exited with code ${code}`);
    process.exit(code);
  }
});

// Timeout after 30 seconds
setTimeout(() => {
  console.error('\n❌ Tests timed out after 30 seconds');
  mcpServer.kill();
  process.exit(1);
}, 30000);
