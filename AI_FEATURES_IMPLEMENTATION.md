# Fleet AI Features Implementation Summary

## Overview

This document summarizes the comprehensive AI integration implemented throughout the Fleet Management application using Claude API (`claude-sonnet-4-20250514`).

## Core Infrastructure

### AI Service (`lib/fleet-ai.ts`)
The central AI service providing ~900 lines of TypeScript functions:

| Function | Purpose |
|----------|---------|
| `getDispatchRecommendations()` | Score and recommend drivers for orders |
| `calculateProfitabilityScore()` | Instant margin analysis for lanes |
| `getCustomerRateSuggestion()` | Historical rate suggestions |
| `predictTripETA()` | ETA prediction with delay factors |
| `scanTripsForExceptions()` | Fleet-wide exception monitoring |
| `processNaturalLanguageSearch()` | NL query parsing |
| `executeNaturalLanguageCommand()` | Command execution |
| `analyzeFarmOutDecision()` | Farm-out vs fleet analysis |
| `getFleetHealthSummary()` | Fleet anomaly detection |
| `rankOrdersByPriority()` | Order urgency scoring |
| `generateCustomerNotification()` | Delay notification drafts |
| `chatWithFleetAI()` | General chat interface |
| `generateWeeklySummary()` | Weekly report generation |

### API Routes Created

| Route | Method | Description |
|-------|--------|-------------|
| `/api/ai/chat` | POST | FleetAI chat conversations |
| `/api/ai/search` | POST | NL search with database queries |
| `/api/ai/dispatch-recommendation` | POST | Driver recommendations |
| `/api/ai/profitability` | POST | Profitability calculation |
| `/api/ai/trip-eta` | GET/POST | Fleet scan / single trip ETA |
| `/api/ai/fleet-health` | GET | Fleet health summary |
| `/api/ai/farm-out-decision` | POST | Farm-out analysis |
| `/api/ai/customer-notification` | POST | Notification generation |

## Global Components

### 1. Fleet AI Panel (`components/fleet-ai-panel.tsx`)
- Floating chat assistant accessible from any page
- Context-aware conversation with fleet data
- Quick action buttons for common queries
- Expandable/collapsible UI

### 2. AI Command Bar (`components/ai-command-bar.tsx`)
- Triggered via **Cmd+K** (Mac) / **Ctrl+K** (Windows)
- Natural language search across orders, trips, drivers
- Quick actions for common operations
- Keyboard navigation support

## Page-Specific Components

### Orders Module

#### Profitability Scorer (`components/orders/profitability-scorer.tsx`)
**Location:** `/orders/new/enterprise`
- Real-time margin analysis
- Rate vs cost breakdown
- Confidence score display
- Suggestions for improvement
- Lane profitability tier indicator

### Dispatch Module

#### AI Recommendation (`components/dispatch/ai-recommendation.tsx`)
**Location:** `/dispatch`
- Driver scoring with AI analysis
- What-if scenario comparison
- Assignment conflict detection
- Driver utilization display
- One-click driver assignment

### Trips Module

#### Trip ETA Prediction (`components/trips/trip-eta-prediction.tsx`)
**Location:** `/trips`, `/trip/[id]`
- Predicted ETA with delay factors
- Traffic, weather, border crossing analysis
- Customer notification draft generation
- Progress visualization

#### Fleet Trip Monitor (`components/trips/trip-eta-prediction.tsx`)
**Location:** `/trips`
- Fleet-wide trip status dashboard
- At-risk trip highlighting
- Auto-refresh every 60 seconds
- Click-to-view trip details

### Dashboard Module

#### Fleet Health Dashboard (`components/dashboard/fleet-health.tsx`)
**Location:** `/dashboard`
- Overall fleet health score
- On-time/at-risk/delayed trip counts
- AI-detected anomalies
- Priority orders needing attention
- Recommendations for improvement

### Farm-Out Module

#### Farm-Out Decision (`components/farm-out/farm-out-decision.tsx`)
**Location:** `/farm-out`, order detail pages
- Fleet vs carrier comparison
- Carrier recommendations with ratings
- Key factors analysis
- Cost/profit margin comparison
- One-click farm-out to carrier

