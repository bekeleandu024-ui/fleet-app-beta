import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { orderTools } from './tools/orders.js';
import { driverTools } from './tools/drivers.js';
import { tripTools } from './tools/trips.js';
import { costingTools } from './tools/costing.js';
import { dispatchTools } from './tools/dispatch.js';

const PORT = process.env.PORT || 6001;

// MCP Server setup
const server = new Server(
  {
    name: 'fleet-management-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Combine all tools
const allTools = {
  ...orderTools,
  ...driverTools,
  ...tripTools,
  ...costingTools,
  ...dispatchTools,
};

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(allTools).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const tool = allTools[toolName as keyof typeof allTools];

  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  try {
    const result = await tool.handler(request.params.arguments ?? {});
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }),
        },
      ],
      isError: true,
    };
  }
});

// Start MCP server
async function startMCPServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Fleet Management MCP server running on stdio');
}

// Check if running in Docker or directly (for Claude Desktop)
const isDocker = process.env.DOCKER === 'true';

if (isDocker) {
  // Also expose HTTP endpoint for health checks in Docker
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({
      name: 'Fleet Management MCP Server',
      version: '1.0.0',
      tools: Object.keys(allTools),
    });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy' });
  });

  app.listen(PORT, () => {
    console.error(`MCP HTTP endpoint listening on port ${PORT}`);
  });
}

// Start MCP server
startMCPServer().catch(console.error);
