# Analytics with AI Insights - Setup Guide

## Overview
Enhanced the `/analytics` page with comprehensive AI-powered insights using Claude API. The page now displays real-time data from microservices with intelligent analysis, anomaly detection, predictions, and strategic recommendations.

## What Was Built

### 1. AI Insights API (`/api/analytics/ai-insights`)
**Location:** `app/api/analytics/ai-insights/route.ts`

**Features:**
- Uses Claude 3.5 Sonnet to analyze fleet analytics data
- Generates comprehensive insights including:
  - Executive summary with health score and risk level
  - Trend analysis (revenue, margin, predictions)
  - Anomaly detection with severity levels
  - Category, driver, and lane insights
  - Predictive forecasts with confidence levels
  - Strategic recommendations prioritized by impact
- Fallback insights when Claude API is unavailable
- Automatic error handling with graceful degradation

**How it works:**
1. Receives analytics data as POST request
2. Builds structured prompt with financial metrics, trends, performance data
3. Calls Claude API to generate JSON insights
4. Returns comprehensive analysis with actionable recommendations

### 2. Enhanced Analytics Data Aggregation (`/api/analytics`)
**Location:** `app/api/analytics/route.ts`

**Features:**
- Fetches real data from microservices in parallel:
  - Orders Service (port 4002)
  - Tracking Service (port 4004)
  - Master Data Service (port 4001)
- Aggregates analytics from last 30 days:
  - Revenue, cost, margin calculations
  - Weekly trend analysis
  - Category margins by customer
  - Driver performance rankings
  - Lane profitability analysis
  - Margin distribution bands
  - Auto-generated alerts
- Falls back to mock data when services unavailable
- Error resilience with try-catch and service health checks

**Calculations:**
- **Summary Metrics:** Total revenue, cost, miles, margin %, RPM, CPM
- **Trip Classification:** Profitable (≥15% margin) vs At-Risk (<15% margin)
- **Weekly Trends:** 4-week revenue, cost, margin, miles breakdown
- **Driver Rankings:** Top 5 by margin percentage
- **Lane Rankings:** Top 4 by revenue volume
- **Margin Bands:** Loss, 0-5%, 5-10%, 10-15%, 15%+

### 3. Enhanced Analytics Page (`/analytics`)
**Location:** `app/analytics/page.tsx`

**New Features:**
- **AI Insights Section** (full-width):
  - Executive summary with health score (0-100)
  - Risk level indicator (low/medium/high)
  - Trend analysis cards (revenue, margin, predictions)
  - Performance metrics (efficiency, profitability)
  - Top recommendation spotlight

- **Anomaly Detection Panel:**
  - AI-detected issues with severity levels
  - Business impact explanations
  - Specific recommendations for each anomaly

- **Predictions Panel:**
  - Forecasts for revenue, margin, cost, trips
  - Confidence levels (high/medium/low)
  - Reasoning for each prediction

- **Strategic Recommendations:**
  - Prioritized action items (high/medium/low)
  - Expected business impact
  - Implementation timeframe
  - Actionable steps ranked by urgency

- **Detailed Insights Grid:**
  - Category Analysis (strongest, weakest, opportunity)
  - Driver Insights (top performers, improvement areas, retention)
  - Lane Insights (optimize, expand, review)

**User Experience:**
- Auto-refresh every 60 seconds for analytics data
- AI insights generated automatically on page load
- Manual refresh button for AI insights
- Loading states with skeleton screens
- Error handling with fallback content
- Responsive grid layouts
- Dark theme with gradient accents

## Setup Instructions

### 1. Environment Variables
Add to your `.env.local` file:

```bash
# Claude API Key (required for AI insights)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Microservice URLs (optional, defaults to localhost)
ORDERS_SERVICE_URL=http://localhost:4002
TRACKING_SERVICE_URL=http://localhost:4004
MASTER_DATA_SERVICE_URL=http://localhost:4001
```