## Integration Points

### App Shell (`components/app-shell.tsx`)
```tsx
// Added:
import { FleetAIPanel } from "@/components/fleet-ai-panel"
import { AICommandBar, useCommandBar } from "@/components/ai-command-bar"

// In component:
<FleetAIPanel 
  currentPage={pathname}
  context={{ /* current page context */ }}
/>
<AICommandBar isOpen={isCommandBarOpen} onClose={() => setIsCommandBarOpen(false)} />
```

### Top Navigation (`components/top-nav.tsx`)
```tsx
// Added command bar trigger:
<Button onClick={openCommandBar}>
  <Sparkles className="h-4 w-4" />
  <span className="hidden md:inline">Ask AI</span>
  <kbd className="hidden md:inline-flex">⌘K</kbd>
</Button>
```

## Business Rules Encoded

The AI service uses these business rules for cost calculations:

| Driver Type | Per Mile | Fuel | Total |
|-------------|----------|------|-------|
| Company (COM) | $0.59 | $0.70 | $1.29/mi |
| Owner-Operator (OO) | $1.42-$1.60 | $0.22 | ~$1.64-$1.82/mi |
| Rental (RNR) | $1.54 | $0.22 | $1.76/mi |

**Additional Rules:**
- Border crossing: $15 per crossing
- Target margin: 18%+
- Premium customers prioritized

## Usage Examples

### Using the Command Bar
1. Press `Cmd+K` to open
2. Type natural language query: "show me delayed trips" or "find orders for Toronto"
3. Press Enter or select action

### Using the AI Chat Panel
1. Click the AI button in bottom-right corner
2. Ask questions like "What's the status of my fleet?" or "Which drivers are available tomorrow?"
3. Use quick actions for common queries

### Implementing Profitability Scorer in Order Form
```tsx
import { ProfitabilityScorer } from "@/components/orders/profitability-scorer"

<ProfitabilityScorer
  origin="Toronto, ON"
  destination="Chicago, IL"
  equipment="Dry Van"
  weight={35000}
  customerRate={2500}
  pickupDate="2025-06-15"
  onSuggestionAccept={(rate) => setFormData({ ...formData, rate })}
/>
```

### Adding Fleet Health to Dashboard
```tsx
import { FleetHealthDashboard } from "@/components/dashboard/fleet-health"

<FleetHealthDashboard
  onOrderClick={(id) => router.push(`/orders/${id}`)}
  onTripClick={(id) => router.push(`/trips/${id}`)}
/>
```

## Environment Variables

Ensure these are set:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

## Model Configuration

All AI requests use:
- **Model:** `claude-sonnet-4-20250514`
- **Max tokens:** Varies by endpoint (1024-4096)
- **Temperature:** 0.2 for consistency in recommendations

## Future Enhancements

### P1 Priority (Next Phase)
- [ ] Exception prediction with ML
- [ ] Post-trip analysis with learnings
- [ ] Customer sentiment tracking

### P2 Priority
- [ ] Weekly AI summary email
- [ ] Carrier relationship scoring
- [ ] Route optimization suggestions

## Testing

Test the AI features:

1. **Command Bar:** Press Cmd+K, type "show delayed trips"
2. **Chat Panel:** Ask "Which orders need attention?"
3. **Profitability:** Create new order, enter rate to see margin
4. **Dispatch:** Open dispatch, click "AI Recommend" on an order
5. **Trip ETA:** View trip detail, check AI prediction panel
6. **Fleet Health:** Navigate to dashboard, view health score

## Troubleshooting

### AI Features Not Loading
1. Check `ANTHROPIC_API_KEY` is set
2. Verify API routes are accessible (`/api/ai/*`)
3. Check browser console for errors

### Slow Responses
1. Claude API latency is typically 2-5 seconds
2. Consider caching frequent queries
3. Use streaming for chat responses (already implemented)

### Incorrect Recommendations
1. Verify business rules in `fleet-ai.ts`
2. Check data quality in database queries
3. Review prompt engineering in API routes
