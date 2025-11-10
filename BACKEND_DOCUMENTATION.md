# Fleet App Backend Documentation

## Overview
Microservices architecture with 4 backend services running on Docker, using PostgreSQL and Kafka.

---

## Services

### 1. Master-Data Service (Port 4001)
**Purpose:** Costing engine and rate management  
**Database Tables:** `costing_rules`, `driver_profiles`, `unit_profiles`, `event_types`, `event_rules`, `trip_costs`, `week_miles_summary`

**API Endpoints:**
- `POST /api/costing/calculate` - Calculate trip cost
- `GET /api/costing/breakdown/:orderId` - Get cost breakdown
- `PATCH /api/costing/actual/:orderId` - Update actual costs
- `GET /api/metadata/rules` - Get all costing rules *(NEW)*
- `GET /api/metadata/drivers` - Get all driver profiles *(NEW)*
- `GET /api/metadata/units` - Get all unit profiles *(NEW)*
- `GET /api/metadata/events` - Get all event types *(NEW)*

**Kafka Events Published:**
- `cost.calculated` - Cost calculation completed
- `cost.actual` - Actual costs updated

### 2. Orders Service (Port 4002)
**Purpose:** Order management and lifecycle  
**Database Tables:** `orders`

**API Endpoints:**
- `POST /api/orders` - Create new order
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/cancel` - Cancel order
- `POST /api/orders/:id/calculate-cost` - Calculate cost for order
- `GET /api/orders/:id/cost-breakdown` - Get cost breakdown

**Kafka Events Published:**
- `order.created` - New order created
- `order.status.changed` - Order status updated

### 3. Dispatch Service (Port 4003)
**Purpose:** Driver assignment and dispatch management  
**Database Tables:** `dispatches`

**API Endpoints:**
- `POST /api/dispatch/assign` - Assign driver to order
- `GET /api/dispatch/:id` - Get dispatch details
- `PATCH /api/dispatch/:id/status` - Update dispatch status

**Kafka Events Published:**
- `dispatch.assigned` - Driver assigned to order
- `dispatch.status.changed` - Dispatch status updated

### 4. Tracking Service (Port 4004)
**Purpose:** Trip tracking, telemetry, and exception management  
**Database Tables:** `trips`, `trip_locations`, `trip_stops`, `trip_events`, `trip_exceptions`

**API Endpoints:**

**Trips:**
- `GET /api/trips` - List trips
- `POST /api/trips` - Create trip
- `GET /api/trips/:id` - Get trip details
- `PATCH /api/trips/:id/status` - Update trip status
- `PATCH /api/trips/:id` - Update trip data

**Events:**
- `GET /api/trips/:id/events` - Get trip events
- `POST /api/trips/:id/events` - Add trip event

**Exceptions:**
- `GET /api/trips/:id/exceptions` - Get exceptions
- `POST /api/trips/:id/exceptions` - Create exception
- `POST /api/trips/exceptions/:exceptionId/resolve` - Resolve exception

**Telemetry:**
- `POST /api/telemetry/pings` - GPS location updates

**Views:**
- `GET /api/views/dispatch` - Dispatch dashboard view
- `GET /api/views/driver/:driverId` - Driver view
- `GET /api/views/customer/:orderId` - Customer tracking view

**Kafka Events Published:**
- `tracking.trip.created` - Trip created
- `tracking.trip.status.changed` - Trip status changed
- `tracking.trip.closed` - Trip completed/closed
- `tracking.event.created` - Trip event logged
- `tracking.exception.raised` - Exception raised
- `tracking.exception.resolved` - Exception resolved

---

## Costing Engine Logic

### Costing Rules (26 rules)

#### Base Wages (CPM = Cost Per Mile)
| Driver Type | Zone | Rate |
|------------|------|------|
| Company (COM) | - | $0.45/mile |
| Rental (RNR) | - | $0.38/mile |
| Owner Operator (OO) | ZONE1 | $0.72/mile |
| Owner Operator (OO) | ZONE2 | $0.68/mile |
| Owner Operator (OO) | ZONE3 | $0.65/mile |
| Owner Operator (OO) | Fallback | $0.70/mile |

#### Wage Adders (Applied to Base Wage)
| Type | Percentage |
|------|-----------|
| Benefits | 12% |
| Performance Bonus | 5% |
| Safety Bonus | 3% |
| Step Progression | 2% |
| **Total Multiplier** | **1.22x** |

#### Rolling Costs (Per Mile)
| Category | COM | RNR | OO |
|----------|-----|-----|-----|
| Fuel | $0.45 | $0.42 | $0.50 |
| Truck Maintenance | $0.12 | $0.12 | $0.12 |
| Trailer Maintenance | $0.04 | $0.04 | $0.04 |

#### Weekly Fixed Costs (Allocated by miles)
| Item | Cost/Week |
|------|-----------|
| Trailer Lease | $250 |
| Insurance | $450 |
| Isaac ELD | $35 |
| PrePass | $25 |
| SG&A Allocation | $180 |
| Dispatch/Ops | $120 |
| Miscellaneous | $75 |
| **Total** | **~$1,135** |

#### Accessorial Costs (Per Event)
| Event | Cost |
|-------|------|
| Border Crossing | $150 |
| Drop/Hook | $50 |
| Pickup | $35 |
| Delivery | $35 |
| Layover/Detention | $100 |
| Extra Stop | $50 |

### Cost Calculation Formula

```
Total CPM = Fixed Weekly CPM + Effective Wage CPM + Rolling CPM + Accessorial CPM

