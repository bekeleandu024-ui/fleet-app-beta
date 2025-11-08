# Fleet Management Costing Engine

## Overview

The costing engine is a comprehensive, production-grade system for calculating trip costs, tracking margins, and providing pricing recommendations. It integrates seamlessly with the orders and dispatch services to provide real-time cost analysis.

## Architecture

```
Orders Service ──► Master-Data Service (Costing Engine) ──► Kafka Events
                        │
                        ├─ Driver Profiles
                        ├─ Unit Profiles  
                        ├─ Costing Rules
                        └─ Trip Costs
```

## Key Features

### 1. Comprehensive Cost Components

The engine calculates four major cost categories:

#### Fixed/Weekly Costs
- Truck lease/payment
- Trailer lease
- Insurance
- Isaac ELD
- PrePass
- SG&A allocation
- Dispatch/ops allocation
- Miscellaneous expenses

**Calculation**: Weekly costs are allocated across all miles for that unit in the week, providing accurate per-mile costs.

#### Wage CPM (Cost Per Mile)
- Base wage rate (varies by driver type: COM, RNR, OO with zones)
- Benefits percentage (12%)
- Performance bonus (5%)
- Safety bonus (3%)
- Step progression (2%)

**Formula**: `Effective Wage CPM = Base CPM × (1 + Benefits% + Performance% + Safety% + Step%)`

#### Rolling CPM
- Fuel cost per mile (varies by driver type)
- Truck repair & maintenance
- Trailer repair & maintenance

#### Accessorials (Event-Based)
- Border crossings: $150 each
- Drop/hook: $50 each
- Pickup stops: $35 each
- Delivery stops: $35 each

### 2. Driver Type Support

#### Company Drivers (COM)
- Base wage: $0.45/mile
- Full benefits and bonuses
- Company pays fuel, maintenance, insurance

#### Rental Drivers (RNR)
- Base wage: $0.38/mile
- Reduced fuel costs
- Lower insurance burden

#### Owner Operators (OO)
- Zone-based rates:
  - **Zone 1**: $0.72/mile (premium lanes)
  - **Zone 2**: $0.68/mile (standard lanes)
  - **Zone 3**: $0.65/mile (economy lanes)
- Minimal fixed costs (insurance, dispatch allocation only)
- Higher fuel costs (owner responsibility)

### 3. Auto-Event Detection

The rule engine automatically detects and adds events based on:

**Border Crossings**
- Detects USA ↔ Canada trips
- Automatically adds $150 border crossing cost

**Pickups/Deliveries**
- Based on order_type field
- Adds appropriate stop costs

**Future Enhancements**
- Geographic detection (coordinates)
- Customer-specific rules
- Equipment-based events

### 4. Margin Analysis

When revenue is provided, the engine calculates:

- **Revenue Per Mile (RPM)**: Total revenue / miles
- **Profit Per Mile (PPM)**: RPM - Total CPM
- **Profit**: Total revenue - total cost
- **Margin %**: Profit / Revenue
- **Profitability Flag**: Boolean indicator
- **Break-even RPM**: Minimum rate to cover costs

### 5. Pricing Suggestions

Based on cost calculations:

- **Minimum RPM**: Break-even rate (= Total CPM)
- **Target RPM**: 15% margin rate (Total CPM × 1.15)
- **Recommended Price**: Target RPM × miles

### 6. Audit Trail

Every cost calculation stores:
- Complete formula breakdown
- All input values
- Rate sources
- Timestamp and user
- Auto-detected events with reasons

### 7. Actual Cost Tracking

After trip completion:
- Update with actual miles driven
- Update with actual costs incurred
- Calculate variance (planned vs actual)
- Calculate variance percentage
- Publish `cost.actual` event to Kafka

## API Endpoints

### Calculate Cost
```
POST /api/costing/calculate
```

