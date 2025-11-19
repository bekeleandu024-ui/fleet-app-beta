# Fleet TMS Frontend Migration Plan

## Executive Summary
This plan adapts your existing PostgreSQL fleet management system to match the comprehensive Order→Trip→Event→Analytics flow while **preserving your SQL Server structure and Claude MCP access**.

---

## Phase 1: Schema Enhancements (Minimal Backend Changes)

### 1.1 Orders Table Extensions
```sql
-- Add to existing orders table
ALTER TABLE orders 
  ADD COLUMN customer_name VARCHAR(255),
  ADD COLUMN required_equipment VARCHAR(100),
  ADD COLUMN qualification_notes TEXT,
  ADD COLUMN quoted_rate NUMERIC(10,2),
  ADD COLUMN pu_window_start TIMESTAMP,
  ADD COLUMN pu_window_end TIMESTAMP,
  ADD COLUMN del_window_start TIMESTAMP,
  ADD COLUMN del_window_end TIMESTAMP,
  ADD COLUMN lane VARCHAR(100); -- "Toronto→Chicago"

-- Update status values to match flow
-- Current: Need to support "PendingInfo" → "Qualified" → (implicit "Booked")
-- Your existing status field should work as-is
```

### 1.2 Trips Table Extensions
```sql
-- Add to existing trips table
ALTER TABLE trips
  ADD COLUMN revenue NUMERIC(12,2),
  ADD COLUMN expected_revenue NUMERIC(12,2),
  ADD COLUMN margin_pct NUMERIC(5,2),
  ADD COLUMN final_margin_pct NUMERIC(5,2),
  ADD COLUMN eta_prediction TIMESTAMP WITH TIME ZONE,
  ADD COLUMN delay_risk_pct NUMERIC(5,2),
  ADD COLUMN driver_name VARCHAR(255), -- denormalized
  ADD COLUMN unit_number VARCHAR(50);  -- denormalized

-- Your existing trip_costs table already has margin_pct, so we can compute from there
-- Status flow: "Created" → "In Progress" → "Completed" → "Closed"
-- Update your status field to use these values
```

### 1.3 New Tables (Optional - for AI recommendations)
```sql
-- Rate Cards (for booking recommendations)
CREATE TABLE rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_type VARCHAR(50), -- "Linehaul", "Shuttle", "Dedicated"
  zone VARCHAR(50),      -- "Regional", "Interstate", "Cross-border"
  fixed_cpm NUMERIC(6,3),
  wage_cpm NUMERIC(6,3),
  fuel_cpm NUMERIC(6,3),
  truck_maint_cpm NUMERIC(6,3),
  trailer_maint_cpm NUMERIC(6,3),
  addons_cpm NUMERIC(6,3),
  rolling_cpm NUMERIC(6,3),
  total_cpm NUMERIC(6,3),
  is_active BOOLEAN DEFAULT true,
  effective_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Market Rate Intelligence
CREATE TABLE market_lanes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin VARCHAR(255),
  destination VARCHAR(255),
  lane VARCHAR(100), -- "Toronto→Chicago"
  rpm NUMERIC(6,2),  -- Revenue per mile
  source VARCHAR(100), -- "DAT", "Truckstop", "Manual"
  confidence VARCHAR(20), -- "High", "Medium", "Low"
  sample_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Business Rules (for guardrails)
CREATE TABLE business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key VARCHAR(100) UNIQUE,
  scope VARCHAR(50), -- "margin", "detention", "dwell"
  rule_value NUMERIC(10,2),
  unit VARCHAR(20), -- "%", "minutes", "$"
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 1.4 Migration Script Location
Create: `services/master-data/src/db/migrations/006_tms_flow_enhancements.sql`

---

## Phase 2: Page Structure & Routing

### 2.1 New Pages to Create

```
app/
├── orders/
│   ├── page.tsx                    ✅ EXISTS - enhance with filters
│   ├── new/page.tsx                ✅ EXISTS - enhance with OCR
│   └── [id]/
│       ├── page.tsx                🆕 CREATE - Order qualification view
│       └── qualify/page.tsx        🆕 CREATE - Qualification form
│
├── book/
│   └── page.tsx                    ✅ EXISTS - MAJOR REFACTOR
│                                   Transform to full booking console with:
│                                   - AI driver/unit/rate recommendations
│                                   - Stop management (add/remove/sequence)
│                                   - Real-time margin calculation
│                                   - Guardrail validation
│
├── trips/
│   ├── page.tsx                    ✅ EXISTS - enhance as trip board
│   └── [id]/
│       ├── page.tsx                ✅ EXISTS - full trip detail
│       ├── track/page.tsx          🆕 CREATE - Live tracking view
│       ├── events/page.tsx         🆕 CREATE - Event timeline
│       ├── recalc/page.tsx         🆕 CREATE - Cost recalculation
│       ├── edit/page.tsx           🆕 CREATE - Edit trip details
│       └── close/page.tsx          🆕 CREATE - Closeout workflow
│
├── trip-event/
│   ├── page.tsx                    🆕 CREATE - Event logging console
│   └── components/
│       ├── EventLogger.tsx         🆕 Quick action buttons
│       └── EventFeed.tsx           🆕 Real-time event list
│
├── analytics/
│   └── page.tsx                    ✅ EXISTS - enhance with charts
│
├── insights/
│   ├── margin/page.tsx             🆕 CREATE - Margin analysis
│   └── dwell/page.tsx              🆕 CREATE - Dwell time analysis
│
├── rates/
│   └── page.tsx                    🆕 CREATE - Rate card management
│
└── plan/
    └── page.tsx                    🆕 CREATE - Planning console
