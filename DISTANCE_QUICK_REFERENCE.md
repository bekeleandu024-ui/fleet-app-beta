# Distance Calculation System - Quick Reference

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install axios pg

# Run database migration
psql -U postgres -d fleet_management -f services/tracking/src/db/migrations/002_add_distance_fields.sql

# Test the service
node services/distance-service.js

# Run comprehensive tests
node services/tests/distance-service.test.js

# Calculate missing distances for all trips
npm run distance:calculate-missing

# View cache statistics
npm run distance:stats
```

## 📡 API Endpoints Quick Reference

### Calculate Distance
```bash
# Simple calculation
curl "http://localhost:3000/api/distance/calculate?origin=Guelph,ON,Canada&destination=Buffalo,NY,USA"

# With preferred provider
curl -X POST http://localhost:3000/api/distance/calculate \
  -H "Content-Type: application/json" \
  -d '{"origin": "Guelph, ON", "destination": "Buffalo, NY", "provider": "osrm"}'
```

### Trip Operations
```bash
# Calculate distance for specific trip
curl -X POST http://localhost:3000/api/distance/trip/{TRIP_ID}

# Force recalculate (bypass cache)
curl -X PUT http://localhost:3000/api/distance/trip/{TRIP_ID}/recalculate

# Get trip distance info
curl http://localhost:3000/api/distance/trip/{TRIP_ID}
```

### Batch Operations
```bash
# Get trips missing distance
curl "http://localhost:3000/api/distance/missing?limit=100"

# Calculate all missing distances
curl -X POST http://localhost:3000/api/distance/missing/calculate \
  -H "Content-Type: application/json" \
  -d '{"limit": 100, "batchSize": 50}'

# Batch calculate multiple routes
curl -X POST http://localhost:3000/api/distance/batch \
  -H "Content-Type: application/json" \
  -d '{
    "pairs": [
      {"origin": "Toronto, ON", "destination": "Detroit, MI"},
      {"origin": "Vancouver, BC", "destination": "Seattle, WA"}
    ]
  }'
```

### Cache Management
```bash
# Get cache statistics
curl http://localhost:3000/api/distance/cache

# Clean up expired cache
curl -X DELETE http://localhost:3000/api/distance/cache
```

## 🗄️ Database Queries

```sql
-- Check trips without distance
SELECT COUNT(*) FROM trips WHERE distance_miles IS NULL;

-- View cache statistics
SELECT * FROM v_distance_cache_stats;

-- List trips missing distance
SELECT * FROM v_trips_missing_distance LIMIT 10;

-- Manually trigger distance calculation
SELECT auto_calculate_trip_distance('trip-uuid-here');

-- Get cached distance
SELECT * FROM get_cached_distance('Guelph, ON, Canada', 'Buffalo, NY, USA');

-- Clean up expired cache
SELECT * FROM cleanup_expired_distance_cache();

-- Check distance for specific trip
SELECT 
  id, 
  pickup_location, 
  dropoff_location, 
  distance_miles, 
  duration_hours,
  distance_calculation_provider
FROM trips 
WHERE id = 'trip-uuid-here';
```

## 🔑 Environment Variables

```env
# Required
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleet_management
DB_USER=postgres
DB_PASSWORD=your_password

# Optional - API Keys (start with free OSRM)
GOOGLE_MAPS_API_KEY=your_google_key
MAPBOX_API_KEY=your_mapbox_key
TOMTOM_API_KEY=your_tomtom_key

# Optional - Custom OSRM
OSRM_ENDPOINT=https://your-osrm-server.com
```

## 📊 Provider Comparison

| Provider | Cost | Rate Limit | Setup Time | Best For |
|----------|------|------------|------------|----------|
| OSRM (Public) | FREE | 300/min | 5 min | Starting, High Volume |
| OSRM (Self-hosted) | $15-50/mo | Unlimited | 2-3 hrs | Production |
| MapBox | $0.50/1k | 60/min | 15 min | Balance |
| Google Maps | $5/1k | 50/min | 15 min | Accuracy |
| TomTom | Varies | 50/min | 15 min | Trucking |

## 💡 Common Use Cases

### Fix Your Existing Data (Guelph → Buffalo showing 0 miles)
```bash
# Option 1: Via API
curl -X POST http://localhost:3000/api/distance/missing/calculate \
  -H "Content-Type: application/json" \
  -d '{"limit": 1000, "batchSize": 100}'

