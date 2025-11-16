# MCP Fleet Connector - Testing Guide

## Test the MCP Server

### 1. Start the service

```bash
# Using Docker
docker-compose up -d mcp-fleet-connector

# Or locally
cd services/mcp-fleet-connector
npm install
npm run dev
```

### 2. Check health

```bash
curl http://localhost:6000/health
```

Expected response:
```json
{
  "status": "healthy"
}
```

### 3. List available tools

```bash
curl http://localhost:6000/
```

## Example Tool Calls

### Search Orders

```typescript
// Tool: search_orders
{
  "customer": "Brightline Retail",
  "status": "At Risk"
}
```

### Calculate Cost

```typescript
// Tool: calculate_cost
{
  "miles": 1000,
  "unitType": "53' Reefer",
  "serviceLevel": "Premium"
}
```

### Recommend Driver

```typescript
// Tool: recommend_driver_for_order
{
  "orderId": "ORD-10453",
  "lane": "Ontario, CA → Denver, CO"
}
```

### List Drivers

```typescript
// Tool: list_drivers
{
  "status": "Ready",
  "minHours": 5
}
```

## AI Integration Examples

### Example 1: Find and Assign Orders

**User Query:** "Show me all new orders for Apex Manufacturing and recommend drivers"

**MCP Tool Calls:**
1. `search_orders({ customer: "Apex Manufacturing", status: "New" })`
2. `list_drivers({ status: "Ready", minHours: 7 })`
3. `recommend_driver_for_order({ orderId: "ORD-10452" })`

### Example 2: Calculate Pricing

**User Query:** "What should I charge for a 750-mile dry van load?"

**MCP Tool Calls:**
1. `get_costing_rules({ category: "base-rate" })`
2. `calculate_cost({ miles: 750, unitType: "53' Dry Van", serviceLevel: "Standard" })`

### Example 3: Monitor Trips

**User Query:** "Are there any trips running late?"

**MCP Tool Calls:**
1. `list_trips({ status: "Running Late" })`
2. For each trip: `get_trip_detail({ tripId: "TRP-9002" })`

## Using with Claude Desktop

1. Install Claude Desktop
2. Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fleet-management": {
      "command": "node",
      "args": [
        "C:/Users/bekel/Desktop/fleet-app-beta/services/mcp-fleet-connector/dist/index.js"
      ]
    }
  }
}
```

3. Restart Claude Desktop
4. You should see "MCP" badge with available tools

## Using with VS Code Copilot

Coming soon - MCP support in VS Code Copilot

## Troubleshooting

### Connection Errors

Make sure all backend services are running:
```bash
docker-compose ps
```

### Tool Not Found

Check available tools:
```bash
curl http://localhost:6000/ | jq '.tools'
```

### Service Unavailable

Check logs:
```bash
docker-compose logs mcp-fleet-connector
```