```

### 2.2 Pages to Deprecate/Merge
- `/dispatch` → functionality absorbed into `/book`
- Consider merging master-data pages into unified views

---

## Phase 3: Component Architecture

### 3.1 New Shared Components

```tsx
components/
├── booking/
│   ├── AIRecommendationPanel.tsx   // Driver/unit/rate suggestions
│   ├── StopManager.tsx              // Add/remove/sequence stops
│   ├── MarginCalculator.tsx         // Real-time margin display
│   └── GuardrailValidator.tsx       // Warning badges
│
├── trip-execution/
│   ├── TripStatusBadge.tsx          // Color-coded status
│   ├── ETADisplay.tsx               // Predicted vs actual
│   ├── DelayRiskIndicator.tsx       // Risk percentage
│   └── QuickActionButtons.tsx       // Status transitions
│
├── events/
│   ├── EventLogger.tsx              // GPS + quick actions
│   ├── EventFeed.tsx                // Real-time list
│   ├── EventTimeline.tsx            // Visual timeline
│   └── GPSCapture.tsx               // Geolocation hook
│
├── costing/
│   ├── CostBreakdownPanel.tsx       // CPM line items
│   ├── BeforeAfterComparison.tsx    // Recalc display
│   └── MarginGauge.tsx              // Visual margin indicator
│
├── analytics/
│   ├── RevenueChart.tsx             // Trend charts
│   ├── MarginChart.tsx
│   ├── UtilizationChart.tsx
│   └── KPICard.tsx                  // Dashboard metrics
│
└── shared/
    ├── LocationPicker.tsx           // Coordinates input
    ├── DateTimeRangePicker.tsx      // Window selection
    └── StatusStepper.tsx            // Workflow progress
