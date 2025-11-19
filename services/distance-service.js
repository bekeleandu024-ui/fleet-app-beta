/**
 * Distance Calculation Service
 * 
 * Multi-provider distance calculation service with caching, rate limiting, and fallback support.
 * Supports: OSRM (Free), Google Maps, MapBox, and TomTom
 * 
 * Features:
 * - Automatic provider fallback
 * - Smart caching with TTL
 * - Rate limiting per provider
 * - Cross-border route support (US/Canada)
 * - Batch processing capability
 * - Distance matrix pre-calculation
 */

const axios = require('axios');
const crypto = require('crypto');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Provider priorities (will try in order)
  providerOrder: ['osrm', 'mapbox', 'google', 'tomtom'],
  
  // API Keys (set via environment variables)
  apiKeys: {
    google: process.env.GOOGLE_MAPS_API_KEY || '',
    mapbox: process.env.MAPBOX_API_KEY || '',
    tomtom: process.env.TOMTOM_API_KEY || '',
  },
  
  // Rate limits (requests per minute)
  rateLimits: {
    osrm: 300,      // Free, self-hosted or public
    google: 50,     // Based on your plan
    mapbox: 60,     // Based on your plan
    tomtom: 50,     // Based on your plan
  },
  
  // Cache settings
  cache: {
    enabled: true,
    ttlHours: 720,  // 30 days (distances rarely change)
    maxSize: 10000, // Maximum cached routes
  },
  
  // Fallback estimation (if all APIs fail)
  fallback: {
    enabled: true,
    averageSpeedMph: 55,
    straightLineMultiplier: 1.3, // Actual road distance is ~1.3x straight line
  },
  
  // Endpoints
  endpoints: {
    osrm: 'https://router.project-osrm.org',
    customOsrm: process.env.OSRM_ENDPOINT || '', // For self-hosted
    google: 'https://maps.googleapis.com/maps/api',
    mapbox: 'https://api.mapbox.com',
    tomtom: 'https://api.tomtom.com',
  },
};

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

class DistanceCache {
  constructor() {
    this.cache = new Map();
    this.accessLog = new Map();
  }

  generateKey(origin, destination) {
    const normalized = `${this.normalizeLocation(origin)}|${this.normalizeLocation(destination)}`;
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  normalizeLocation(location) {
    if (typeof location === 'string') {
      return location.toLowerCase().trim().replace(/\s+/g, ' ');
    }
    if (location.lat && location.lng) {
      return `${location.lat.toFixed(5)},${location.lng.toFixed(5)}`;
    }
    return String(location);
  }

  get(origin, destination) {
    if (!CONFIG.cache.enabled) return null;
    
    const key = this.generateKey(origin, destination);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check TTL
    const ageHours = (Date.now() - entry.timestamp) / (1000 * 60 * 60);
    if (ageHours > CONFIG.cache.ttlHours) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access log for LRU
    this.accessLog.set(key, Date.now());
    
    return entry.data;
  }

  set(origin, destination, data) {
    if (!CONFIG.cache.enabled) return;
    
    const key = this.generateKey(origin, destination);
    
    // Enforce max size with LRU eviction
    if (this.cache.size >= CONFIG.cache.maxSize) {
      const oldestKey = Array.from(this.accessLog.entries())
        .sort((a, b) => a[1] - b[1])[0][0];
      this.cache.delete(oldestKey);
      this.accessLog.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    this.accessLog.set(key, Date.now());
  }

  clear() {
    this.cache.clear();
    this.accessLog.clear();
  }

  size() {
    return this.cache.size;
  }

  stats() {
    return {
      size: this.cache.size,
      maxSize: CONFIG.cache.maxSize,
      utilization: ((this.cache.size / CONFIG.cache.maxSize) * 100).toFixed(2) + '%',
    };
  }
}

// ============================================================================
// RATE LIMITER
// ============================================================================

class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  canMakeRequest(provider) {
    const limit = CONFIG.rateLimits[provider] || 60;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    
    if (!this.requests.has(provider)) {
      this.requests.set(provider, []);
    }
    
    const requests = this.requests.get(provider);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    this.requests.set(provider, validRequests);
    
    return validRequests.length < limit;
  }

  recordRequest(provider) {
    if (!this.requests.has(provider)) {
      this.requests.set(provider, []);
    }
    this.requests.get(provider).push(Date.now());
  }

  getRemainingRequests(provider) {
    const limit = CONFIG.rateLimits[provider] || 60;
    const now = Date.now();
    const windowMs = 60000;
    
    if (!this.requests.has(provider)) {
      return limit;
    }
    
    const validRequests = this.requests.get(provider)
      .filter(timestamp => now - timestamp < windowMs);
    
    return Math.max(0, limit - validRequests.length);
  }
}

// ============================================================================
// GEOCODING SERVICE
// ============================================================================

class GeocodingService {
  static cache = new Map();