Where:
  Fixed Weekly CPM = Unit's Total Weekly Costs / Total Miles This Week
  Effective Wage CPM = Base Wage × 1.22
  Rolling CPM = Fuel CPM + Truck Maint CPM + Trailer Maint CPM
  Accessorial CPM = Sum(Event Costs) / Trip Miles

Total Trip Cost = Total CPM × Miles
```

### Event Auto-Detection

**Border Crossing (BC):**
- Triggers: Route crosses USA/Canada border
- Detection: Checks if origin/destination contains "USA"/"US" and "CANADA"/"CA"
- Cost: $150 per crossing

**Pickup:**
- Triggers: Order type is "pickup" or "round_trip"
- Auto-added: 1 event
- Cost: $35

**Delivery:**
- Triggers: Order type is "delivery" or "round_trip"
- Auto-added: 1 event
- Cost: $35

---

## Sample Data

### Drivers (6 total)
| Name | Unit | Type | Zone | Base CPM | Effective CPM |
|------|------|------|------|----------|---------------|
| John Smith | UNIT-101 | COM | - | $0.45 | $0.54 |
| Jane Doe | UNIT-102 | COM | - | $0.45 | $0.54 |
| Mike Johnson | UNIT-201 | RNR | - | $0.38 | $0.456 |
| Sarah Williams | UNIT-301 | OO | ZONE1 | $0.72 | $0.864 |
| Bob Anderson | UNIT-302 | OO | ZONE2 | $0.68 | $0.816 |
| Lisa Brown | UNIT-303 | OO | ZONE3 | $0.65 | $0.78 |

### Units (6 total)
| Unit | Truck/Week | Trailer/Week | Insurance/Week | Total/Week |
|------|-----------|--------------|----------------|------------|
| UNIT-101 | $850 | $250 | $450 | $1,985 |
| UNIT-102 | $850 | $250 | $450 | $1,985 |
| UNIT-201 | $650 | $250 | $450 | $1,785 |
| UNIT-301 | $0 | $0 | $250 | $685 |
| UNIT-302 | $0 | $0 | $250 | $685 |
| UNIT-303 | $0 | $0 | $250 | $685 |

*Note: Owner-operator units (301-303) have $0 truck costs as they own their equipment*

### Orders (3 total)
| Order ID | Customer | Type | Status | Route |
|----------|----------|------|--------|-------|
| 93bddb8f... | cust-123 | delivery | pending | 123 Main St → 456 Elm St |
| a0208620... | cust-789 | delivery | pending | 100 Oak Ave → 200 Pine St |
| 6daacabe... | cust-demo | delivery | pending | Chicago, IL → Toronto, ON |

### Cost Calculations (1 total)
| Order | Driver Type | Miles | Total CPM | Cost | Revenue | Profit | Profitable? |
|-------|-------------|-------|-----------|------|---------|--------|-------------|
| 6daacabe... | COM | 550 | $4.83 | $2,657.44 | $1,450 | -$1,207.44 | No |

---

## Database Schema

### All Tables (15 total)

**Master-Data Service:**
- `costing_rules` - Pricing rules and rates
- `driver_profiles` - Driver information and wage rates
- `unit_profiles` - Truck/unit weekly costs
- `event_types` - Event definitions (BC, DH, PICKUP, etc.)
- `event_rules` - Auto-detection rules for events
- `trip_costs` - Completed cost calculations
- `week_miles_summary` - Weekly mileage tracking per unit

**Orders Service:**
- `orders` - Customer orders

**Dispatch Service:**
- `dispatches` - Driver assignments

**Tracking Service:**
- `trips` - Active and completed trips
- `trip_locations` - GPS tracking points
- `trip_stops` - Pickup and delivery stops
- `trip_events` - Trip lifecycle events
- `trip_exceptions` - Delays, issues, and alerts

**System:**
- `schema_migrations` - Migration tracking (prevents re-running migrations)

---

## Kafka Event Flow

### Order Lifecycle
```
1. Order Created → order.created
2. Cost Calculated → cost.calculated
3. Driver Assigned → dispatch.assigned
4. Trip Created → tracking.trip.created
5. Trip Updates → tracking.trip.status.changed
6. Trip Completed → tracking.trip.closed
7. Actual Costs → cost.actual
```

### Exception Handling
```
1. Issue Detected → tracking.exception.raised
2. Issue Resolved → tracking.exception.resolved
```

---

## Technology Stack

- **Language:** TypeScript/Node.js
- **Database:** PostgreSQL 15
- **Message Queue:** Kafka (Confluent)
- **Container:** Docker + Docker Compose
- **API:** Express.js REST APIs
- **ORM:** Raw SQL with pg (node-postgres)

---

## Environment Variables

Each service requires:
- `PORT` - Service port
- `DATABASE_URL` - PostgreSQL connection string
- `KAFKA_BROKER` - Kafka broker address

Master-Data Service:
- All above variables

Orders Service:
- All above variables
- `MASTER_DATA_URL` - URL to master-data service

Dispatch Service:
- All above variables

Tracking Service:
- `PORT` only (no database in current setup)

---

## Local Development

### Start All Services
```bash
docker-compose up -d
```

### Rebuild Services
```bash
docker-compose up -d --build
```

### View Logs
```bash
docker-compose logs -f [service-name]
# Example: docker-compose logs -f master-data
```

### Stop All Services
```bash
docker-compose down
```

### Access Database
```bash
docker exec -it fleet-app-beta-postgres-1 psql -U postgres -d fleet
```

### Service Health Checks
- Master-Data: http://localhost:4001/health
- Orders: http://localhost:4002
- Dispatch: http://localhost:4003
- Tracking: http://localhost:4004

---

## API Examples

### Calculate Trip Cost
```bash
POST http://localhost:4001/api/costing/calculate
Content-Type: application/json

