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
- `search_orders` - Search orders by customer, status, lane, location, or date range
  - Filter by customer name, status (pending, in_transit, delivered, cancelled, at_risk)
  - Filter by location, lane, or date range
  - Supports pagination with limit parameter
- `get_order_detail` - Get detailed order information by order ID
- `create_order` - Create a new order
- `get_order_stats` - Get order statistics and counts by status

### Driver Tools
- `list_drivers` - List all drivers with comprehensive filtering
  - Filter by status (Ready, Booked, Off-duty)
  - Filter by hours available (min/max)
  - Filter by location or region
  - Returns current assignment and contact info
- `get_driver_detail` - Get specific driver information including:
  - Current assignment (trip, order, unit)
  - Performance metrics (on-time rate, total trips, rating)
  - License and contact information

### Trip Tools
- `list_trips` - List all trips with rich filtering
  - Filter by status, driver, order, or date range
  - Returns driver and unit details with each trip
  - Includes timing metrics (on-time pickup/delivery)
  - Supports pagination
- `get_trip_detail` - Get detailed trip information including timeline, telemetry, and exceptions
- `update_trip_status` - Update trip status with optional notes

### Unit (Truck) Tools
- `list_units` - List all trucks/units with filtering
  - Filter by status (Available, In Use, Maintenance, Out of Service)
  - Filter by region, type, or location
  - Returns availability and current location
- `get_unit_detail` - Get detailed unit information including:
  - Specifications (make, model, year, VIN, capacity)
  - Maintenance history and schedule
  - Current assignment (trip, driver, order)
- `get_available_units` - Get units ready for dispatch in a specific location/region

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

**See [CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md) for detailed setup instructions.**

Quick setup:

1. Build the server: `npm run build`
2. Add to `claude_desktop_config.json`:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
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

**macOS/Linux:** `~/Library/Application Support/Claude/claude_desktop_config.json`
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

3. Restart Claude Desktop
4. Ask: "What tools do you have available?"

### Testing the MCP Server

Before connecting Claude Desktop, test the server:

```bash
node test-mcp-enhanced.js
```

This runs automated tests for all tools.

## 🎯 Example Usage

### Example 1: Find at-risk orders and recommend driver
**AI Query:** "Find all at-risk orders for Brightline Retail and recommend the best driver"

**MCP Tool Calls:**
1. `search_orders({ customer: "Brightline Retail", status: "at_risk" })`
2. `list_drivers({ status: "Ready", minHours: 5 })`
3. `recommend_driver_for_order({ orderId: "ORD-10453" })`

**AI Response:** "Found 2 at-risk orders. Recommend assigning DRV-204 (7.5 hrs available) to ORD-10453"

### Example 2: Find available trucks in Chicago
**AI Query:** "What dry van trucks are available in Chicago?"

**MCP Tool Calls:**
1. `get_available_units({ location: "Chicago", unitType: "Dry Van" })`

**AI Response:** "Found 5 available dry van trucks in Chicago: UNIT-101, UNIT-204, UNIT-305, UNIT-412, UNIT-519"

### Example 3: Monitor active trips for a driver
**AI Query:** "Show me all active trips for driver DRV-204"

**MCP Tool Calls:**
1. `list_trips({ driverId: "DRV-204", status: "in_transit" })`
2. `get_driver_detail({ driverId: "DRV-204" })`

**AI Response:** "Driver DRV-204 (John Smith) has 1 active trip: TRP-9001, currently en route to Toronto, ETA 2 hours"

### Example 4: Search orders in date range
**AI Query:** "Find all orders from last week to Chicago"

**MCP Tool Calls:**
1. `search_orders({ location: "Chicago", dateFrom: "2025-11-11", dateTo: "2025-11-18" })`

**AI Response:** "Found 12 orders to Chicago from the past week. 8 delivered, 3 in transit, 1 at risk"

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
