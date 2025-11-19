# Automated Distance Calculation System - Implementation Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Database Setup](#database-setup)
4. [API Provider Configuration](#api-provider-configuration)
5. [Integration Methods](#integration-methods)
6. [API Endpoints](#api-endpoints)
7. [Cost Comparison](#cost-comparison)
8. [Performance Optimization](#performance-optimization)
9. [Troubleshooting](#troubleshooting)
10. [Production Deployment](#production-deployment)

---

## 🎯 Overview

This automated distance calculation system solves the critical problem of missing distance and cost data in your fleet management application. It provides:

- **Automatic distance calculation** when trips are created
- **Multi-provider support** (OSRM free, Google Maps, MapBox, TomTom)
- **Intelligent caching** to reduce API costs
- **Cross-border routing** (US/Canada)
- **Batch processing** for existing trips
- **Error handling and fallbacks**

### Architecture

```
┌─────────────────┐
│  Next.js App    │
│  (Frontend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  API Routes                 │
│  - /api/distance/calculate  │
│  - /api/distance/trip/:id   │
│  - /api/distance/missing    │
│  - /api/distance/batch      │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Database Integration Layer  │
│  - Trip distance management  │
│  - Cache management          │
│  - Batch processing          │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Distance Service (Core)     │
│  - Multi-provider support    │
│  - In-memory caching         │
│  - Rate limiting             │
│  - Fallback estimation       │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  External APIs               │
│  - OSRM (Free)              │
│  - Google Maps              │
│  - MapBox                   │
│  - TomTom                   │
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  PostgreSQL Database         │
│  - trips table              │
│  - distance_cache table     │
│  - Stored procedures        │
└──────────────────────────────┘
```

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install axios pg crypto
```

### Step 2: Run Database Migration

```bash
# Connect to your PostgreSQL database
psql -U postgres -d fleet_management

# Run the migration
\i services/tracking/src/db/migrations/002_add_distance_fields.sql
```

### Step 3: Configure Environment Variables

Create or update `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleet_management
DB_USER=postgres
DB_PASSWORD=your_password

# API Keys (optional - start with free OSRM)
GOOGLE_MAPS_API_KEY=your_google_key_here
MAPBOX_API_KEY=your_mapbox_key_here
TOMTOM_API_KEY=your_tomtom_key_here

# Custom OSRM endpoint (optional - for self-hosted)
OSRM_ENDPOINT=https://your-osrm-server.com
```

### Step 4: Test the Service

```bash
# Test distance service
node services/distance-service.js

# Run comprehensive tests
node services/tests/distance-service.test.js

# Run usage examples
node services/examples/usage-examples.js
```

### Step 5: Calculate Missing Distances

```bash
# Using Node.js directly
node -e "
const { DatabaseDistanceService } = require('./services/database-integration');
(async () => {
  const service = new DatabaseDistanceService();
  const result = await service.calculateMissingDistances({ limit: 100 });
  console.log(result);
  await service.close();
})();
"

# Or use the API endpoint
curl -X POST http://localhost:3000/api/distance/missing/calculate \
  -H "Content-Type: application/json" \
  -d '{"limit": 100, "batchSize": 50}'
```

---

## 🗄️ Database Setup

### Schema Changes

The migration adds the following to your `trips` table:

```sql
-- New columns
distance_miles              NUMERIC(10, 2)    -- Calculated distance
duration_hours              NUMERIC(6, 2)     -- Estimated duration
distance_calculated_at      TIMESTAMPTZ       -- When calculated
distance_calculation_provider VARCHAR(50)     -- Which API used
distance_calculation_method VARCHAR(50)       -- auto/manual/api
```

### New Tables

#### distance_cache
Caches distance calculations to reduce API calls:

```sql
CREATE TABLE distance_cache (
    id UUID PRIMARY KEY,
    origin_location TEXT NOT NULL,
    destination_location TEXT NOT NULL,
    distance_miles NUMERIC(10, 2) NOT NULL,
    duration_hours NUMERIC(6, 2) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    cache_key VARCHAR(64) UNIQUE,
    hit_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);
```

### Stored Procedures

#### get_cached_distance(origin, destination)
Retrieves cached distance and updates hit count.

#### cache_distance_calculation(...)
Stores new distance calculation in cache.

#### auto_calculate_trip_distance(trip_id)
Automatically calculates distance for a trip using cached data if available.

#### cleanup_expired_distance_cache()
Removes expired cache entries and maintains cache size.

### Views

#### v_distance_cache_stats
Provides cache statistics and usage metrics.

#### v_trips_missing_distance
Lists all trips that need distance calculations.

### Triggers

#### trg_trips_auto_distance
Automatically attempts to calculate distance when a new trip is created.

---

## 🔑 API Provider Configuration

### Option 1: OSRM (FREE - Recommended to Start)

**Cost:** FREE  
**Rate Limit:** 300+ requests/minute (public server)  
**Setup:** No API key needed

```javascript
// Uses public OSRM server by default
// No configuration needed!
```

**Self-Hosted OSRM (for production):**

```bash
# Install Docker
docker pull osrm/osrm-backend

# Download map data (example: North America)
wget http://download.geofabrik.de/north-america-latest.osm.pbf

# Process map data
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/north-america-latest.osm.pbf
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-partition /data/north-america-latest.osrm
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-customize /data/north-america-latest.osrm

# Run OSRM server
docker run -t -i -p 5000:5000 -v "${PWD}:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/north-america-latest.osrm

# Update .env
OSRM_ENDPOINT=http://localhost:5000
```

### Option 2: Google Maps

**Cost:** $5 per 1,000 requests (Standard), $10 per 1,000 (Advanced with traffic)  
**Free Tier:** $200 credit per month  
**Best For:** High accuracy, real-time traffic

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable "Distance Matrix API" and "Geocoding API"
4. Create API key
5. Add to `.env`:

```env
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Option 3: MapBox

**Cost:** Free tier (100k requests/month), then $0.50 per 1,000  
**Best For:** Balance of cost and features

**Setup:**
1. Go to [MapBox](https://www.mapbox.com/)
2. Sign up for account
3. Get access token from dashboard
4. Add to `.env`:

```env
MAPBOX_API_KEY=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6IlhYWFhYWFhYWFgifQ.XXXXXXXXXXXXXXXXXXXX
```

### Option 4: TomTom

**Cost:** Free tier (2,500 requests/day), then paid  
**Best For:** Commercial trucking features

**Setup:**
1. Go to [TomTom Developer Portal](https://developer.tomtom.com/)
2. Create account and get API key
3. Add to `.env`:

```env
TOMTOM_API_KEY=your_tomtom_api_key_here
```

---

## 🔄 Integration Methods

### Method 1: Automatic (Recommended)

Distance is automatically calculated when a trip is created via database trigger.

**How it works:**
1. Trip is created with pickup/delivery locations
2. Trigger checks if locations exist
3. Attempts to get distance from cache
4. If not cached, marks for API calculation
5. Background process calculates and updates

**Pros:**
- Zero manual intervention
- Seamless user experience
- Cache-first approach minimizes costs

**Cons:**
- Initial calculation may be delayed
- Requires background job processor

### Method 2: Synchronous API Call

Calculate distance immediately when creating a trip.

**Example:**

```typescript
// In your trip creation logic
import { DatabaseDistanceService } from '@/services/database-integration';

async function createTrip(tripData) {
  // Create trip in database
  const trip = await db.trips.create(tripData);
  
  // Calculate distance immediately
  const distanceService = new DatabaseDistanceService();
  try {
    await distanceService.calculateTripDistance(trip.id);
  } catch (error) {
    console.error('Failed to calculate distance:', error);
    // Trip is still created, distance can be calculated later
  }
  
  return trip;
}
```

**Pros:**
- Distance available immediately
- Simple implementation
- Easy to debug

**Cons:**
- Slower trip creation
- API failures block trip creation
- Higher user-perceived latency

### Method 3: Background Queue (Production)

Use a job queue to process distance calculations asynchronously.

**Example with Bull Queue:**

```bash
npm install bull redis
```

```javascript
// jobs/distance-calculator.js
const Queue = require('bull');
const { DatabaseDistanceService } = require('./services/database-integration');

const distanceQueue = new Queue('distance-calculation', {
  redis: { host: 'localhost', port: 6379 }
});

// Add job when trip is created
async function queueDistanceCalculation(tripId) {
  await distanceQueue.add({ tripId }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
}

// Process jobs
distanceQueue.process(async (job) => {
  const { tripId } = job.data;
  const service = new DatabaseDistanceService();
  
  try {
    const result = await service.calculateTripDistance(tripId);
    return result;
  } finally {
    await service.close();
  }
});

module.exports = { queueDistanceCalculation };
```

**Pros:**
- Best performance
- Fault tolerant with retries
- Doesn't block user requests
- Can prioritize jobs

**Cons:**
- Requires Redis
- More complex setup
- Additional infrastructure

### Method 4: Batch Processing (For Existing Data)

Calculate distances for all existing trips.

**Example:**

```bash
# Process all missing distances
curl -X POST http://localhost:3000/api/distance/missing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "limit": null,
    "batchSize": 100
  }'
```

**Or using Node.js:**

```javascript
const { DatabaseDistanceService } = require('./services/database-integration');

async function processAllTrips() {
  const service = new DatabaseDistanceService();
  
  try {
    console.log('Starting batch processing...');
    
    const result = await service.calculateMissingDistances({
      batchSize: 100  // Process 100 at a time
    });
    
    console.log(`Processed ${result.total} trips`);
    console.log(`Successful: ${result.successful}`);
    console.log(`Failed: ${result.failed}`);
    
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    }
  } finally {
    await service.close();
  }
}

processAllTrips();
```

---

## 🌐 API Endpoints

### Calculate Distance

**GET/POST** `/api/distance/calculate`

Calculate distance between two locations.

**Request:**
```bash
# GET with query parameters
curl "http://localhost:3000/api/distance/calculate?origin=Guelph,ON,Canada&destination=Buffalo,NY,USA"

# POST with JSON body
curl -X POST http://localhost:3000/api/distance/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Guelph, ON, Canada",
    "destination": "Buffalo, NY, USA",
    "provider": "osrm"
  }'
```

**Response:**
```json
{
  "distanceMiles": "108.23",
  "durationHours": "1.97",
  "distanceKm": "174.15",
  "durationMinutes": 118,
  "provider": "osrm",
  "cached": false
}
```

### Calculate Trip Distance

**POST** `/api/distance/trip/:tripId`

Calculate and store distance for a specific trip.

**Request:**
```bash
curl -X POST http://localhost:3000/api/distance/trip/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "tripId": "550e8400-e29b-41d4-a716-446655440000",
  "distanceMiles": "108.23",
  "durationHours": "1.97",
  "provider": "osrm",
  "updated": true
}
```

### Recalculate Trip Distance

**PUT** `/api/distance/trip/:tripId/recalculate`

Force recalculate (bypass cache).

**Request:**
```bash
curl -X PUT http://localhost:3000/api/distance/trip/550e8400-e29b-41d4-a716-446655440000/recalculate
```

### Get Trip Distance

**GET** `/api/distance/trip/:tripId`

Get distance information for a trip.

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "pickup_location": "Guelph, ON, Canada",
  "dropoff_location": "Buffalo, NY, USA",
  "distance_miles": "108.23",
  "duration_hours": "1.97",
  "distance_calculated_at": "2025-11-19T10:30:00Z",
  "distance_calculation_provider": "osrm",
  "distance_calculation_method": "api"
}
```

### Batch Calculate

**POST** `/api/distance/batch`

Calculate multiple distances at once.

**Request:**
```bash
curl -X POST http://localhost:3000/api/distance/batch \
  -H "Content-Type: application/json" \
  -d '{
    "pairs": [
      {"origin": "Toronto, ON", "destination": "Detroit, MI"},
      {"origin": "Vancouver, BC", "destination": "Seattle, WA"}
    ],
    "batchSize": 10
  }'
```

**Response:**
```json
{
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "origin": "Toronto, ON",
      "destination": "Detroit, MI",
      "result": {
        "distanceMiles": "234.56",
        "durationHours": "4.12"
      }
    }
  ]
}
```

### Get Missing Distances

**GET** `/api/distance/missing`

List trips without distance data.

**Request:**
```bash
curl "http://localhost:3000/api/distance/missing?limit=100"
```

### Calculate Missing Distances

**POST** `/api/distance/missing/calculate`

Process all trips missing distance.

**Request:**
```bash
curl -X POST http://localhost:3000/api/distance/missing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 100,
    "batchSize": 50
  }'
```

**Response:**
```json
{
  "total": 100,
  "successful": 95,
  "failed": 5,
  "errors": [
    {
      "tripId": "...",
      "error": "Unable to geocode location"
    }
  ]
}
```

### Cache Statistics

**GET** `/api/distance/cache`

Get cache performance statistics.

**Response:**
```json
{
  "database": {
    "totalEntries": 1523,
    "activeEntries": 1498,
    "expiredEntries": 25,
    "totalHits": 8934,
    "avgHitsPerEntry": "5.87"
  },
  "service": {
    "requests": 245,
    "cacheHits": 189,
    "cacheMisses": 56,
    "cacheHitRate": "77.14%"
  }
}
```

### Cleanup Cache

**DELETE** `/api/distance/cache`

Remove expired cache entries.

**Response:**
```json
{
  "deletedCount": 25
}
```

---

## 💰 Cost Comparison

### Monthly Cost Estimates

Assumptions: 1,000 trips/month, 70% cache hit rate, 300 API calls

| Provider | Free Tier | Cost for 300 calls | Cost for 10k calls | Best For |
|----------|-----------|--------------------|--------------------|----------|
| **OSRM (Public)** | ✅ Unlimited | $0 | $0 | Starting out, high volume |
| **OSRM (Self-hosted)** | N/A | $15-50/mo (server) | $15-50/mo | Production, full control |
| **MapBox** | 100k requests | $0 | $5 | Good balance |
| **Google Maps** | $200 credit | $1.50 | $50 | Best accuracy, traffic |
| **TomTom** | 2,500/day | $0 | Varies | Truck routing |

### Caching Impact

With proper caching (70-80% hit rate):

**Without Caching:**
- 1,000 trips × 1 API call = 1,000 API calls
- Google Maps: $5/month
- MapBox: $0.50/month

**With Caching:**
- 1,000 trips × 0.30 (30% miss rate) = 300 API calls
- Google Maps: $1.50/month
- MapBox: $0.15/month

**Savings: 70% reduction in costs**

### Recommendations by Scale

#### Startup (< 100 trips/month)
- **Use:** OSRM (public)
- **Cost:** $0
- **Setup:** 5 minutes

#### Small Business (100-1,000 trips/month)
- **Use:** MapBox or OSRM (public)
- **Cost:** $0-5/month
- **Setup:** 15 minutes

#### Medium Business (1,000-10,000 trips/month)
- **Use:** Self-hosted OSRM + MapBox fallback
- **Cost:** $20-30/month (server) + $5/month (API)
- **Setup:** 2-3 hours

#### Enterprise (10,000+ trips/month)
- **Use:** Self-hosted OSRM cluster + Google Maps fallback
- **Cost:** $100-200/month
- **Setup:** 1-2 days

---

## ⚡ Performance Optimization

### 1. Caching Strategy

**Two-Level Cache:**
```
Request → In-Memory Cache → Database Cache → API Provider
            (instant)         (fast)          (slow)
```

**Configuration:**
```javascript
// services/distance-service.js
const CONFIG = {
  cache: {
    enabled: true,
    ttlHours: 720,      // 30 days
    maxSize: 10000,     // 10k routes
  }
};
```

### 2. Rate Limiting

Prevents overwhelming APIs:

```javascript
const CONFIG = {
  rateLimits: {
    osrm: 300,      // requests/minute
    google: 50,
    mapbox: 60,
  }
};
```

### 3. Batch Processing

Process trips in batches to manage load:

```javascript
await service.calculateMissingDistances({
  batchSize: 50,  // Process 50 at a time
});
```

### 4. Database Indexing

Migration includes optimized indexes:

```sql
CREATE INDEX idx_distance_cache_key ON distance_cache(cache_key);
CREATE INDEX idx_trips_no_distance ON trips(id) WHERE distance_miles IS NULL;
```

### 5. Connection Pooling

Database connections are pooled:

```javascript
new Pool({
  max: 20,  // Max connections
  idleTimeoutMillis: 30000,
});
```

### 6. Geocoding Cache

Location geocoding is cached separately:

```javascript
GeocodingService.cache  // In-memory geocoding cache
```

### 7. Provider Fallback

Automatic failover to backup providers:

```javascript
providerOrder: ['osrm', 'mapbox', 'google', 'tomtom']
// Tries each in order until success
```

---

## 🔧 Troubleshooting

### Issue: "Trip not found"

**Cause:** Invalid trip ID or trip doesn't exist.

**Solution:**
```bash
# Verify trip exists
psql -d fleet_management -c "SELECT id, pickup_location, dropoff_location FROM trips WHERE id = 'your-trip-id';"
```

### Issue: "Unable to geocode locations"

**Cause:** Location string is invalid or too vague.

**Solutions:**
1. Use more specific locations: "Guelph, ON, Canada" instead of just "Guelph"
2. Provide coordinates instead: `{lat: 43.5448, lng: -80.2482}`
3. Check location spelling

### Issue: "All providers failed"

**Cause:** No API providers are available or all rate limits exceeded.

**Solutions:**
1. Check API keys are configured correctly
2. Verify network connectivity
3. Check rate limits haven't been exceeded
4. Enable fallback estimation:

```javascript
CONFIG.fallback.enabled = true
```

### Issue: "Distance is 0 or null"

**Cause:** Distance calculation failed or wasn't triggered.

**Solutions:**
```bash
# Manually trigger calculation
curl -X POST http://localhost:3000/api/distance/trip/YOUR_TRIP_ID

# Or recalculate (force refresh)
curl -X PUT http://localhost:3000/api/distance/trip/YOUR_TRIP_ID/recalculate
```

### Issue: "Cache not working"

**Cause:** Cache configuration or database issue.

**Diagnosis:**
```bash
# Check cache stats
curl http://localhost:3000/api/distance/cache

# Verify cache table exists
psql -d fleet_management -c "SELECT COUNT(*) FROM distance_cache;"
```

### Issue: "Slow performance"

**Solutions:**
1. Check cache hit rate (should be > 70%)
2. Increase batch size
3. Use self-hosted OSRM
4. Enable connection pooling
5. Check database indexes:

```sql
SELECT * FROM pg_indexes WHERE tablename IN ('trips', 'distance_cache');
```

### Issue: "CORS errors in browser"

**Cause:** API routes not properly configured for CORS.

**Solution:**
Add CORS headers to API routes:

```typescript
// In API route
export async function GET(request: Request) {
  const response = NextResponse.json(data);
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] Database migration completed
- [ ] Environment variables configured
- [ ] API keys secured (use secrets management)
- [ ] Self-hosted OSRM deployed (recommended)
- [ ] Caching enabled and tested
- [ ] Rate limits configured
- [ ] Monitoring set up
- [ ] Backup strategy defined
- [ ] Error alerting configured

### Environment Setup

**Production `.env`:**
```env
# Database (use connection string)
DATABASE_URL=postgresql://user:password@db-host:5432/fleet_management

# API Keys (use secrets manager)
GOOGLE_MAPS_API_KEY=${secret:google_maps_key}
MAPBOX_API_KEY=${secret:mapbox_key}

# Self-hosted OSRM
OSRM_ENDPOINT=https://osrm.yourdomain.com

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

### Docker Deployment

**Dockerfile for OSRM:**
```dockerfile
FROM osrm/osrm-backend

# Copy pre-processed map data
COPY north-america-latest.osrm* /data/

EXPOSE 5000

CMD ["osrm-routed", "--algorithm", "mld", "/data/north-america-latest.osrm"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  osrm:
    build: ./osrm
    ports:
      - "5000:5000"
    restart: unless-stopped
    volumes:
      - osrm-data:/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  osrm-data:
```

### Monitoring

**Key Metrics to Monitor:**

1. **API Performance**
   - Average response time
   - Error rate
   - Provider usage distribution

2. **Cache Performance**
   - Hit rate (target: > 70%)
   - Size utilization
   - Eviction rate

3. **Database**
   - Query performance
   - Connection pool usage
   - Cache table size

**Example Monitoring Setup:**

```javascript
// Add to distance-service.js
const Sentry = require('@sentry/node');

class DistanceService {
  async calculateDistance(origin, destination, options) {
    const span = Sentry.startTransaction({
      op: 'distance.calculate',
      name: 'Calculate Distance'
    });

    try {
      // ... calculation logic
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.setStatus('error');
      Sentry.captureException(error);
      throw error;
    } finally {
      span.finish();
    }
  }
}
```

### Backup Strategy

**Database Backups:**
```bash
# Backup distance cache
pg_dump -U postgres -d fleet_management -t distance_cache > distance_cache_backup.sql

# Restore if needed
psql -U postgres -d fleet_management < distance_cache_backup.sql
```

**Cache Warmup Script:**
```javascript
// scripts/warmup-cache.js
const { DatabaseDistanceService } = require('./services/database-integration');

async function warmupCache() {
  const service = new DatabaseDistanceService();
  
  // Get most common routes
  const routes = await service.db.query(`
    SELECT pickup_location, dropoff_location, COUNT(*) as freq
    FROM trips
    WHERE pickup_location IS NOT NULL
    GROUP BY pickup_location, dropoff_location
    ORDER BY freq DESC
    LIMIT 100
  `);
  
  // Pre-calculate distances
  const pairs = routes.rows.map(r => ({
    origin: r.pickup_location,
    destination: r.dropoff_location
  }));
  
  await service.batchCalculateDistances(pairs);
  await service.close();
}

warmupCache();
```

### Scaling Considerations

**Horizontal Scaling:**
- Load balance across multiple OSRM instances
- Use Redis for distributed caching
- Queue distance calculations

**Vertical Scaling:**
- Increase database connection pool
- Add more memory for caching
- Optimize database queries

### Health Checks

```typescript
// app/api/health/distance/route.ts
export async function GET() {
  const checks = {
    database: false,
    osrm: false,
    cache: false,
  };

  try {
    // Check database
    const db = new DatabaseConnection();
    await db.query('SELECT 1');
    checks.database = true;

    // Check OSRM
    const response = await fetch(`${CONFIG.endpoints.osrm}/route/v1/driving/-80.2482,43.5448;-78.8784,42.8864`);
    checks.osrm = response.ok;

    // Check cache
    const cacheResult = await db.query('SELECT COUNT(*) FROM distance_cache');
    checks.cache = true;

    const allHealthy = Object.values(checks).every(v => v);
    return NextResponse.json(checks, { status: allHealthy ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(checks, { status: 503 });
  }
}
```

---

## 📚 Additional Resources

### Documentation
- [OSRM Documentation](http://project-osrm.org/docs/v5.24.0/api/)
- [Google Maps Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix)
- [MapBox Directions API](https://docs.mapbox.com/api/navigation/directions/)
- [TomTom Routing API](https://developer.tomtom.com/routing-api/documentation)

### Support
- File issues on GitHub
- Check existing issues and solutions
- Review test suite for examples

---

## 🎉 Success!

You now have a production-ready automated distance calculation system! Your trips will automatically have:

✅ Accurate driving distances  
✅ Estimated durations  
✅ Cost calculations based on distance  
✅ Revenue tracking  
✅ Proper margin analysis  

**Next Steps:**
1. Monitor the system for first few days
2. Adjust cache TTL based on usage
3. Optimize provider selection based on costs
4. Set up alerts for failures
5. Consider self-hosting OSRM for production

Questions? Check the troubleshooting section or run the test suite to verify everything is working correctly.
