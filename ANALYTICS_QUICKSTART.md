# Quick Start: Enhanced Analytics with AI

## 🚀 Immediate Setup (5 minutes)

### Step 1: Add Environment Variable
Create or edit `.env.local` in project root:

```bash
# Required for AI insights
ANTHROPIC_API_KEY=sk-ant-api03-...your-key-here...

# Optional (defaults shown)
ORDERS_SERVICE_URL=http://localhost:4002
TRACKING_SERVICE_URL=http://localhost:4004
MASTER_DATA_SERVICE_URL=http://localhost:4001
```

Get your Anthropic API key: https://console.anthropic.com/

### Step 2: Install Dependencies (if needed)
```bash
npm install @anthropic-ai/sdk
```

### Step 3: Start Application
```bash
npm run dev
```

### Step 4: View Analytics
Navigate to: http://localhost:3000/analytics

## ✅ What You'll See

### Without API Key
- All charts and analytics work normally
- AI Insights section shows **rule-based fallback insights**:
  - Health score calculated from data
  - Basic trend analysis
  - Standard recommendations
  - All functionality preserved

### With API Key
- Everything from above PLUS:
- **Claude AI-powered insights**:
  - Intelligent analysis of patterns
  - Sophisticated anomaly detection
  - Predictive forecasting
  - Context-aware recommendations
  - Professional-grade strategic advice

## 📊 What Was Enhanced

### Before (Original `/analytics`)
- Margin analytics summary
- Revenue vs cost trend chart
- Margin composition breakdown
- Driver margin leaders
- Lane profitability
- Static alerts

### After (Enhanced `/analytics`)
**Everything from before PLUS:**

1. **AI Insights Section** (new, full-width)
   - Executive summary with health score
   - Risk level assessment
   - Trend analysis cards
   - Performance metrics
   - Top recommendation spotlight

2. **Anomaly Detection** (new)
   - AI-detected issues
   - Severity levels
   - Business impact
   - Specific recommendations

3. **Predictions** (new)
   - Revenue forecast
   - Margin forecast
   - Confidence levels
   - Reasoning

4. **Strategic Recommendations** (new)
   - Priority-ranked actions
   - Expected impact
   - Timeframe
   - Urgency indicators

5. **Detailed Insights** (new)
   - Category analysis
   - Driver insights
   - Lane optimization opportunities

6. **Real Data Integration** (enhanced)
   - Fetches from Orders service
   - Fetches from Tracking service
   - Fetches from Master Data service
   - Falls back to mock data if unavailable

## 🎯 Testing It Out

### Test 1: View Without API Key
1. Don't set `ANTHROPIC_API_KEY`
2. Visit `/analytics`
3. See fallback insights appear
4. All functionality works

### Test 2: View With API Key
1. Set `ANTHROPIC_API_KEY` in `.env.local`
2. Restart dev server
3. Visit `/analytics`
4. Wait 1-2 seconds
5. AI insights appear with Claude analysis

### Test 3: Test With Microservices
1. Start Orders service: `cd services/orders && npm run dev`
2. Start Tracking service: `cd services/tracking && npm run dev`
3. Start Master Data service: `cd services/master-data && npm run dev`
4. Visit `/analytics`
5. See real data from services

### Test 4: Test Without Microservices
1. Stop all microservices
2. Visit `/analytics`
3. See mock data displayed
4. Everything still works

### Test 5: Refresh Insights
1. Click "Refresh Insights" button
2. See AI regenerate analysis
3. Insights update with new perspective

## 📁 What Files Changed

### New Files
- `app/api/analytics/ai-insights/route.ts` - Claude AI endpoint
- `ANALYTICS_AI_SETUP.md` - Detailed documentation
- `ANALYTICS_SUMMARY.md` - Feature summary
- `ANALYTICS_QUICKSTART.md` - This file

### Modified Files
- `app/api/analytics/route.ts` - Now fetches real data from microservices
- `app/analytics/page.tsx` - Added AI insights UI components

### Unchanged Files
- All other existing functionality preserved
- No breaking changes
- Backward compatible

## 💰 Cost Estimate

### Claude API Usage
- **Per Insight:** ~$0.024 (2.4 cents)
- **100 users, 5 views/day:** ~$12/day or $360/month
- **Optimization:** Cache insights for 5-15 minutes to reduce costs

### Cost Optimization Tips
1. Cache insights for 5-15 minutes
2. Generate on-demand vs automatically
3. Use fallback insights for non-critical views
4. Consider Claude Haiku model (10x cheaper)

## 🔧 Troubleshooting

### Issue: AI insights not appearing
**Solution:** Check browser console for errors. Verify API key is set correctly.

### Issue: "AI insights temporarily unavailable"
**Solution:** API key invalid or quota exceeded. Check Anthropic dashboard.

### Issue: No real data showing
**Solution:** Microservices not running. Start services or use mock data.

### Issue: Page loads slowly
**Solution:** Claude API can take 1-3 seconds. This is normal.

## 🎯 Next Actions

1. ✅ Set `ANTHROPIC_API_KEY` in `.env.local`
2. ✅ Start dev server
3. ✅ Visit `/analytics`
4. ✅ Explore AI insights
5. ✅ Click refresh to regenerate
6. ✅ Test with/without microservices
7. ✅ Share with team

## 📚 Documentation

- **Full Setup:** See `ANALYTICS_AI_SETUP.md`
- **Feature Summary:** See `ANALYTICS_SUMMARY.md`
- **API Docs:** See inline comments in route files

## 🎉 That's It!

You now have a **production-ready AI-powered analytics platform** that:
- Analyzes real fleet data
- Generates intelligent insights
- Provides actionable recommendations
- Predicts future performance
- Detects anomalies and risks
- Works with or without AI

**Enjoy your enhanced analytics!** 🚀
