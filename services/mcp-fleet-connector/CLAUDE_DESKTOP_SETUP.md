# Claude Desktop MCP Server Setup Guide

This guide walks you through connecting Claude Desktop to your Fleet Management MCP Server.

## Prerequisites

- Claude Desktop installed
- Node.js installed (v18 or higher)
- Fleet Management System running (or services accessible)

## Step 1: Build the MCP Server

```bash
cd services/mcp-fleet-connector
npm install
npm run build
```

This creates the compiled JavaScript in the `dist/` folder.

## Step 2: Configure Claude Desktop

### Windows

1. Open Claude Desktop configuration file:
   - Press `Win + R`
   - Type: `%APPDATA%\Claude\claude_desktop_config.json`
   - Press Enter

2. Add the MCP server configuration:

```json
{
  "mcpServers": {
    "fleet-management": {
      "command": "node",
      "args": ["C:\\Users\\bekel\\Desktop\\fleet-app-beta\\services\\mcp-fleet-connector\\dist\\index.js"],
      "env": {
        "ORDERS_SERVICE": "http://localhost:4002",
        "MASTER_DATA_SERVICE": "http://localhost:4001",
        "DISPATCH_SERVICE": "http://localhost:4003",
        "TRACKING_SERVICE": "http://localhost:4004"
      }
    }
  }
}
```

### macOS/Linux

1. Open Claude Desktop configuration:
   ```bash
   nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. Add the configuration:

```json
{
  "mcpServers": {
    "fleet-management": {
      "command": "node",
      "args": ["/path/to/fleet-app-beta/services/mcp-fleet-connector/dist/index.js"],
      "env": {
        "ORDERS_SERVICE": "http://localhost:4002",
        "MASTER_DATA_SERVICE": "http://localhost:4001",
        "DISPATCH_SERVICE": "http://localhost:4003",
        "TRACKING_SERVICE": "http://localhost:4004"
      }
    }
  }
}
```

**Important:** Replace `/path/to/` with your actual path!

## Step 3: Restart Claude Desktop

Close and reopen Claude Desktop for the changes to take effect.

## Step 4: Verify Connection

In Claude Desktop, try asking:

> "What tools do you have available?"

You should see tools like:
- `search_orders`
- `list_drivers`
- `list_trips`
- `list_units`
- `get_order_detail`
- `get_driver_detail`
- etc.

## Step 5: Start Using Your Fleet Management Tools!

### Example Queries

**Orders:**
- "Find all orders for Brightline Retail"
- "Show me at-risk orders from last week"
- "What orders are going to Chicago?"

**Drivers:**
- "List all ready drivers with at least 5 hours available"
- "Show me details for driver DRV-204"
- "Which drivers are in the Chicago area?"

**Trips:**
- "Show all active trips"
- "What trips is driver DRV-204 working on?"
- "List completed trips from today"

**Units (Trucks):**
- "What trucks are available in Chicago?"
- "Show me all dry van units"
- "Get details for unit UNIT-101"
- "Find reefer trucks in the Midwest"

**Complex Queries:**
- "Find at-risk orders for Brightline Retail and recommend the best available driver"
- "Show me all active trips with their drivers and trucks"
- "What orders from last 3 days are going to Toronto?"

## Troubleshooting

### "No tools available"
- Check that the path in `claude_desktop_config.json` is correct
- Verify the MCP server was built (`npm run build`)
- Restart Claude Desktop

### "Failed to connect to service"
- Make sure your backend services are running
- Check the service URLs in the `env` section match your setup
- For development, you might need to start services:
  ```bash
  cd fleet-app-beta
  docker-compose up -d
  ```

### Check MCP Server Logs
The MCP server writes to stderr. You can test it manually:
```bash
node dist/index.js
```

Then type a test tool call to verify it works.

## Environment Variables

Customize these in the `env` section of your config:

| Variable | Description | Default |
|----------|-------------|---------|
| `ORDERS_SERVICE` | Orders API endpoint | `http://localhost:4002` |
| `MASTER_DATA_SERVICE` | Master data (drivers, units) | `http://localhost:4001` |
| `DISPATCH_SERVICE` | Dispatch and recommendations | `http://localhost:4003` |
| `TRACKING_SERVICE` | Trip tracking | `http://localhost:4004` |

## Advanced: Production Configuration

For production deployments with remote services:

```json
{
  "mcpServers": {
    "fleet-management": {
      "command": "node",
      "args": ["C:\\Users\\bekel\\Desktop\\fleet-app-beta\\services\\mcp-fleet-connector\\dist\\index.js"],
      "env": {
        "ORDERS_SERVICE": "https://api.yourfleet.com/orders",
        "MASTER_DATA_SERVICE": "https://api.yourfleet.com/master-data",
        "DISPATCH_SERVICE": "https://api.yourfleet.com/dispatch",
        "TRACKING_SERVICE": "https://api.yourfleet.com/tracking"
      }
    }
  }
}
```

## What You Can Do Now

Claude Desktop can now:
- ✅ Search and filter orders by customer, status, location, lane, date
- ✅ View detailed order information
- ✅ List and filter drivers by status, hours, location
- ✅ Get driver details with performance metrics
- ✅ Monitor trips with filtering by driver, order, status, date
- ✅ View trip details with timeline and exceptions
- ✅ List and filter trucks/units by status, region, type, location
- ✅ Get detailed unit info with maintenance and assignments
- ✅ Find available units for dispatch
- ✅ Get costing information
- ✅ Create dispatch assignments
- ✅ AI-powered driver recommendations

Enjoy your AI-powered fleet management assistant! 🚚✨