```

### 3.2 Component Design System

**Color Coding (Existing Dark Theme):**
- Status badges: neutral (created), blue (in progress), amber (at risk), green (completed), gray (closed)
- Margin: green (≥15%), amber (8-15%), red (<8%)
- Priority: red (high), amber (medium), neutral (low)

**Typography:**
- Headers: text-white font-semibold
- Body: text-neutral-300
- Muted: text-neutral-500
- Metrics: text-2xl font-bold

**Spacing:**
- Dashboard grid: grid-cols-2 md:grid-cols-4 gap-4
- Forms: space-y-4
- Cards: p-4 md:p-6 rounded-xl border border-neutral-800

---

## Phase 4: API Routes & Server Actions

### 4.1 New API Endpoints

```typescript
app/api/
├── orders/
│   ├── [id]/qualify/route.ts       // POST - update to "Qualified"
│   └── ocr/route.ts                // POST - document parsing
│
├── trips/
│   ├── [id]/
│   │   ├── recalc/route.ts         // POST - trigger recalculation
│   │   ├── close/route.ts          // POST - closeout workflow
│   │   └── eta/route.ts            // GET - ETA prediction
│   └── ai-recommendations/route.ts // POST - booking suggestions
│
├── trip-events/
│   ├── route.ts                    // GET (with filters), POST
│   └── [id]/route.ts               // PATCH, DELETE
│
├── rates/
│   ├── route.ts                    // GET, POST rate cards
│   ├── lookup/route.ts             // POST - find rate by type/zone
│   └── snapshot/route.ts           // GET - historical rates
│
├── market-rates/
│   └── lookup/route.ts             // GET - market RPM for lane
│
└── analytics/
    ├── margin/route.ts             // GET - margin analysis
    ├── dwell/route.ts              // GET - dwell time stats
    └── utilization/route.ts        // GET - driver/unit metrics
```

### 4.2 Server Actions (for mutations)

```typescript
lib/actions/
├── orderActions.ts
│   └── qualifyOrder(orderId, notes)
│
├── tripActions.ts
│   ├── createTripFromOrder(orderId, bookingData)
│   ├── updateTripStatus(tripId, status)
│   ├── recalculateTripCost(tripId)
│   └── closeTrip(tripId, closeoutData)
│
├── eventActions.ts
│   ├── logTripEvent(tripId, eventType, data)
│   └── updateTripFromEvent(eventId) // status transitions
│
└── costingActions.ts
    ├── calculateTripCost(tripData)
    └── applyEventCosting(tripId, eventType)
```

---

## Phase 5: User Flow Implementation

### 5.1 Order Intake → Qualification

**Current State:** You have `/orders` and `/orders/new`

**Enhancement:**
1. `/orders/new` - Add OCR upload capability
2. `/orders/[id]` - Create qualification view with:
   - Review parsed order details
   - Add missing windows (pickup/delivery)
   - Set equipment requirements
   - Add qualification notes
   - Button: "Mark as Qualified" → updates status

### 5.2 Trip Booking Console (`/book` - MAJOR REFACTOR)

**Transform existing `/book/page.tsx` into:**

```tsx
// /book/page.tsx structure
'use client';

export default function BookingConsole() {
  const [selectedOrderId, setSelectedOrderId] = useState<string>();
  const [bookingForm, setBookingForm] = useState({
    driver: null,
    unit: null,
    rate: null,
    stops: [],
    miles: 0,
    revenue: 0,
    quotedRPM: 0
  });

  // Fetch AI recommendations when order selected
  const { data: recommendations } = useQuery({
    queryKey: ['recommendations', selectedOrderId],
    queryFn: () => fetch(`/api/trips/ai-recommendations`, {
      method: 'POST',
      body: JSON.stringify({ orderId: selectedOrderId })
    }).then(r => r.json()),
    enabled: !!selectedOrderId
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Booking Form */}
      <div className="lg:col-span-2 space-y-6">
        <OrderSelector 
          value={selectedOrderId} 
          onChange={setSelectedOrderId} 
        />
        
        {selectedOrderId && (
          <>
            <DriverUnitSelector
              recommendations={recommendations}
              value={{ driver: bookingForm.driver, unit: bookingForm.unit }}
              onChange={(driver, unit) => setBookingForm(prev => ({ ...prev, driver, unit }))}
            />
            
            <RateSelector
              recommendations={recommendations}
              value={bookingForm.rate}
              onChange={(rate) => setBookingForm(prev => ({ ...prev, rate }))}
            />
            
            <StopManager
              stops={bookingForm.stops}
              onChange={(stops) => setBookingForm(prev => ({ ...prev, stops }))}
            />
            
            <RevenueInputs
              miles={bookingForm.miles}
              revenue={bookingForm.revenue}
              quotedRPM={bookingForm.quotedRPM}
              onChange={(data) => setBookingForm(prev => ({ ...prev, ...data }))}
            />
          </>
        )}
      </div>

      {/* Right: AI Recommendations & Margin Calculator */}
      <div className="space-y-6">
        <AIRecommendationPanel recommendations={recommendations} />
        <MarginCalculator bookingData={bookingForm} />
        <GuardrailValidator bookingData={bookingForm} />
        
        <Button 
          size="lg" 
          variant="primary" 
          onClick={handleCreateTrip}
          disabled={!isValid}
        >
          Create Trip
        </Button>
      </div>
    </div>
  );
}
```

### 5.3 Trip Execution & Event Logging

**Create `/trip-event/page.tsx`:**

```tsx
'use client';

