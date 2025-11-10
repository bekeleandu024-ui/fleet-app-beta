# Backend API Quick Reference

## Master-Data Service (Port 4001)

### Metadata Endpoints (NEW!)

#### Get Summary
```bash
GET http://localhost:4001/api/metadata/summary
```
Response:
```json
{
  "summary": {
    "active_rules": 26,
    "active_drivers": 6,
    "active_units": 6,
    "event_types": 6,
    "cost_calculations": 1,
    "total_orders": 3
  },
  "timestamp": "2025-11-10T04:50:00.000Z"
}
```

#### Get All Costing Rules
```bash
GET http://localhost:4001/api/metadata/rules
```
Response:
```json
{
  "count": 26,
  "rules": [
    {
      "rule_key": "BASE_WAGE",
      "rule_type": "COM",
      "rule_value": "0.4500",
      "description": "Company driver base CPM",
      "is_active": true,
      "effective_date": "2025-11-08T..."
    },
    ...
  ]
}
```

#### Get All Drivers
```bash
GET http://localhost:4001/api/metadata/drivers
```
Response:
```json
{
  "count": 6,
  "drivers": [
    {
      "driver_id": "uuid",
      "driver_name": "John Smith",
      "unit_number": "UNIT-101",
      "driver_type": "COM",
      "oo_zone": null,
      "base_wage_cpm": "0.4500",
      "effective_wage_cpm": "0.5400",
      "is_active": true
    },
    ...
  ]
}
```

#### Get All Units
```bash
GET http://localhost:4001/api/metadata/units
```
Response:
```json
{
  "count": 6,
  "units": [
    {
      "unit_id": "uuid",
      "unit_number": "UNIT-101",
      "driver_id": "uuid",
      "driver_name": "John Smith",
      "driver_type": "COM",
      "truck_weekly_cost": "850.00",
      "trailer_weekly_cost": "250.00",
      "total_weekly_cost": "1985.00",
      "is_active": true
    },
    ...
  ]
}
```

#### Get All Event Types & Rules
```bash
GET http://localhost:4001/api/metadata/events
```
Response:
```json
{
  "event_types": {
    "count": 6,
    "types": [
      {
        "event_id": "uuid",
        "event_code": "BC",
        "event_name": "Border Crossing",
        "cost_per_event": "150.00",
        "is_automatic": true
      },
      ...
    ]
  },
  "event_rules": {
    "count": 3,
    "rules": [
      {
        "rule_id": "uuid",
        "event_code": "BC",
        "event_name": "Border Crossing",
        "trigger_type": "BORDER_CROSSING",
        "trigger_condition": {
          "countries": ["USA", "CANADA"],
          "detect_by": "location"
        }
      },
      ...
    ]
  }
}
```

### Costing Endpoints

#### Calculate Trip Cost
```bash
POST http://localhost:4001/api/costing/calculate
Content-Type: application/json

{
  "order_id": "uuid",
  "driver_id": "uuid",
  "miles": 550,
  "revenue": 2800,
  "order_type": "delivery",
  "origin": "Chicago, IL",
  "destination": "Toronto, ON"
}
```

#### Get Cost Breakdown
```bash
GET http://localhost:4001/api/costing/breakdown/:orderId
```

#### Update Actual Costs
```bash
PATCH http://localhost:4001/api/costing/actual/:orderId
Content-Type: application/json

{
  "actual_miles": 560,
  "actual_cost": 2700
}
```

---

## Orders Service (Port 4002)

```bash
# Create Order
POST http://localhost:4002/api/orders

# List Orders
GET http://localhost:4002/api/orders

# Get Order
GET http://localhost:4002/api/orders/:id

# Update Status
PATCH http://localhost:4002/api/orders/:id/status

# Cancel Order
POST http://localhost:4002/api/orders/:id/cancel

# Calculate Cost
POST http://localhost:4002/api/orders/:id/calculate-cost

# Get Breakdown
GET http://localhost:4002/api/orders/:id/cost-breakdown
```

---

## Dispatch Service (Port 4003)

```bash
# Assign Driver
POST http://localhost:4003/api/dispatch/assign

# Get Dispatch
GET http://localhost:4003/api/dispatch/:id

# Update Status
PATCH http://localhost:4003/api/dispatch/:id/status
```

---

## Tracking Service (Port 4004)

### Trips
```bash
GET /api/trips
POST /api/trips
GET /api/trips/:id
PATCH /api/trips/:id/status
PATCH /api/trips/:id
```

### Events
```bash
GET /api/trips/:id/events
POST /api/trips/:id/events
```

### Exceptions
```bash
GET /api/trips/:id/exceptions
POST /api/trips/:id/exceptions
POST /api/trips/exceptions/:exceptionId/resolve
```

### Telemetry
```bash
POST /api/telemetry/pings
```

### Views
```bash
GET /api/views/dispatch
GET /api/views/driver/:driverId
GET /api/views/customer/:orderId
```

---

## PowerShell Testing Examples

### Get Summary
```powershell
Invoke-WebRequest -Uri "http://localhost:4001/api/metadata/summary" -UseBasicParsing | Select-Object StatusCode, Content
```

### Get Rules (formatted)
```powershell
$rules = (Invoke-WebRequest -Uri "http://localhost:4001/api/metadata/rules" -UseBasicParsing).Content | ConvertFrom-Json
$rules.rules | Format-Table rule_key, rule_type, rule_value, description
```

### Get Drivers (formatted)
```powershell
$drivers = (Invoke-WebRequest -Uri "http://localhost:4001/api/metadata/drivers" -UseBasicParsing).Content | ConvertFrom-Json
$drivers.drivers | Format-Table driver_name, unit_number, driver_type, effective_wage_cpm
```

### Calculate Cost
```powershell
$body = @{
    order_id = "6daacabe-922b-45ba-af53-69de446b3f0a"
    driver_id = "driver-uuid"
    miles = 550
    revenue = 2800
    order_type = "delivery"
    origin = "Chicago, IL"
    destination = "Toronto, ON"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4001/api/costing/calculate" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```

---

## Database Direct Access

### Connect to Database
```bash
docker exec -it fleet-app-beta-postgres-1 psql -U postgres -d fleet
```

### Useful Queries
```sql
-- List all tables
\dt

-- Get all rules
SELECT rule_key, rule_type, rule_value, description FROM costing_rules ORDER BY rule_key;

-- Get all drivers
SELECT driver_name, unit_number, driver_type, effective_wage_cpm FROM driver_profiles;

-- Get all orders
SELECT id, customer_id, order_type, status FROM orders;

-- Get cost calculations
SELECT order_id, miles, total_cpm, total_cost, revenue, profit FROM trip_costs;
```

---

## Service Health Checks

```bash
# Master-Data
curl http://localhost:4001/health

# Orders
curl http://localhost:4002

# Dispatch
curl http://localhost:4003

# Tracking
curl http://localhost:4004
```

---

## Docker Commands

```bash
# View all containers
docker ps

# View logs
docker logs fleet-app-beta-master-data-1 --tail 50
docker logs fleet-app-beta-orders-1 --tail 50
docker logs fleet-app-beta-dispatch-1 --tail 50
docker logs fleet-app-beta-tracking-1 --tail 50

# Restart service
docker-compose restart master-data

# Rebuild service
docker-compose up -d --build master-data

# Stop all
docker-compose down

# Start all
docker-compose up -d
```