### 2. Install Dependencies
If not already installed:

```bash
npm install @anthropic-ai/sdk
```

### 3. Start Microservices
Ensure your microservices are running:

```bash
# In separate terminals or using docker-compose
cd services/orders && npm run dev        # Port 4002
cd services/tracking && npm run dev      # Port 4004
cd services/master-data && npm run dev   # Port 4001
```

### 4. Test the Analytics Page
Navigate to `http://localhost:3000/analytics`

**Expected Behavior:**
- Page loads with existing analytics charts
- AI Insights section appears at top after 1-2 seconds
- Executive summary displays with health score
- Anomalies, predictions, and recommendations populate
- If Claude API key is missing, fallback insights appear
- If microservices are down, mock data is used

## API Endpoints

### POST /api/analytics/ai-insights
**Request Body:**
```json
{
  "summary": { "totalRevenue": 1280000, "marginPercent": 21.5, ... },
  "revenueTrend": [...],
  "marginByCategory": [...],
  "driverPerformance": [...],
  "lanePerformance": [...],
  "marginDistribution": [...],
  "alerts": [...]
}
```

**Response:**
```json
{
  "insights": {
    "executiveSummary": "Fleet operating at 21.5% margin...",
    "trendAnalysis": { "revenue": "...", "margin": "...", "prediction": "..." },
    "anomalyDetection": [...],
    "predictions": [...],
    "strategicRecommendations": [...],
    "keyMetrics": { "healthScore": 82, "riskLevel": "low", ... }
  },
  "generatedAt": "2025-01-09T12:00:00.000Z"
}
```

### GET /api/analytics
**Response:**
```json
{
  "summary": { "periodLabel": "Last 30 days", "totalRevenue": 1280000, ... },
  "revenueTrend": [...],
  "marginByCategory": [...],
  "driverPerformance": [...],
  "lanePerformance": [...],
  "marginDistribution": [...],
  "alerts": [...],
  "updatedAt": "2025-01-09T12:00:00.000Z"
}
```

## How AI Insights Work

### Claude Prompt Structure
The AI prompt includes:
1. **Period Context:** "Last 30 days"
2. **Financial Performance:** Revenue, cost, margin, RPM, CPM, miles
3. **Trip Metrics:** Profitable vs at-risk trips, risk ratio
4. **Revenue Trend:** 4-week breakdown with growth calculation
5. **Margin by Category:** Top performing customer segments
6. **Driver Performance:** Best vs worst with spread analysis
7. **Lane Performance:** Best vs worst lane comparisons
8. **Margin Distribution:** Trip count by margin band
9. **Existing Alerts:** Current system-generated alerts

### AI Response Structure
Claude returns structured JSON with:
- **Executive Summary:** 2-3 sentence overview
- **Trend Analysis:** Revenue, margin, and prediction insights
- **Anomaly Detection:** Issues with severity, impact, recommendations
- **Category/Driver/Lane Insights:** Specific observations and actions
- **Predictions:** Forecasts with confidence and reasoning
- **Strategic Recommendations:** Prioritized actions with impact and timeframe
- **Key Metrics:** Health score, risk level, efficiency, profitability

### Fallback Logic
When Claude API fails or is unavailable:
1. Uses mathematical calculations for health score
2. Generates rule-based insights from data patterns
3. Creates standard recommendations based on thresholds
4. Provides basic analysis without AI enhancement
5. User experience remains intact with useful information

## Customization Options

### Adjust Health Score Calculation
Edit `generateFallbackInsights()` in `/api/analytics/ai-insights/route.ts`:

```typescript
const healthScore = Math.min(100, Math.max(0, 
  (summary.marginPercent / 25) * 40 +     // Margin weight: 40 points
  ((1 - (atRisk / total)) * 30) +         // Risk weight: 30 points
  Math.min(30, (revenueGrowth + 10) * 1.5) // Growth weight: 30 points
));
```