export default function TripEventConsole() {
  const [selectedTripId, setSelectedTripId] = useState<string>();
  const [location, setLocation] = useState<{lat: number, lon: number}>();
  const { data: events, refetch } = useQuery({
    queryKey: ['trip-events'],
    queryFn: () => fetch('/api/trip-events').then(r => r.json()),
    refetchInterval: 15000 // auto-refresh every 15s
  });

  const logEvent = async (eventType: string) => {
    await fetch('/api/trip-events', {
      method: 'POST',
      body: JSON.stringify({
        tripId: selectedTripId,
        eventType,
        lat: location?.lat,
        lon: location?.lon,
        occurredAt: new Date()
      })
    });
    refetch();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Event Logger */}
      <div className="lg:col-span-1 space-y-4">
        <TripSelector value={selectedTripId} onChange={setSelectedTripId} />
        <GPSCapture onLocationChange={setLocation} />
        
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => logEvent('TRIP_START')}>Start Trip</Button>
          <Button onClick={() => logEvent('ARRIVED_PICKUP')}>Arrived PU</Button>
          <Button onClick={() => logEvent('LEFT_PICKUP')}>Left PU</Button>
          <Button onClick={() => logEvent('ARRIVED_DELIVERY')}>Arrived DEL</Button>
          <Button onClick={() => logEvent('LEFT_DELIVERY')}>Left DEL</Button>
          <Button onClick={() => logEvent('CROSSED_BORDER')}>Border</Button>
          <Button onClick={() => logEvent('DROP_HOOK')}>Drop Hook</Button>
          <Button onClick={() => logEvent('TRIP_FINISHED')}>Finish</Button>
        </div>
      </div>

      {/* Right: Event Feed */}
      <div className="lg:col-span-2">
        <EventFeed events={events} />
      </div>
    </div>
  );
}
```

### 5.4 Cost Recalculation

**Create `/trips/[id]/recalc/page.tsx`:**

```tsx
export default async function TripRecalcPage({ params }: { params: { id: string } }) {
  const trip = await fetchTrip(params.id);
  const events = await fetchTripEvents(params.id);
  
  // Server-side calculation preview
  const recalcPreview = calculateRecalculation(trip, events);

  return (
    <div className="space-y-6">
      <h1>Cost Recalculation - Trip {params.id}</h1>
      
      <BeforeAfterComparison
        before={{
          miles: trip.planned_miles,
          cost: trip.planned_cost,
          margin: trip.margin_pct
        }}
        after={{
          miles: recalcPreview.actualMiles,
          cost: recalcPreview.actualCost,
          margin: recalcPreview.newMargin
        }}
      />
      
      <CostBreakdownPanel
        items={[
          { label: 'Border Crossings', value: recalcPreview.borderCrossingFees },
          { label: 'Detention', value: recalcPreview.detentionCharges },
          { label: 'Additional Miles', value: recalcPreview.additionalMilesCost }
        ]}
      />
      
      <form action={applyRecalculation}>
        <input type="hidden" name="tripId" value={params.id} />
        <input type="hidden" name="newCost" value={recalcPreview.actualCost} />
        <Button type="submit">Apply Recalculation</Button>
      </form>
    </div>
  );
}
```

### 5.5 Trip Closeout

**Create `/trips/[id]/close/page.tsx`:**

```tsx
export default function TripCloseoutPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1>Close Trip {params.id}</h1>
      
      <CloseoutForm tripId={params.id}>
        <div className="space-y-4">
          <label>
            Actual Revenue Received:
            <Input type="number" name="actualRevenue" step="0.01" required />
          </label>
          
          <label>
            Final Notes:
            <textarea name="notes" rows={4} />
          </label>
          
          <label>
            <input type="checkbox" name="confirmReconciliation" required />
            I confirm all costs and revenue are reconciled
          </label>
          
          <Button type="submit" variant="primary">
            Close Trip
          </Button>
        </div>
      </CloseoutForm>
    </div>
  );
}
```

---

## Phase 6: Analytics & Insights

### 6.1 Enhanced Dashboard (`/`)

```tsx
export default async function Dashboard() {
  const kpis = await fetchDashboardKPIs();
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Orders Waiting" value={kpis.ordersWaiting} />
        <KPICard label="At-Risk Trips" value={kpis.atRiskTrips} trend="danger" />
        <KPICard label="Avg Margin" value={`${kpis.avgMargin}%`} trend="success" />
        <KPICard label="On-Time %" value={`${kpis.onTimePercent}%`} />
      </div>
      
      {/* Market Signals */}
      <MarketSignalsPanel signals={kpis.marketSignals} />
      
      {/* Active Trips Map */}
      <FleetMap trips={kpis.activeTrips} />
    </div>
  );
}
```

### 6.2 Analytics Page

**Enhance `/analytics/page.tsx`:**

```tsx
export default async function AnalyticsPage() {
  const analytics = await fetchAnalytics();
  
  return (
    <div className="space-y-8">
      <h1>Analytics Dashboard</h1>
      
      {/* Revenue & Margin */}
      <section>
        <h2>Revenue & Margin Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={analytics.revenueByWeek} />
          <MarginChart data={analytics.marginByWeek} />
        </div>
      </section>
      
      {/* Performance */}
      <section>
        <h2>Trip Performance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatCard label="Completed Trips" value={analytics.completedTrips} />
          <StatCard label="Avg Margin by Lane" value={`${analytics.avgMarginByLane}%`} />
          <StatCard label="Best Performing Route" value={analytics.bestRoute} />
        </div>
      </section>
      
      {/* Utilization */}
      <section>
        <h2>Resource Utilization</h2>
        <UtilizationChart 
          drivers={analytics.driverUtilization} 
          units={analytics.unitUtilization} 
        />
      </section>
    </div>
  );
}
```

---

## Phase 7: AI Recommendation Engine

### 7.1 Booking Recommendation Logic

```typescript
// lib/ai-booking.ts