# Option 2: Direct database function
psql -d fleet_management -c "
  SELECT auto_calculate_trip_distance(id) 
  FROM trips 
  WHERE distance_miles IS NULL 
  LIMIT 100;
"
```

### Calculate Distance for New Trip
```javascript
// In your trip creation code
const { DatabaseDistanceService } = require('./services/database-integration');

async function createTrip(tripData) {
  const trip = await createTripInDatabase(tripData);
  
  const distanceService = new DatabaseDistanceService();
  await distanceService.calculateTripDistance(trip.id);
  await distanceService.close();
  
  return trip;
}
```

### Monitor Cache Performance
```bash
# Check hit rate (should be > 70%)
curl http://localhost:3000/api/distance/cache | jq '.service.cacheHitRate'

# View database cache size
psql -d fleet_management -c "SELECT COUNT(*) as cache_size FROM distance_cache;"
```

## 🐛 Troubleshooting Quick Fixes

### Distance showing 0 or NULL
```bash
# Recalculate specific trip
curl -X PUT http://localhost:3000/api/distance/trip/YOUR_TRIP_ID/recalculate
```

### "Unable to geocode" error
```javascript
// Use coordinates instead of city names
{
  "origin": {"lat": 43.5448, "lng": -80.2482},
  "destination": {"lat": 42.8864, "lng": -78.8784}
}
```

### All providers failing
```bash
# Check if OSRM is accessible
curl "https://router.project-osrm.org/route/v1/driving/-80.2482,43.5448;-78.8784,42.8864"

# Enable fallback in config
# Edit services/distance-service.js
# CONFIG.fallback.enabled = true
```

### Slow performance
```sql
-- Check if indexes exist
SELECT * FROM pg_indexes WHERE tablename = 'distance_cache';

-- Rebuild if needed
REINDEX TABLE distance_cache;
```

## 📁 File Structure

```
fleet-app-beta/
├── services/
│   ├── distance-service.js              # Core distance calculation
│   ├── database-integration.js          # Database layer
│   ├── tests/
│   │   └── distance-service.test.js     # Test suite
│   └── examples/
│       └── usage-examples.js            # Usage examples
├── services/tracking/src/db/migrations/
│   └── 002_add_distance_fields.sql      # Database migration
├── app/api/distance/
│   ├── calculate/route.ts               # Calculate endpoint
│   ├── trip/[tripId]/route.ts          # Trip operations
│   ├── batch/route.ts                   # Batch operations
│   ├── missing/route.ts                 # Missing distances
│   └── cache/route.ts                   # Cache management
└── DISTANCE_CALCULATION_GUIDE.md        # Full documentation
```

## 🎯 Success Metrics

After implementation, you should see:
- ✅ Distance calculated for all new trips
- ✅ Cache hit rate > 70%
- ✅ API response time < 500ms (cached)
- ✅ API response time < 2s (uncached)
- ✅ Cost < $10/month for 1000 trips
- ✅ Zero manual distance entry needed

## 🔗 Links

- Full Guide: `DISTANCE_CALCULATION_GUIDE.md`
- Test Suite: `services/tests/distance-service.test.js`
- Examples: `services/examples/usage-examples.js`
- OSRM Docs: http://project-osrm.org/docs/
- MapBox API: https://docs.mapbox.com/api/navigation/
- Google Maps API: https://developers.google.com/maps/documentation/distance-matrix

## 📞 Need Help?

1. Run tests: `npm run test:distance`
2. Check examples: `npm run example:distance`
3. View cache stats: `npm run distance:stats`
4. Review logs for errors
5. Check API provider status