**Request**:
```json
{
  "order_id": "uuid",
  "driver_id": "uuid",
  "unit_number": "UNIT-101",
  "miles": 450,
  "direction": "OUTBOUND",
  "is_round_trip": false,
  "origin": "New York, NY",
  "destination": "Toronto, ON",
  "order_type": "delivery",
  "border_crossings": 1,
  "drop_hooks": 0,
  "pickups": 1,
  "deliveries": 1,
  "revenue": 1200.00
}
```

**Response**:
```json
{
  "cost_id": "uuid",
  "order_id": "uuid",
  "total_cost": 756.25,
  "total_cpm": 1.6805,
  "breakdown": {
    "fixed_weekly": {
      "total_weekly_cost": 1985.00,
      "weekly_miles": 2150,
      "fixed_cpm": 0.9233,
      "components": {
        "truck_weekly": 850.00,
        "trailer_weekly": 250.00,
        "insurance_weekly": 450.00,
        "isaac_weekly": 35.00,
        "prepass_weekly": 25.00,
        "sga_weekly": 180.00,
        "dtops_weekly": 120.00,
        "misc_weekly": 75.00
      }
    },
    "wage": {
      "base_cpm": 0.4500,
      "benefits_pct": 0.1200,
      "performance_pct": 0.0500,
      "safety_pct": 0.0300,
      "step_pct": 0.0200,
      "effective_wage_cpm": 0.5400
    },
    "rolling": {
      "fuel_cpm": 0.4500,
      "truck_maintenance_cpm": 0.1200,
      "trailer_maintenance_cpm": 0.0400,
      "total_rolling_cpm": 0.6100
    },
    "accessorials": {
      "border_crossing_count": 1,
      "border_crossing_cost": 150.00,
      "drop_hook_count": 0,
      "drop_hook_cost": 0,
      "pickup_count": 1,
      "pickup_cost": 35.00,
      "delivery_count": 1,
      "delivery_cost": 35.00,
      "total_accessorial_cost": 220.00,
      "accessorial_cpm": 0.4889
    }
  },
  "margin_analysis": {
    "revenue": 1200.00,
    "rpm": 2.6667,
    "ppm": 0.9862,
    "profit": 443.75,
    "margin_pct": 0.3698,
    "is_profitable": true,
    "break_even_rpm": 1.6805
  },
  "pricing_suggestions": {
    "minimum_rpm": 1.6805,
    "target_rpm": 1.9326,
    "recommended_price": 869.67
  },
  "auto_detected_events": [
    {
      "event_code": "BC",
      "event_name": "Border Crossing",
      "quantity": 1,
      "cost_per_event": 150.00,
      "total_cost": 150.00,
      "detection_reason": "Auto-detected based on origin/destination"
    },
    {
      "event_code": "PICKUP",
      "event_name": "Pickup Stop",
      "quantity": 1,
      "cost_per_event": 35.00,
      "total_cost": 35.00,
      "detection_reason": "Auto-detected for order type: delivery"
    },
    {
      "event_code": "DELIVERY",
      "event_name": "Delivery Stop",
      "quantity": 1,
      "cost_per_event": 35.00,
      "total_cost": 35.00,
      "detection_reason": "Auto-detected for order type: delivery"
    }
  ],
  "calculation_formula": { /* Full audit trail */ },
  "calculated_at": "2025-11-08T12:34:56.789Z"
}
```

### Get Cost Breakdown
```
GET /api/costing/breakdown/:orderId
```

Returns the stored cost calculation for an order.

### Update Actual Costs
```
PATCH /api/costing/actual/:orderId
```

**Request**:
```json
{
  "actual_miles": 465,
  "actual_cost": 780.50
}
```

Updates actual costs and calculates variance.

## Integration with Orders Service

### Calculate Cost for Order
```
POST /api/orders/:id/calculate-cost
```

**Request**:
```json
{
  "driver_id": "uuid",
  "unit_number": "UNIT-101",
  "miles": 450,
  "direction": "OUTBOUND",
  "is_round_trip": false,
  "border_crossings": 1,
  "revenue": 1200.00
}
```

Automatically pulls order details (pickup, dropoff, type) and calls costing engine.

### Get Cost Breakdown for Order
```
GET /api/orders/:id/cost-breakdown
```