{
  "order_id": "6daacabe-922b-45ba-af53-69de446b3f0a",
  "driver_id": "uuid-here",
  "miles": 550,
  "revenue": 1450,
  "order_type": "delivery",
  "origin": "Chicago, IL",
  "destination": "Toronto, ON"
}
```

### Create Order
```bash
POST http://localhost:4002/api/orders
Content-Type: application/json

{
  "customer_id": "cust-123",
  "order_type": "delivery",
  "pickup_location": "123 Main St",
  "dropoff_location": "456 Elm St",
  "pickup_time": "2025-11-10T08:00:00Z"
}
```

### Assign Driver
```bash
POST http://localhost:4003/api/dispatch/assign
Content-Type: application/json

{
  "order_id": "order-uuid",
  "driver_id": "driver-uuid"
}
```

### Get All Costing Rules (NEW)
```bash
GET http://localhost:4001/api/metadata/rules
```

### Get All Drivers (NEW)
```bash
GET http://localhost:4001/api/metadata/drivers
```

---

## Migration System

All services use a migration tracking system to prevent re-running migrations on restart.

- Migrations stored in: `services/[service]/src/db/migrations/`
- Tracking table: `schema_migrations`
- Format: Sequential numbered SQL files (001_name.sql, 002_name.sql)

When a service starts:
1. Creates `schema_migrations` table if not exists
2. Checks which migrations have been applied
3. Runs only new migrations
4. Records them in tracking table

---

## Future Enhancements

- [ ] Add authentication/authorization
- [ ] Implement rate limiting
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement caching layer (Redis)
- [ ] Add monitoring/observability (Prometheus/Grafana)
- [ ] Implement circuit breakers
- [ ] Add API versioning
- [ ] Implement WebSocket for real-time updates
- [ ] Add batch processing capabilities
- [ ] Implement data retention policies
