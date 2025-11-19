# 🚀 Setup Real Distance Calculation - Quick Guide

## What Changed

✅ **Removed mock distance** (was showing hardcoded 120 miles)  
✅ **Now shows REAL distance** from database `distance_miles` column  
✅ **Auto-calculates on-demand** if distance is missing  
✅ **Shows "Distance calculation pending"** message when coordinates are missing  

---

## Quick Setup (5 Minutes)

### Step 1: Run Database Migration ⚡

The migration adds `distance_miles` and `duration_hours` columns to your `trips` table.

```powershell
# Option A: Using psql directly
$env:PGPASSWORD="your-password"
psql -h localhost -U postgres -d fleet_tracking -f services/tracking/src/db/migrations/002_add_distance_fields.sql

# Option B: Using the automated setup script
.\setup-distance-system.ps1
```

**What this does:**
- Adds `distance_miles` column to trips table
- Adds `duration_hours` column to trips table  
- Creates `distance_cache` table for performance
- Adds 4 stored procedures for distance management
- Creates 2 views for monitoring
- Sets up automatic calculation trigger

---

### Step 2: Verify Migration ✅

```powershell
# Check if new columns exist
psql -h localhost -U postgres -d fleet_tracking -c "\d trips"
```

**You should see:**
```
distance_miles              | numeric(10,2)
duration_hours              | numeric(6,2)
distance_calculated_at      | timestamp with time zone
distance_calculation_provider | character varying(50)
distance_calculation_method | character varying(50)
```

---

### Step 3: Calculate Existing Trip Distances 🔄

Now that the columns exist, backfill distance for all existing trips:

```powershell
# Option A: Calculate ALL missing distances
curl -X POST http://localhost:3000/api/distance/missing/calculate

# Option B: Calculate specific trip
curl -X POST http://localhost:3000/api/distance/trip/{trip-id}
```

**Example Output:**
```json
{
  "processed": 47,
  "successful": 45,
  "failed": 2,
  "duration": "18.3s"
}
```

---

### Step 4: Verify Real Distance is Showing 🎉

```powershell
# 1. Open any trip detail page
Start-Process "http://localhost:3000/trips/{trip-id}"

# 2. Check the trip ticket - you should see:
#    ✅ Real calculated distance (e.g., "~108 mi")
#    ✅ Real duration (e.g., "1h 58m")
#    ✅ No more mock "120 mi" values
```

---

## What Happens Now?

### For NEW Trips (Created After Migration)
✅ **Automatic calculation** - Database trigger calculates distance when trip is created  
✅ **Uses coordinates** - If `pickup_lat`, `pickup_lng`, `dropoff_lat`, `dropoff_lng` exist  
✅ **Cached results** - Saves API calls with 30-day cache  

### For EXISTING Trips (Created Before Migration)
✅ **On-demand calculation** - API calculates distance when trip is viewed (if missing)  
✅ **Batch processing** - Use `/api/distance/missing/calculate` to backfill all at once  
✅ **Manual trigger** - Use `/api/distance/trip/{id}` to recalculate specific trip  

---

## API Behavior Changes

### Before (Mock Data)
```typescript
// Hard-coded fallback
const distanceMiles = aiInsights?.routeOptimization.distance ?? data.metrics?.distanceMiles ?? 120;
//                                                                                           ^^^ MOCK
```

### After (Real Data)
```typescript
// Real database value, auto-calculated if missing
const distanceMiles = aiInsights?.routeOptimization?.distance ?? data.metrics?.distanceMiles;
//                                                                                           ^^^ REAL

// If coordinates exist but distance is missing, API calculates on-demand
if (!trip.distance_miles && trip.pickup_lat && trip.dropoff_lat) {
  const calculated = await calculateTripDistance(id, coords...);
}
```

---

## Troubleshooting

### ❌ "Distance calculation pending" Message Showing

**Cause:** Trip has no coordinates (`pickup_lat`, `pickup_lng`, `dropoff_lat`, `dropoff_lng`)

**Fix:**
1. Ensure trips have coordinate data when created
2. Update existing trips with coordinates:
   ```sql
   UPDATE trips 
   SET pickup_lat = 43.5448, pickup_lng = -80.2482,
       dropoff_lat = 42.8864, dropoff_lng = -78.8784
   WHERE id = 'trip-id';
   ```
