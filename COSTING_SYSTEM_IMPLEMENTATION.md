# Costing System Implementation

## Overview
Comprehensive costing system implemented across the fleet management application with accurate rates for different driver types, distance zones, and event-based costs.

## Core Components

### 1. Costing Utility (`lib/costing.ts`)
Central costing logic with:
- **Driver Types**: COM (Company), RNR (Rental), OO (Owner Operator)
- **Distance Zones**: 
  - Short Haul (<500 mi / Zone 1)
  - Long Haul (500-1500 mi / Zone 2)
  - Extended (1500+ mi / Zone 3)
- **Rate Tables**:
  - COM: $0.45/mi wage, 12% benefits, 22% rolling costs
  - RNR: $0.38/mi wage, 12% benefits, 22% rolling costs
  - OO: $0.72/mi (Z1), $0.68/mi (Z2), $0.65/mi (Z3) - no benefits/rolling

### 2. Functions
- `getCostingRates(driverType, distance)` - Returns applicable rates
- `calculateMileageCosts(driverType, distance, rates)` - Calculates wage, fuel, maintenance, benefits
- `calculateEventCosts(pickup, delivery)` - Calculates pickup ($30), delivery ($30), border ($15), drop/hook ($15)
- `calculateTripCost(driverType, distance, pickup, delivery)` - Master calculation returning full TripCost object
- `getAllCostingOptions(distance, pickup, delivery)` - Returns array of costs for all driver types (for comparison)
- `isCrossBorder(pickup, delivery)` - Detects USA/Canada crossings
- `getOOZone(distance)` - Maps distance to OO zone
- `getHaulType(distance)` - Returns "short" or "long"

### 3. UI Components

#### CostingCard (`components/costing/costing-card.tsx`)
- Used on booking page for driver type comparison
- Two-column layout: Fixed costs (events, fuel, trailer) | Variable costs (wage, truck maint, rolling)
- Highlights recommended option (lowest cost)
- Shows CPM rate prominently

#### CostingBreakdown (`components/costing/costing-breakdown.tsx`)
- Used on trip detail page for detailed cost analysis
- Expandable sections:
  - Mileage-based costs (wage, fuel, maintenance, benefits, rolling)
  - Event-based costs (pickup, delivery, border, drop/hook)
  - Weekly overhead allocation (optional)
  - Cost summary with direct cost, fully allocated cost, recommended revenue, actual margin

## Integration Points

### Booking Page (`app/book/page.tsx`)
- Shows driver type comparison cards after order selection
- Uses `getAllCostingOptions()` to generate comparison array
- Highlights lowest-cost option
- Calculates accurate costs based on route distance

### Trip Detail Page (`app/trips/[id]/page.tsx`)
- Middle column shows `CostingBreakdown` component
- Calculates `tripCost` using `calculateTripCost()`
- Maps driver type from trip data (COM/RNR/OO)
- Displays actual revenue vs. recommended revenue
- Shows margin percentage

### Trip API (`app/api/trips/route.ts`)
- POST endpoint passes costing data from booking page
- Fields: `miles`, `totalRevenue`, `totalCost`, `marginPct`
- Calculates margin percentage if not provided

### Tracking Service (`services/tracking/src/services/tripService.ts`)
- `CreateTripInput` interface includes costing fields
- Saves to database columns: `distance_miles`, `revenue`, `total_cost`, `margin_pct`
- Returns saved trip with costing data

## Rate Tables

### Company Driver (COM)
- Base wage: $0.45/mi
- Fuel: $0.45/mi
- Truck maintenance: $0.12/mi
- Trailer maintenance: $0.04/mi
- Benefits: 12% of wage
- Performance bonus: 5% of wage
- Safety incentive: 3% of wage
- Step increases: 2% of wage
- **Total Rolling**: 22% of wage

### Rental Driver (RNR)
- Base wage: $0.38/mi
- Fuel: $0.42/mi
- Truck maintenance: $0.12/mi
- Trailer maintenance: $0.04/mi
- Benefits: 12% of wage
- Performance bonus: 5% of wage
- Safety incentive: 3% of wage
- Step increases: 2% of wage
- **Total Rolling**: 22% of wage

### Owner Operator (OO)
- Zone 1 (<500 mi): $0.72/mi
- Zone 2 (500-1500 mi): $0.68/mi
- Zone 3 (1500+ mi): $0.65/mi
- Fuel: $0.50/mi
- No truck/trailer maintenance (owner responsibility)
- No benefits, rolling costs, or weekly overhead

### Event Costs (All Driver Types)
- Pickup: $30
- Delivery: $30
- Border crossing: $15
- Drop/hook: $15

### Weekly Overhead (COM/RNR Only)
- Total: $800/week
- Prorated across trips: Based on trip duration vs. weekly hours

## Margin Targets
- Target margin: 22% (gross)
- Net margin: ~18% (after indirect costs)
- Minimum margin: 5% (booking page default)

## Database Schema

### Trips Table
```sql
distance_miles DECIMAL(10,2)  -- Total distance in miles
revenue DECIMAL(10,2)         -- Total revenue for trip
total_cost DECIMAL(10,2)      -- Total cost calculated at booking
margin_pct DECIMAL(5,2)       -- Margin percentage ((revenue - cost) / revenue * 100)
```

## Data Flow

1. **Booking Page**:
   - User selects order (route distance calculated)
   - Driver type comparison cards display accurate costs for COM/RNR/OO
   - User selects driver and rate
   - Revenue calculated with 5% minimum margin
   - Form submits with `miles`, `totalRevenue`, `totalCost`

2. **API Layer**:
   - POST /api/trips receives costing data
   - Calculates `marginPct` if not provided
   - Passes to tracking service

3. **Tracking Service**:
   - Saves costing data to trips table
   - Columns: distance_miles, revenue, total_cost, margin_pct

4. **Trip Detail Page**:
   - Fetches trip data including costing fields
   - Calculates accurate costs using `calculateTripCost()`
   - Displays CostingBreakdown with detailed analysis
   - Shows actual revenue vs. recommended revenue
   - Displays margin percentage

## Testing

### Test Scenarios
1. **Short Haul Trip (<500 mi)**: COM driver should have lower wage rate, RNR slightly lower, OO highest rate
2. **Long Haul Trip (500-1500 mi)**: OO rate drops to Zone 2 ($0.68/mi)
3. **Extended Trip (1500+ mi)**: OO rate drops to Zone 3 ($0.65/mi)
4. **Cross-Border Trip**: Additional $15 border crossing fee applied
5. **COM/RNR vs. OO**: COM/RNR include benefits and rolling costs, OO does not

### Validation
- Booking page shows accurate cost comparisons
- Trip detail page displays detailed breakdown
- Database stores costing data correctly
- Margin calculations are accurate
- Recommended option highlights lowest cost

## Future Enhancements
- Dynamic fuel pricing (currently fixed)
- Seasonal rate adjustments
- Customer-specific pricing rules
- Historical cost analysis and optimization
- Integration with accounting system
- Cost variance tracking (estimated vs. actual)
