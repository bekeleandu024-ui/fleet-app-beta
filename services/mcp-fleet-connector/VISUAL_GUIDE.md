
# 🎯 Fleet Management MCP Server - Visual Guide

## Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                    CLAUDE DESKTOP                          │
│                                                            │
│  "Find at-risk orders and recommend a driver with truck"  │
│                                                            │
└────────────────────┬───────────────────────────────────────┘
                     │
                     │ MCP Protocol
                     │ (stdio - JSON messages)
                     │
┌────────────────────▼───────────────────────────────────────┐
│              MCP Fleet Connector Server                    │
│              (Node.js Process)                             │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Tool Router                                      │    │
│  │  • 17 tools available                             │    │
│  │  • JSON Schema validation                         │    │
│  │  • Error handling                                 │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ ┌───────────┐      │
│  │ Orders  │ │ Drivers │ │ Trips  │ │   Units   │      │
│  │  Tools  │ │  Tools  │ │ Tools  │ │   Tools   │      │
│  │  (4)    │ │  (2)    │ │  (3)   │ │   (3)     │      │
│  └────┬────┘ └────┬────┘ └────┬───┘ └─────┬─────┘      │
│       │           │            │            │             │
│  ┌────┴────┐ ┌───┴──────┐ ┌──┴─────┐ ┌───┴──────┐      │
│  │ Costing │ │ Dispatch │ │        │ │          │      │
│  │  Tools  │ │  Tools   │ │        │ │          │      │
│  │  (2)    │ │  (3)     │ │        │ │          │      │
│  └─────────┘ └──────────┘ └────────┘ └──────────┘      │
│                                                            │
└────────────────────┬───────────────────────────────────────┘
                     │
                     │ HTTP/REST Calls
                     │
┌────────────────────▼───────────────────────────────────────┐
│              Backend Microservices                         │
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Orders    │  │ Master Data │  │  Dispatch   │      │
│  │   Service   │  │   Service   │  │   Service   │      │
│  │  :4002      │  │  :4001      │  │  :4003      │      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
│         │                 │                 │             │
│  ┌──────▼─────────────────▼─────────────────▼─────┐      │
│  │            Tracking Service :4004               │      │
│  └──────────────────┬──────────────────────────────┘      │
│                     │                                      │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      │ Cosmos DB Client
                      │
┌─────────────────────▼──────────────────────────────────────┐
│                   Azure Cosmos DB                          │
│                                                            │
│  Orders | Drivers | Trips | Units | Dispatches | Rules    │
└────────────────────────────────────────────────────────────┘
```

## Data Flow Example

### User Query: "Find at-risk orders for Brightline and recommend a driver"

```
1. USER → CLAUDE DESKTOP
   "Find at-risk orders for Brightline and recommend a driver"
   
2. CLAUDE → MCP SERVER
   Tool Call: search_orders({ 
     customer: "Brightline", 
     status: "at_risk" 
   })
   
3. MCP SERVER → ORDERS SERVICE
   GET http://localhost:4002/api/orders
   
4. ORDERS SERVICE → COSMOS DB
   Query: SELECT * FROM orders 
          WHERE customer LIKE '%Brightline%' 
          AND status = 'at_risk'
   
5. COSMOS DB → ORDERS SERVICE
   Returns: [
     { id: "ORD-10453", customer: "Brightline Retail", ... },
     { id: "ORD-10512", customer: "Brightline Corp", ... }
   ]
   
6. ORDERS SERVICE → MCP SERVER
   Returns order data
   
7. MCP SERVER → CLAUDE
   Returns formatted order list
   
8. CLAUDE → MCP SERVER
   Tool Call: list_drivers({ 
     status: "Ready", 
     minHours: 5 
   })
   
9. MCP SERVER → MASTER DATA SERVICE
   GET http://localhost:4001/api/metadata/drivers
   
10. MASTER DATA → COSMOS DB
    Query: SELECT * FROM drivers 
           WHERE status = 'Ready' 
           AND hoursAvailable >= 5
    
11. COSMOS DB → MASTER DATA
    Returns driver list
    
12. MASTER DATA → MCP SERVER
    Returns driver data
    