  /**
   * Geocode a location string to lat/lng
   * Supports: "City, State", "City, State, Country", "Address"
   */
  static async geocode(location, provider = 'osrm') {
    const cacheKey = location.toLowerCase().trim();
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let result = null;

    try {
      if (provider === 'google' && CONFIG.apiKeys.google) {
        result = await this.geocodeGoogle(location);
      } else if (provider === 'mapbox' && CONFIG.apiKeys.mapbox) {
        result = await this.geocodeMapbox(location);
      } else {
        // Use Nominatim (free OSM geocoding)
        result = await this.geocodeNominatim(location);
      }

      if (result) {
        this.cache.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      console.error(`Geocoding failed for ${location}:`, error.message);
      return null;
    }
  }

  static async geocodeNominatim(location) {
    const url = 'https://nominatim.openstreetmap.org/search';
    const response = await axios.get(url, {
      params: {
        q: location,
        format: 'json',
        limit: 1,
      },
      headers: {
        'User-Agent': 'FleetManagementApp/1.0',
      },
      timeout: 5000,
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formattedAddress: result.display_name,
      };
    }

    return null;
  }

  static async geocodeGoogle(location) {
    const url = `${CONFIG.endpoints.google}/geocode/json`;
    const response = await axios.get(url, {
      params: {
        address: location,
        key: CONFIG.apiKeys.google,
      },
      timeout: 5000,
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    }

    return null;
  }

  static async geocodeMapbox(location) {
    const url = `${CONFIG.endpoints.mapbox}/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json`;
    const response = await axios.get(url, {
      params: {
        access_token: CONFIG.apiKeys.mapbox,
        limit: 1,
      },
      timeout: 5000,
    });

    if (response.data.features && response.data.features.length > 0) {
      const result = response.data.features[0];
      return {
        lat: result.center[1],
        lng: result.center[0],
        formattedAddress: result.place_name,
      };
    }

    return null;
  }

  static clearCache() {
    this.cache.clear();
  }
}

// ============================================================================
// DISTANCE PROVIDERS
// ============================================================================

class DistanceProviders {
  /**
   * OSRM - Open Source Routing Machine (FREE)
   * Best for: High volume, cost-sensitive applications
   * Limitations: No traffic data, basic routing
   */
  static async calculateOSRM(origin, destination) {
    const originCoords = await this.ensureCoordinates(origin);
    const destCoords = await this.ensureCoordinates(destination);

    if (!originCoords || !destCoords) {
      throw new Error('Unable to geocode locations');
    }

    const endpoint = CONFIG.endpoints.customOsrm || CONFIG.endpoints.osrm;
    const url = `${endpoint}/route/v1/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}`;

    const response = await axios.get(url, {
      params: {
        overview: 'false',
        alternatives: 'false',
        steps: 'false',
      },
      timeout: 10000,
    });

    if (response.data.code !== 'Ok' || !response.data.routes || response.data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = response.data.routes[0];
    const distanceMeters = route.distance;
    const durationSeconds = route.duration;

    return {
      distanceMiles: (distanceMeters * 0.000621371).toFixed(2),
      durationHours: (durationSeconds / 3600).toFixed(2),
      distanceKm: (distanceMeters / 1000).toFixed(2),
      durationMinutes: Math.round(durationSeconds / 60),
      provider: 'osrm',
      cached: false,
    };
  }

  /**
   * Google Maps Distance Matrix API
   * Best for: Accurate ETA with traffic, high-quality routing
   * Cost: $5 per 1000 requests (Standard), $10 per 1000 (Advanced)
   */
  static async calculateGoogle(origin, destination) {
    if (!CONFIG.apiKeys.google) {
      throw new Error('Google Maps API key not configured');
    }

    const url = `${CONFIG.endpoints.google}/distancematrix/json`;
    const response = await axios.get(url, {
      params: {
        origins: typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`,
        destinations: typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`,
        key: CONFIG.apiKeys.google,
        units: 'imperial',
        mode: 'driving',
        departure_time: 'now', // For traffic-aware routing
      },
      timeout: 10000,
    });

    if (response.data.status !== 'OK' || !response.data.rows || response.data.rows.length === 0) {
      throw new Error(`Google API error: ${response.data.status}`);
    }

    const element = response.data.rows[0].elements[0];
    
    if (element.status !== 'OK') {
      throw new Error(`Route not found: ${element.status}`);
    }

    return {
      distanceMiles: (element.distance.value * 0.000621371).toFixed(2),
      durationHours: (element.duration.value / 3600).toFixed(2),
      distanceKm: (element.distance.value / 1000).toFixed(2),
      durationMinutes: Math.round(element.duration.value / 60),
      trafficDurationMinutes: element.duration_in_traffic ? Math.round(element.duration_in_traffic.value / 60) : null,
      provider: 'google',
      cached: false,
    };
  }

  /**
   * MapBox Directions API
   * Best for: Good balance of cost and features
   * Cost: Free tier 100k requests/month, then $0.50 per 1000
   */
  static async calculateMapbox(origin, destination) {
    if (!CONFIG.apiKeys.mapbox) {
      throw new Error('MapBox API key not configured');
    }

    const originCoords = await this.ensureCoordinates(origin);
    const destCoords = await this.ensureCoordinates(destination);

    if (!originCoords || !destCoords) {
      throw new Error('Unable to geocode locations');
    }

    const url = `${CONFIG.endpoints.mapbox}/directions/v5/mapbox/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}`;

    const response = await axios.get(url, {
      params: {
        access_token: CONFIG.apiKeys.mapbox,
        overview: 'false',
        geometries: 'geojson',
      },
      timeout: 10000,
    });

    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = response.data.routes[0];

    return {
      distanceMiles: (route.distance * 0.000621371).toFixed(2),
      durationHours: (route.duration / 3600).toFixed(2),
      distanceKm: (route.distance / 1000).toFixed(2),
      durationMinutes: Math.round(route.duration / 60),
      provider: 'mapbox',
      cached: false,
    };
  }

  /**
   * TomTom Routing API
   * Best for: Professional routing with truck-specific features
   * Cost: Free tier 2,500 requests/day, then paid plans
   */
  static async calculateTomTom(origin, destination) {
    if (!CONFIG.apiKeys.tomtom) {
      throw new Error('TomTom API key not configured');
    }

    const originCoords = await this.ensureCoordinates(origin);
    const destCoords = await this.ensureCoordinates(destination);

    if (!originCoords || !destCoords) {
      throw new Error('Unable to geocode locations');
    }

    const url = `${CONFIG.endpoints.tomtom}/routing/1/calculateRoute/${originCoords.lat},${originCoords.lng}:${destCoords.lat},${destCoords.lng}/json`;

    const response = await axios.get(url, {
      params: {
        key: CONFIG.apiKeys.tomtom,
        travelMode: 'truck',
        vehicleCommercial: true,
      },
      timeout: 10000,
    });

    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = response.data.routes[0];
    const summary = route.summary;

    return {
      distanceMiles: (summary.lengthInMeters * 0.000621371).toFixed(2),
      durationHours: (summary.travelTimeInSeconds / 3600).toFixed(2),
      distanceKm: (summary.lengthInMeters / 1000).toFixed(2),
      durationMinutes: Math.round(summary.travelTimeInSeconds / 60),
      trafficDurationMinutes: summary.trafficDelayInSeconds ? Math.round((summary.travelTimeInSeconds + summary.trafficDelayInSeconds) / 60) : null,
      provider: 'tomtom',
      cached: false,
    };
  }

  /**
   * Fallback estimation using Haversine formula
   * Used when all API providers fail
   */
  static async calculateFallback(origin, destination) {
    const originCoords = await this.ensureCoordinates(origin);
    const destCoords = await this.ensureCoordinates(destination);

    if (!originCoords || !destCoords) {
      throw new Error('Unable to geocode locations for fallback calculation');
    }

    const distanceMiles = this.haversineDistance(
      originCoords.lat,
      originCoords.lng,
      destCoords.lat,
      destCoords.lng
    );

    // Apply road distance multiplier
    const roadDistanceMiles = distanceMiles * CONFIG.fallback.straightLineMultiplier;
    const durationHours = roadDistanceMiles / CONFIG.fallback.averageSpeedMph;

    return {
      distanceMiles: roadDistanceMiles.toFixed(2),
      durationHours: durationHours.toFixed(2),
      distanceKm: (roadDistanceMiles * 1.60934).toFixed(2),
      durationMinutes: Math.round(durationHours * 60),
      provider: 'fallback',
      cached: false,
      warning: 'Estimated distance based on straight-line calculation. Actual driving distance may vary.',
    };
  }

  /**
   * Haversine formula for calculating straight-line distance between two points
   */
  static haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Ensure we have coordinates (lat/lng) for a location
   */
  static async ensureCoordinates(location) {
    if (typeof location === 'object' && location.lat && location.lng) {
      return location;
    }
    
    if (typeof location === 'string') {
      return await GeocodingService.geocode(location);
    }
    
    return null;
  }
}

// ============================================================================
// MAIN DISTANCE SERVICE
// ============================================================================

class DistanceService {
  constructor() {
    this.cache = new DistanceCache();
    this.rateLimiter = new RateLimiter();
    this.stats = {
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      providerUsage: {},
    };
  }

  /**
   * Calculate distance between two locations
   * @param {string|object} origin - City/State string or {lat, lng} object
   * @param {string|object} destination - City/State string or {lat, lng} object
   * @param {object} options - Additional options
   * @returns {Promise<object>} Distance calculation result
   */
  async calculateDistance(origin, destination, options = {}) {
    this.stats.requests++;

    try {
      // Check cache first
      const cached = this.cache.get(origin, destination);
      if (cached) {
        this.stats.cacheHits++;
        return { ...cached, cached: true };
      }

      this.stats.cacheMisses++;

      // Determine provider order
      const providers = options.preferredProvider
        ? [options.preferredProvider, ...CONFIG.providerOrder.filter(p => p !== options.preferredProvider)]
        : CONFIG.providerOrder;

      let lastError = null;

      // Try each provider in order
      for (const provider of providers) {
        try {
          // Check rate limit
          if (!this.rateLimiter.canMakeRequest(provider)) {
            console.warn(`Rate limit reached for ${provider}, trying next provider`);
            continue;
          }

          let result;

          switch (provider) {
            case 'osrm':
              result = await DistanceProviders.calculateOSRM(origin, destination);
              break;
            case 'google':
              result = await DistanceProviders.calculateGoogle(origin, destination);
              break;
            case 'mapbox':
              result = await DistanceProviders.calculateMapbox(origin, destination);
              break;
            case 'tomtom':
              result = await DistanceProviders.calculateTomTom(origin, destination);
              break;
            default:
              continue;
          }

          // Record success
          this.rateLimiter.recordRequest(provider);
          this.stats.providerUsage[provider] = (this.stats.providerUsage[provider] || 0) + 1;

          // Cache the result
          this.cache.set(origin, destination, result);

          return result;
        } catch (error) {
          console.warn(`${provider} failed:`, error.message);
          lastError = error;
        }
      }

      // All providers failed, use fallback if enabled
      if (CONFIG.fallback.enabled) {
        console.warn('All providers failed, using fallback estimation');
        const result = await DistanceProviders.calculateFallback(origin, destination);
        this.cache.set(origin, destination, result);
        return result;
      }

      throw lastError || new Error('All distance calculation providers failed');
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Calculate distances for multiple origin-destination pairs
   * @param {Array} pairs - Array of {origin, destination} objects
   * @returns {Promise<Array>} Array of distance results
   */
  async calculateBatch(pairs, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 10;
    
    for (let i = 0; i < pairs.length; i += batchSize) {
      const batch = pairs.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(pair => this.calculateDistance(pair.origin, pair.destination, options))
      );
      
      results.push(...batchResults.map((result, index) => ({
        ...batch[index],
        result: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null,
      })));
    }
    
    return results;
  }

  /**
   * Get service statistics
   */
  getStats() {
    const cacheHitRate = this.stats.requests > 0
      ? ((this.stats.cacheHits / this.stats.requests) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      cacheHitRate: `${cacheHitRate}%`,
      cacheSize: this.cache.size(),
      rateLimitStatus: Object.fromEntries(
        CONFIG.providerOrder.map(provider => [
          provider,
          this.rateLimiter.getRemainingRequests(provider)
        ])
      ),
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
    GeocodingService.clearCache();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  DistanceService,
  DistanceCache,
  GeocodingService,
  CONFIG,
};

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

if (require.main === module) {
  (async () => {
    const service = new DistanceService();

    console.log('🚀 Distance Service Test\n');

    // Test 1: Guelph, ON → Buffalo, NY
    console.log('Test 1: Guelph, ON → Buffalo, NY');
    try {
      const result1 = await service.calculateDistance('Guelph, ON, Canada', 'Buffalo, NY, USA');
      console.log('✅ Result:', result1);
    } catch (error) {
      console.error('❌ Error:', error.message);
    }

    console.log('\n---\n');

    // Test 2: Using coordinates
    console.log('Test 2: Using coordinates');
    try {
      const result2 = await service.calculateDistance(
        { lat: 43.5448, lng: -80.2482 }, // Guelph
        { lat: 42.8864, lng: -78.8784 }  // Buffalo
      );
      console.log('✅ Result:', result2);
    } catch (error) {
      console.error('❌ Error:', error.message);
    }

    console.log('\n---\n');

    // Test 3: Batch calculation
    console.log('Test 3: Batch calculation');
    const pairs = [
      { origin: 'Toronto, ON', destination: 'Detroit, MI' },
      { origin: 'Vancouver, BC', destination: 'Seattle, WA' },
      { origin: 'Montreal, QC', destination: 'New York, NY' },
    ];
    try {
      const batchResults = await service.calculateBatch(pairs);
      console.log('✅ Batch Results:', JSON.stringify(batchResults, null, 2));
    } catch (error) {
      console.error('❌ Error:', error.message);
    }

    console.log('\n---\n');

    // Show stats
    console.log('📊 Service Statistics:');
    console.log(JSON.stringify(service.getStats(), null, 2));
  })();
}