export async function generateBookingRecommendations(orderId: string) {
  const order = await db.orders.findUnique({ where: { id: orderId } });
  
  // Driver recommendation
  const suggestedDriver = await db.driver_profiles.findFirst({
    where: {
      is_active: true,
      // Prefer drivers near pickup
      // Check hours available
      // Check customer preferences
      // Check on-time score
    },
    orderBy: [
      { /* scoring logic */ }
    ]
  });
  
  // Unit recommendation
  const suggestedUnit = await db.unit_profiles.findFirst({
    where: {
      is_active: true,
      // Check availability
      // Check home base proximity
      // Check recent performance
    }
  });
  
  // Rate recommendation
  const suggestedRate = await db.rate_cards.findFirst({
    where: {
      is_active: true,
      // Match order type/zone
    }
  });
  
  // Market rate lookup
  const marketRate = await db.market_lanes.findFirst({
    where: {
      lane: `${order.pickup_location}→${order.dropoff_location}`
    },
    orderBy: { sample_date: 'desc' }
  });
  
  // Calculate target revenue (e.g., 15% margin)
  const estimatedMiles = calculateDistance(order.pickup_location, order.dropoff_location);
  const estimatedCost = estimatedMiles * suggestedRate.total_cpm;
  const targetRevenue = estimatedCost * 1.15; // 15% margin target
  
  return {
    driver: suggestedDriver,
    unit: suggestedUnit,
    rate: suggestedRate,
    marketRate,
    estimatedMiles,
    targetRevenue,
    suggestedRPM: targetRevenue / estimatedMiles
  };
}
```

---

## Phase 8: Migration Execution Timeline

### Week 1: Foundation
- ✅ Run schema migration (006_tms_flow_enhancements.sql)
- ✅ Create new API route structure
- ✅ Build shared components (badges, cards, buttons)

### Week 2: Order Flow
- ✅ Enhance `/orders/new` with OCR
- ✅ Create `/orders/[id]` qualification view
- ✅ Implement order qualification API

### Week 3: Booking Console
- ✅ Refactor `/book` page with AI recommendations
- ✅ Build StopManager component
- ✅ Implement MarginCalculator component
- ✅ Create booking API with recommendations

### Week 4: Trip Execution
- ✅ Create `/trip-event` console
- ✅ Build EventLogger and EventFeed components
- ✅ Implement GPS capture
- ✅ Create event logging API with status transitions

### Week 5: Trip Detail Views
- ✅ Create `/trips/[id]/track` page
- ✅ Create `/trips/[id]/recalc` page
- ✅ Create `/trips/[id]/close` page
- ✅ Implement recalculation and closeout APIs

### Week 6: Analytics
- ✅ Enhance dashboard with KPIs
- ✅ Build analytics charts
- ✅ Create margin/dwell insights pages
- ✅ Implement analytics APIs

### Week 7: Polish & Testing
- ✅ Mobile responsiveness
- ✅ Loading states and error handling
- ✅ End-to-end user flow testing
- ✅ Performance optimization

---

## Phase 9: MCP Server Preservation

### 9.1 Existing MCP Access

Your **services/mcp-fleet-connector** provides Claude with:
- Direct PostgreSQL queries
- Real-time data access
- Schema awareness

### 9.2 Enhancements for New Flow

Update MCP server to expose new tools:

```typescript
// services/mcp-fleet-connector/src/index.ts