13. MCP SERVER → CLAUDE
    Returns formatted driver list
    
14. CLAUDE → USER
    "Found 2 at-risk orders for Brightline:
     - ORD-10453: Chicago → Toronto
     - ORD-10512: Buffalo → Detroit
     
     Available drivers:
     - DRV-204 (7.5 hrs, Chicago area, 98% on-time)
     - DRV-156 (6.2 hrs, Buffalo area, 95% on-time)
     
     Recommendation: Assign DRV-204 to ORD-10453 
     (location match, high availability, excellent rating)"
```

## Tool Categories Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP TOOLS (17)                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   ORDERS     │  │   DRIVERS    │  │    TRIPS     │  │    UNITS     │
│              │  │              │  │              │  │              │
│  search      │  │  list        │  │  list        │  │  list        │
│  get_detail  │  │  get_detail  │  │  get_detail  │  │  get_detail  │
│  create      │  │              │  │  update      │  │  get_avail   │
│  get_stats   │  │              │  │              │  │              │
│              │  │              │  │              │  │              │
│  4 tools     │  │  2 tools     │  │  3 tools     │  │  3 tools     │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│   COSTING    │  │   DISPATCH   │
│              │  │              │
│  get_rules   │  │  recommend   │
│  calculate   │  │  optimize    │
│              │  │  create      │
│              │  │              │
│  2 tools     │  │  3 tools     │
└──────────────┘  └──────────────┘
```

## Filtering Capabilities

```
┌────────────────────────────────────────────────────────────┐
│                   FILTER OPTIONS                           │
└────────────────────────────────────────────────────────────┘

ORDERS                   DRIVERS                  TRIPS
├─ customer             ├─ status                ├─ status
├─ status               ├─ minHours              ├─ driverId
├─ location             ├─ maxHours              ├─ orderId
├─ lane                 ├─ location              ├─ dateFrom
├─ dateFrom             └─ (filters: 4)          ├─ dateTo
├─ dateTo                                        ├─ limit
├─ limit                UNITS                    └─ (filters: 6)
└─ (filters: 7)        ├─ status
                       ├─ region
                       ├─ type
                       ├─ location
                       └─ (filters: 4)
```

## Setup Checklist

```
┌─────────────────────────────────────────────────────────────┐
│                 SETUP CHECKLIST                             │
└─────────────────────────────────────────────────────────────┘

□ 1. Prerequisites
    □ Node.js installed (v18+)
    □ Claude Desktop installed
    □ Backend services running (or accessible)

□ 2. Build MCP Server
    □ cd services/mcp-fleet-connector
    □ npm install
    □ npm run build
    □ Verify: dist/ folder exists

□ 3. Test (Optional but Recommended)
    □ node test-mcp-enhanced.js
    □ All tests pass

□ 4. Configure Claude Desktop
    □ Locate config file:
      Windows: %APPDATA%\Claude\claude_desktop_config.json
      Mac: ~/Library/Application Support/Claude/...
    □ Add fleet-management MCP server config
    □ Update path to match your system
    □ Set correct service URLs

□ 5. Launch
    □ Restart Claude Desktop
    □ Ask: "What tools do you have available?"
    □ Should see 17 tools listed

□ 6. Verify
    □ Try: "Find all orders"
    □ Try: "List ready drivers"
    □ Try: "Show available trucks"

✓ Setup Complete!
```

## Example Conversations

```
┌─────────────────────────────────────────────────────────────┐
│              CONVERSATION EXAMPLES                          │
└─────────────────────────────────────────────────────────────┘

1. SIMPLE QUERY
   You:   "How many orders do I have?"
   Tool:  get_order_stats()
   Reply: "You have 47 total orders: 
           - 12 pending
           - 28 in transit
           - 5 delivered
           - 2 at risk"

2. FILTERED SEARCH
   You:   "Show me at-risk orders from last week"
   Tool:  search_orders({ 
            status: "at_risk",
            dateFrom: "2025-11-11",
            dateTo: "2025-11-18"
          })
   Reply: "Found 3 at-risk orders from last week..."

3. MULTI-TOOL QUERY
   You:   "What drivers and trucks are available in Chicago?"
   Tools: list_drivers({ location: "Chicago" })
          get_available_units({ location: "Chicago" })
   Reply: "In Chicago:
           Drivers: 5 available (DRV-204, DRV-156...)
           Trucks: 8 available (UNIT-101, UNIT-204...)"

4. COMPLEX REASONING
   You:   "Find orders needing reefer trucks and match 
           them with available reefer units"
   Tools: search_orders()
          list_units({ type: "Reefer", status: "Available" })
          (Claude analyzes matches)
   Reply: "Found 4 orders needing reefer trucks...
           Available reefer units in nearby locations..."
```