Returns cost breakdown for an order.

## Kafka Events

### cost.calculated
Published when cost is calculated:
```json
{
  "cost_id": "uuid",
  "order_id": "uuid",
  "total_cost": 756.25,
  "total_cpm": 1.6805,
  "calculated_at": "2025-11-08T12:34:56.789Z"
}
```

### cost.actual
Published when actual costs are recorded:
```json
{
  "cost_id": "uuid",
  "order_id": "uuid",
  "actual_miles": 465,
  "actual_cost": 780.50,
  "variance": 24.25,
  "variance_pct": 0.0321,
  "updated_at": "2025-11-08T18:45:00.000Z"
}
```

## Database Schema

### driver_profiles
Stores driver information and wage calculations.

### unit_profiles
Stores unit (truck) information and weekly costs.

### costing_rules
Central repository for all rates and formulas.

### event_types
Defines accessorial events and their costs.

### event_rules
Auto-detection rules for events.

### trip_costs
Stores calculated costs with full breakdown.

### week_miles_summary
Tracks weekly miles for fixed cost allocation.

## Usage Examples

### Example 1: Company Driver, Short Haul
```bash
curl -X POST http://localhost:4001/api/costing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "order-123",
    "driver_id": "driver-john-smith",
    "miles": 250,
    "origin": "Chicago, IL",
    "destination": "Indianapolis, IN",
    "order_type": "delivery",
    "revenue": 650
  }'
```

### Example 2: Owner Operator, Cross-Border
```bash
curl -X POST http://localhost:4001/api/costing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "order-456",
    "unit_number": "UNIT-301",
    "miles": 850,
    "origin": "Detroit, MI",
    "destination": "Toronto, ON",
    "order_type": "round_trip",
    "is_round_trip": true,
    "revenue": 2400
  }'
```

### Example 3: Calculate Cost via Orders API
```bash
curl -X POST http://localhost:4002/api/orders/order-789/calculate-cost \
  -H "Content-Type: application/json" \
  -d '{
    "driver_id": "driver-jane-doe",
    "miles": 550,
    "direction": "OUTBOUND",
    "revenue": 1450
  }'
```

## Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `KAFKA_BROKER`: Kafka broker address
- `PORT`: Service port (default: 4001)

### Rate Updates

To update costing rates:

1. Update `costing_rules` table directly
2. Set `effective_date` for historical tracking
3. Rates are cached per calculation for consistency

## Future Enhancements

### AI Integration Hooks
- **Smart Routing**: Cost comparison for multiple routes
- **Predictive Margin Analysis**: ML-based profit predictions
- **Automated Pricing**: Dynamic pricing based on market conditions
- **Cost Anomaly Detection**: Flag unusual cost patterns

### Advanced Features
- Multi-leg trip costing
- Equipment-specific costs
- Customer-specific pricing rules
- Fuel price integration
- HOS impact on costs
- Seasonal rate adjustments

## Testing

Run the complete costing flow:

```bash
# Start services
docker compose up --build master-data orders

# Create order
curl -X POST http://localhost:4002/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust-123",
    "order_type": "delivery",
    "pickup_location": "New York, NY",
    "dropoff_location": "Toronto, ON"
  }'

# Calculate cost (use order ID from above)
curl -X POST http://localhost:4002/api/orders/<ORDER_ID>/calculate-cost \
  -H "Content-Type: application/json" \
  -d '{
    "driver_id": "<DRIVER_ID>",
    "miles": 450,
    "revenue": 1200
  }'

# Get cost breakdown
curl http://localhost:4002/api/orders/<ORDER_ID>/cost-breakdown
```

## Troubleshooting

### Cost calculation fails
- Check driver/unit exists in database
- Verify costing_rules are seeded
- Ensure master-data service is running

### Events not auto-detected
- Check event_rules table
- Verify origin/destination format
- Review detection logic in costingService.ts

### Margin analysis missing
- Ensure revenue is provided in request
- Check revenue > 0

## Support

For issues or questions about the costing engine, contact the development team.
