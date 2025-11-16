# Fleet Management MCP Server

Model Context Protocol (MCP) server that exposes Fleet Management System tools to AI assistants.

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   cd services/mcp-fleet-connector
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

### Docker

```bash
docker-compose up -d mcp-fleet-connector
```

## 🔧 Available Tools

### Order Tools
- `search_orders` - Search orders by customer, status, lane
- `get_order_detail` - Get detailed order information
- `create_order` - Create a new order
- `get_order_stats` - Get order statistics

### Driver Tools
- `list_drivers` - List all drivers with filters
- `get_driver_detail` - Get specific driver information

### Trip Tools
- `list_trips` - List all trips
- `get_trip_detail` - Get detailed trip information
- `update_trip_status` - Update trip status

### Costing Tools
- `get_costing_rules` - Get all costing rules
- `calculate_cost` - Calculate cost for a load
- `get_units` - List available trucks/units

### Dispatch Tools
- `recommend_driver_for_order` - AI-powered driver recommendation
- `optimize_route` - Get optimized route suggestions
- `create_dispatch` - Create dispatch assignment

## 📡 API Endpoints

- `GET /` - Server info and available tools
- `GET /health` - Health check

## 🔌 Using with AI Clients

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fleet-management": {
      "command": "node",
      "args": ["/path/to/fleet-app-beta/services/mcp-fleet-connector/dist/index.js"]
    }
  }
}
```

### VS Code Copilot

Configure MCP server in workspace settings.

## 🎯 Example Usage

**AI Query:** "Find all at-risk orders for Brightline Retail and recommend the best driver"

**MCP Tool Calls:**
1. `search_orders({ customer: "Brightline Retail", status: "At Risk" })`
2. `list_drivers({ status: "Ready", minHours: 5 })`
3. `recommend_driver_for_order({ orderId: "ORD-10453" })`

**AI Response:** "Found 2 at-risk orders. Recommend assigning DRV-204 (7.5 hrs available) to ORD-10453"

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Start production server
npm start
```

## 📦 Environment Variables

```env
PORT=6000
ORDERS_SERVICE=http://orders:4002
MASTER_DATA_SERVICE=http://master-data:4001
DISPATCH_SERVICE=http://dispatch:4003
TRACKING_SERVICE=http://tracking:4004
```

## 🐳 Docker Compose

The service is configured to run as part of the docker-compose stack:

```yaml
mcp-fleet-connector:
  build: ./services/mcp-fleet-connector
  ports:
    - "6000:6000"
  environment:
    - ORDERS_SERVICE=http://orders:4002
    - MASTER_DATA_SERVICE=http://master-data:4001
    - DISPATCH_SERVICE=http://dispatch:4003
    - TRACKING_SERVICE=http://tracking:4004
```

## 📝 License

MIT