## Configuration File Structure

```
┌─────────────────────────────────────────────────────────────┐
│         claude_desktop_config.json Structure                │
└─────────────────────────────────────────────────────────────┘

{
  "mcpServers": {                    ← Container for all MCP servers
    "fleet-management": {             ← Your server name
      "command": "node",              ← Runtime to use
      "args": [                       ← Arguments to pass
        "C:\\...\\dist\\index.js"    ← Path to built server
      ],
      "env": {                        ← Environment variables
        "ORDERS_SERVICE": "...",      ← Service URLs
        "MASTER_DATA_SERVICE": "...",
        "DISPATCH_SERVICE": "...",
        "TRACKING_SERVICE": "..."
      }
    }
  }
}

Key Points:
• Use absolute paths
• Windows: Use \\\\ for path separators
• Mac/Linux: Use / for path separators
• Restart Claude Desktop after changes
```

## Troubleshooting Flow

```
┌─────────────────────────────────────────────────────────────┐
│              TROUBLESHOOTING GUIDE                          │
└─────────────────────────────────────────────────────────────┘

Problem: "No tools available"
    │
    ├─→ Check: Config file path correct?
    │     NO → Fix path, restart Claude Desktop
    │     YES ↓
    │
    ├─→ Check: MCP server built?
    │     NO → Run: npm run build
    │     YES ↓
    │
    └─→ Check: Claude Desktop restarted?
          NO → Restart Claude Desktop
          YES → Check logs

Problem: "Failed to connect to service"
    │
    ├─→ Check: Backend services running?
    │     NO → Run: docker-compose up -d
    │     YES ↓
    │
    ├─→ Check: Service URLs correct?
    │     NO → Fix URLs in config, restart
    │     YES ↓
    │
    └─→ Check: Network connectivity?
          NO → Check firewall, ports
          YES → Check service logs

Problem: "Item not found"
    │
    ├─→ Try: Use list/search tool first
    │     Example: list_drivers() before get_driver_detail()
    │
    └─→ Check: ID format correct?
          Example: "DRV-204" not "driver-204"
```

## Quick Reference Card

```
╔═══════════════════════════════════════════════════════════╗
║           FLEET MANAGEMENT MCP - QUICK REF                ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  ORDERS (4 tools)                                         ║
║    search_orders        → Find orders by filters          ║
║    get_order_detail     → Get specific order             ║
║    create_order         → Create new order               ║
║    get_order_stats      → Get statistics                 ║
║                                                           ║
║  DRIVERS (2 tools)                                        ║
║    list_drivers         → List with filters              ║
║    get_driver_detail    → Get specific driver            ║
║                                                           ║
║  TRIPS (3 tools)                                          ║
║    list_trips           → List with filters              ║
║    get_trip_detail      → Get specific trip              ║
║    update_trip_status   → Update status                  ║
║                                                           ║
║  UNITS (3 tools)                                          ║
║    list_units           → List trucks                    ║
║    get_unit_detail      → Get specific unit              ║
║    get_available_units  → Find available trucks          ║
║                                                           ║
║  COSTING (2 tools)                                        ║
║    get_costing_rules    → Get rules                      ║
║    calculate_cost       → Calculate cost                 ║
║                                                           ║
║  DISPATCH (3 tools)                                       ║
║    recommend_driver     → AI recommendation              ║
║    optimize_route       → Route optimization             ║
║    create_dispatch      → Create assignment              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

**Ready to transform your fleet management with AI! 🚀**