3. Then trigger recalculation:
   ```bash
   curl -X PUT http://localhost:3000/api/distance/trip/{trip-id}
   ```

### ❌ Distance Still Shows 0 or NULL

**Check 1:** Did migration run successfully?
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'trips' AND column_name LIKE 'distance%';
```

**Check 2:** Are coordinates present?
```sql
SELECT id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng 
FROM trips WHERE distance_miles IS NULL LIMIT 5;
```

**Check 3:** Check distance service logs:
```bash
# Check API logs for errors
Get-Content -Tail 50 -Wait logs/api.log
```

### ❌ API Error: "Cannot read property of undefined"

**Cause:** Distance API endpoints not available

**Fix:** Ensure distance API routes exist:
```
app/api/distance/calculate/route.ts
app/api/distance/trip/[tripId]/route.ts
app/api/distance/missing/route.ts
```

---

## Database Schema Reference

### New Columns in `trips` Table
```sql
distance_miles              NUMERIC(10,2)     -- Calculated driving distance
duration_hours              NUMERIC(6,2)      -- Estimated driving time
distance_calculated_at      TIMESTAMPTZ       -- When it was calculated
distance_calculation_provider VARCHAR(50)     -- Which API was used (osrm, google, etc)
distance_calculation_method VARCHAR(50)       -- How it was calculated (auto, manual, api)
```

### New `distance_cache` Table
```sql
CREATE TABLE distance_cache (
    id UUID PRIMARY KEY,
    origin_location TEXT,
    destination_location TEXT,
    distance_miles NUMERIC(10,2),
    duration_hours NUMERIC(6,2),
    provider VARCHAR(50),
    cache_key VARCHAR(64) UNIQUE,
    hit_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);
```

---

## Testing Real Distance

### Test Case 1: Guelph, ON → Buffalo, NY
```bash
curl -X POST http://localhost:3000/api/distance/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Guelph, ON, Canada",
    "destination": "Buffalo, NY, USA"
  }'
```

**Expected:** `~108 miles` ✅

### Test Case 2: Check Specific Trip
```bash
# Get trip details
curl http://localhost:3000/api/trips/{trip-id}

# Look for metrics.distanceMiles in response
```

**Expected:**
```json
{
  "metrics": {
    "distanceMiles": 108.23,  // ✅ Real value
    "estDurationHours": 1.97  // ✅ Real value
  }
}
```

---

## Success Criteria ✅

After setup, you should have:

- ✅ Database columns added (distance_miles, duration_hours)
- ✅ Migration ran successfully with no errors
- ✅ Existing trips show real calculated distances (not 0 or 120)
- ✅ New trips automatically calculate distance on creation
- ✅ Trip detail pages show accurate distance and duration
- ✅ No more "mock" or hardcoded distance values
- ✅ Cache hit rate improving over time (check `/api/distance/cache`)

---

## Next Steps

1. **Monitor cache performance:**
   ```bash
   curl http://localhost:3000/api/distance/cache
   ```

2. **Set up scheduled cleanup (optional):**
   ```sql
   -- Run weekly via cron
   SELECT cleanup_expired_distance_cache();
   ```

3. **Review distance calculations:**
   ```sql
   -- Check calculation coverage
   SELECT 
     COUNT(*) FILTER (WHERE distance_miles IS NOT NULL) as calculated,
     COUNT(*) FILTER (WHERE distance_miles IS NULL) as missing,
     ROUND(COUNT(*) FILTER (WHERE distance_miles IS NOT NULL)::numeric / COUNT(*) * 100, 2) as coverage_pct
   FROM trips;
   ```

---

## Support

- 📖 **Full Documentation:** `DISTANCE_CALCULATION_GUIDE.md`
- 📝 **Quick Commands:** `DISTANCE_QUICK_REFERENCE.md`
- 🎨 **Visual Overview:** `DISTANCE_VISUAL_OVERVIEW.md`
- 🤖 **Setup Script:** `setup-distance-system.ps1`

---

**🎉 Your fleet app now shows REAL distances based on actual driving routes!**
