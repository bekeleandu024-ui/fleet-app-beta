# 🚀 Quick Start Guide - Claude Desktop Fleet Management

## Setup (5 minutes)

1. **Build the MCP server:**
   ```bash
   cd services/mcp-fleet-connector
   npm install
   npm run build
   ```

2. **Configure Claude Desktop:**
   
   Edit config file:
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   
   Add:
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
   
   ⚠️ **Change the path** to match your system!

3. **Restart Claude Desktop**

4. **Test it:** Ask Claude "What tools do you have available?"

## Quick Reference - What You Can Ask

### 📦 Orders
```
"Find all orders for [customer name]"
"Show me at-risk orders"
"What orders are going to [city]?"
"Find orders from last week"
"Show me pending orders from [date] to [date]"
```

### 👨‍✈️ Drivers
```
"List all ready drivers"
"Show me drivers with at least [X] hours available"
"Which drivers are in [location]?"
"Get details for driver [DRV-XXX]"
"Find drivers who need rest" (use maxHours)
```

### 🚛 Trips
```
"Show all active trips"
"List trips for driver [DRV-XXX]"
"What trips are in transit?"
"Show completed trips from today"
"Find trips for order [ORD-XXX]"
```

### 🚚 Units (Trucks)
```
"What trucks are available?"
"Show me dry van units"
"Find available trucks in [location]"
"Get details for unit [UNIT-XXX]"
"What reefer trucks are in [region]?"
```

### 🎯 Complex Queries
```
"Find at-risk orders for [customer] and recommend a driver"
"Show all active trips with their driver and truck details"
"What orders need reefer trucks and which are available?"
"Find drivers in [city] with trucks ready to go"
```

## Available Tools

| Orders | Drivers | Trips | Units |
|--------|---------|-------|-------|
| search_orders | list_drivers | list_trips | list_units |
| get_order_detail | get_driver_detail | get_trip_detail | get_unit_detail |
| create_order | | update_trip_status | get_available_units |
| get_order_stats | | | |

**Plus:** Costing and Dispatch tools for recommendations and route optimization

## Filter Cheat Sheet

### Search Orders
- `customer` - Customer name or ID
- `status` - pending, in_transit, delivered, cancelled, at_risk
- `location` - City name
- `lane` - Route (e.g., "Chicago → Toronto")
- `dateFrom` / `dateTo` - Date range (YYYY-MM-DD)
- `limit` - Max results

### List Drivers
- `status` - Ready, Booked, Off-duty
- `minHours` / `maxHours` - Hours available
- `location` - City or region

### List Trips
- `status` - planned, assigned, in_transit, delivered, completed, cancelled
- `driverId` - Driver ID
- `orderId` - Order ID
- `dateFrom` / `dateTo` - Date range
- `limit` - Max results

### List Units
- `status` - Available, In Use, Maintenance, Out of Service
- `region` - Region name
- `type` - Dry Van, Reefer, Flatbed, etc.
- `location` - City or location

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No tools available" | Check path in config, rebuild with `npm run build`, restart Claude Desktop |
| "Failed to connect" | Make sure backend services are running (`docker-compose up -d`) |
| "Order not found" | Try using `search_orders` first to find the correct ID |
| "Driver not found" | Use `list_drivers` to see available drivers |

## Test Before Using

```bash
node test-mcp-enhanced.js
```

This tests all tools and shows you what's working.

## Pro Tips

1. **Be specific with customer names** - "Brightline Retail" works better than "Brightline"
2. **Use date ranges for better results** - "from 2025-11-11 to 2025-11-18"
3. **Start broad, then narrow** - List all, then filter
4. **Combine tools** - Ask Claude to use multiple tools together
5. **Ask for recommendations** - Claude can suggest the best driver for an order

## Example Conversation

**You:** "What orders do I have that are at risk?"

**Claude:** Uses `search_orders({ status: "at_risk" })`
> "You have 3 at-risk orders: ORD-10453 (Brightline Retail, Chicago → Toronto), ORD-10512 (Acme Corp, Buffalo → Detroit), and ORD-10567 (Global Logistics, Milwaukee → Chicago)."

**You:** "Recommend a driver for the first one"

**Claude:** Uses `get_order_detail`, `list_drivers`, and `recommend_driver_for_order`
> "For ORD-10453, I recommend Driver DRV-204 (John Smith). He has 7.5 hours available, is currently in the Chicago area, and has a 98% on-time delivery rate."

**You:** "Is there a truck available?"

**Claude:** Uses `get_available_units({ location: "Chicago" })`
> "Yes! There are 5 dry van trucks available in Chicago: UNIT-101, UNIT-204, UNIT-305, UNIT-412, and UNIT-519."

## Need More Help?

- Full setup guide: `CLAUDE_DESKTOP_SETUP.md`
- Complete documentation: `README.md`
- What's new: `ENHANCEMENTS.md`

---

**Happy Fleet Managing with AI! 🚚✨**