server.tool(
  "qualify_order",
  "Mark an order as qualified and add notes",
  { orderId: z.string(), notes: z.string() }
);

server.tool(
  "get_booking_recommendations",
  "Get AI recommendations for trip booking",
  { orderId: z.string() }
);

server.tool(
  "log_trip_event",
  "Log a trip event with GPS coordinates",
  { tripId: z.string(), eventType: z.string(), lat: z.number(), lon: z.number() }
);

server.tool(
  "recalculate_trip_cost",
  "Recalculate trip cost based on actual events",
  { tripId: z.string() }
);

server.tool(
  "close_trip",
  "Close a trip and finalize reconciliation",
  { tripId: z.string(), actualRevenue: z.number(), notes: z.string() }
);
```

### 9.3 Claude Desktop Setup

Update **CLAUDE_DESKTOP_SETUP.md** with new tool capabilities.

---

## Summary

This migration plan:

✅ **Preserves** your PostgreSQL schema (minimal additions only)  
✅ **Maintains** Claude MCP server access (enhances with new tools)  
✅ **Adopts** the comprehensive Order→Trip→Event→Analytics flow  
✅ **Implements** dark command-center UI design  
✅ **Provides** phase-by-phase implementation timeline  
✅ **Ensures** backend logic remains intact  

**Next Steps:**
1. Review this plan and confirm alignment with your vision
2. Run Phase 1 schema migration
3. Begin Week 1 foundation work (components + API structure)
4. Implement flows week-by-week following the timeline

Questions or adjustments needed? Let me know and we'll refine before starting implementation!