### Modify Risk Thresholds
Edit `generateAlerts()` in `/api/analytics/route.ts`:

```typescript
if (marginPercent < 18) {  // Change threshold
  alerts.push({ severity: marginPercent < 15 ? "alert" : "warn", ... });
}
```

### Change Refresh Intervals
Edit `app/analytics/page.tsx`:

```typescript
const { data } = useQuery({
  queryKey: queryKeys.analytics,
  queryFn: fetchAnalytics,
  refetchInterval: 60000, // Change to 30000 for 30 seconds
});
```

### Customize Claude Model
Edit `/api/analytics/ai-insights/route.ts`:

```typescript
const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-latest",  // or "claude-3-opus-latest" for more detail
  max_tokens: 2500,                    // Increase for longer responses
  ...
});
```

## Troubleshooting

### Issue: AI Insights Not Appearing
**Solutions:**
1. Check `ANTHROPIC_API_KEY` is set in `.env.local`
2. Verify Claude API quota/billing
3. Check browser console for API errors
4. Fallback insights should still appear

### Issue: No Real Data Showing
**Solutions:**
1. Verify microservices are running (`docker ps` or check terminal)
2. Check service URLs in `.env.local`
3. Test endpoints: `curl http://localhost:4002/orders`
4. Mock data will display if services are unavailable

### Issue: Slow AI Insights
**Solutions:**
1. Claude API typically responds in 1-3 seconds
2. Check network connectivity
3. Reduce `max_tokens` in API call
4. Consider caching insights for repeated views

### Issue: Health Score Seems Wrong
**Solutions:**
1. Review calculation weights in fallback function
2. Ensure margin % is realistic (15-25% typical for TMS)
3. Check that at-risk trip ratio is calculated correctly
4. Verify revenue growth calculation is working

## Performance Optimization

### Caching Strategy
Consider adding Redis caching:

```typescript
// Cache AI insights for 5 minutes
const cacheKey = `ai-insights-${Date.now() / 300000 | 0}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Generate insights...
await redis.setex(cacheKey, 300, JSON.stringify(insights));
```

### Rate Limiting
Implement rate limiting for Claude API:

```typescript
const MAX_REQUESTS_PER_MINUTE = 10;
// Add rate limiting logic before Claude API call
```

## Future Enhancements

1. **Date Range Selector:** Filter analytics by custom date ranges
2. **Customer/Lane Filters:** Drill down into specific segments
3. **Historical Insights:** Track how insights change over time
4. **Insight Actions:** One-click actions from recommendations
5. **Export Reports:** PDF/Excel export with AI insights
6. **Alert Subscriptions:** Email/SMS when critical issues detected
7. **Comparative Analysis:** Compare periods (MTD, QTD, YTD)
8. **Predictive Modeling:** ML models for more accurate forecasts

## Cost Considerations

### Claude API Pricing (as of 2025)
- Input: ~$3 per million tokens
- Output: ~$15 per million tokens
- Average insight generation: ~3,000 input + 1,000 output tokens
- Cost per insight: ~$0.024 (2.4 cents)
- With 100 users viewing analytics 5x/day: ~$12/day or $360/month

### Cost Optimization
1. Cache insights for 5-15 minutes
2. Generate insights on-demand vs automatically
3. Use fallback insights for non-critical scenarios
4. Batch multiple requests if analyzing many time periods
5. Consider using Claude Haiku model for simpler insights (10x cheaper)

## Security Notes

- Never commit `.env.local` with real API keys
- Rotate Claude API keys regularly
- Implement authentication for analytics endpoints
- Rate limit API calls to prevent abuse
- Sanitize all user inputs before passing to AI
- Log AI usage for audit trails

## Support

For issues or questions:
1. Check browser console for errors
2. Review API response logs in terminal
3. Verify environment variables are set correctly
4. Test with fallback mode (remove API key temporarily)
5. Consult Anthropic Claude documentation for API issues
