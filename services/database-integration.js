/**
 * Database Integration for Distance Service
 * 
 * Provides database integration layer for distance calculations
 * including caching, trip updates, and batch processing.
 */

const { Pool } = require('pg');
const { DistanceService } = require('./distance-service');

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

class DatabaseConnection {
  constructor(config = {}) {
    this.pool = new Pool({
      host: config.host || process.env.DB_HOST || 'localhost',
      port: config.port || process.env.DB_PORT || 5432,
      database: config.database || process.env.DB_NAME || 'fleet_management',
      user: config.user || process.env.DB_USER || 'postgres',
      password: config.password || process.env.DB_PASSWORD || '',
      max: config.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log(`Query executed in ${duration}ms`);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  async close() {
    await this.pool.end();
  }
}

// ============================================================================
// DATABASE DISTANCE SERVICE
// ============================================================================

class DatabaseDistanceService {
  constructor(dbConfig = {}) {
    this.db = new DatabaseConnection(dbConfig);
    this.distanceService = new DistanceService();
  }

  /**
   * Calculate and store distance for a trip
   * @param {string} tripId - Trip UUID
   * @returns {Promise<object>} Calculation result
   */
  async calculateTripDistance(tripId) {
    try {
      // Get trip details
      const tripQuery = `
        SELECT 
          id,
          pickup_location,
          dropoff_location,
          pickup_lat,
          pickup_lng,
          dropoff_lat,
          dropoff_lng,
          distance_miles
        FROM trips
        WHERE id = $1
      `;
      
      const tripResult = await this.db.query(tripQuery, [tripId]);
      
      if (tripResult.rows.length === 0) {
        throw new Error(`Trip ${tripId} not found`);
      }
      
      const trip = tripResult.rows[0];
      
      // Check if locations exist
      if (!trip.pickup_location || !trip.dropoff_location) {
        throw new Error('Pickup and dropoff locations are required');
      }
      
      // Try to get from database cache first
      const cached = await this.getCachedDistance(
        trip.pickup_location,
        trip.dropoff_location
      );
      
      let distanceResult;
      
      if (cached) {
        distanceResult = cached;
        console.log('Using database cached distance');
      } else {
        // Calculate using distance service
        const origin = trip.pickup_lat && trip.pickup_lng
          ? { lat: parseFloat(trip.pickup_lat), lng: parseFloat(trip.pickup_lng) }
          : trip.pickup_location;
        
        const destination = trip.dropoff_lat && trip.dropoff_lng
          ? { lat: parseFloat(trip.dropoff_lat), lng: parseFloat(trip.dropoff_lng) }
          : trip.dropoff_location;
        
        distanceResult = await this.distanceService.calculateDistance(origin, destination);
        
        // Store in database cache
        await this.cacheDistance(
          trip.pickup_location,
          trip.dropoff_location,
          trip.pickup_lat,
          trip.pickup_lng,
          trip.dropoff_lat,
          trip.dropoff_lng,
          distanceResult
        );
      }
      
      // Update trip with distance
      await this.updateTripDistance(tripId, distanceResult);
      
      return {
        tripId,
        ...distanceResult,
        updated: true,
      };
    } catch (error) {
      console.error(`Error calculating distance for trip ${tripId}:`, error);
      throw error;
    }
  }

  /**
   * Get cached distance from database
   */
  async getCachedDistance(origin, destination) {
    try {
      const result = await this.db.query(
        'SELECT * FROM get_cached_distance($1, $2)',
        [origin, destination]
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          distanceMiles: parseFloat(row.distance_miles),
          durationHours: parseFloat(row.duration_hours),
          provider: row.provider,
          cached: true,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached distance:', error);
      return null;
    }
  }

  /**
   * Cache distance in database
   */
  async cacheDistance(origin, destination, originLat, originLng, destLat, destLng, distanceResult) {
    try {
      await this.db.query(
        `SELECT cache_distance_calculation($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          origin,
          destination,
          originLat,
          originLng,
          destLat,
          destLng,
          distanceResult.distanceMiles,
          distanceResult.durationHours,
          distanceResult.distanceKm || null,
          distanceResult.durationMinutes || null,
          distanceResult.provider,
          null, // route_data
        ]
      );
    } catch (error) {
      console.error('Error caching distance:', error);
      // Don't throw - caching is optional
    }
  }

  /**
   * Update trip with calculated distance
   */
  async updateTripDistance(tripId, distanceResult) {
    const updateQuery = `
      UPDATE trips
      SET 
        distance_miles = $1,
        duration_hours = $2,
        distance_calculated_at = NOW(),
        distance_calculation_provider = $3,
        distance_calculation_method = 'api',
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await this.db.query(updateQuery, [
      distanceResult.distanceMiles,
      distanceResult.durationHours,
      distanceResult.provider,
      tripId,
    ]);
    
    return result.rows[0];
  }

  /**
   * Calculate distances for all trips missing distance data
   * @param {object} options - Processing options
   * @returns {Promise<object>} Processing results
   */
  async calculateMissingDistances(options = {}) {
    const batchSize = options.batchSize || 50;
    const limit = options.limit || null;
    
    try {
      // Get trips without distance
      const query = `
        SELECT id, pickup_location, dropoff_location
        FROM trips
        WHERE distance_miles IS NULL
          AND pickup_location IS NOT NULL
          AND dropoff_location IS NOT NULL
        ORDER BY created_at DESC
        ${limit ? `LIMIT ${limit}` : ''}
      `;
      
      const result = await this.db.query(query);
      const trips = result.rows;
      
      console.log(`Found ${trips.length} trips without distance data`);
      
      const results = {
        total: trips.length,
        successful: 0,
        failed: 0,
        errors: [],
      };
      
      // Process in batches to avoid overwhelming the system
      for (let i = 0; i < trips.length; i += batchSize) {
        const batch = trips.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(trips.length / batchSize)}`);
        
        await Promise.allSettled(
          batch.map(async (trip) => {
            try {
              await this.calculateTripDistance(trip.id);
              results.successful++;
            } catch (error) {
              results.failed++;
              results.errors.push({
                tripId: trip.id,
                error: error.message,
              });
            }
          })
        );
        
        // Small delay between batches to respect rate limits
        if (i + batchSize < trips.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error calculating missing distances:', error);
      throw error;
    }
  }

  /**
   * Recalculate distance for a specific trip (force refresh)
   * @param {string} tripId - Trip UUID
   * @returns {Promise<object>} Calculation result
   */
  async recalculateTripDistance(tripId) {
    try {
      // Get trip details
      const tripQuery = `
        SELECT 
          id,
          pickup_location,
          dropoff_location,
          pickup_lat,
          pickup_lng,
          dropoff_lat,
          dropoff_lng
        FROM trips
        WHERE id = $1
      `;
      
      const tripResult = await this.db.query(tripQuery, [tripId]);
      
      if (tripResult.rows.length === 0) {
        throw new Error(`Trip ${tripId} not found`);
      }
      
      const trip = tripResult.rows[0];
      
      if (!trip.pickup_location || !trip.dropoff_location) {
        throw new Error('Pickup and dropoff locations are required');
      }
      
      // Force recalculation (bypass cache)
      const origin = trip.pickup_lat && trip.pickup_lng
        ? { lat: parseFloat(trip.pickup_lat), lng: parseFloat(trip.pickup_lng) }
        : trip.pickup_location;
      
      const destination = trip.dropoff_lat && trip.dropoff_lng
        ? { lat: parseFloat(trip.dropoff_lat), lng: parseFloat(trip.dropoff_lng) }
        : trip.dropoff_location;
      
      // Clear service cache for this route
      this.distanceService.cache.cache.clear();
      
      const distanceResult = await this.distanceService.calculateDistance(origin, destination);
      
      // Update database cache
      await this.cacheDistance(
        trip.pickup_location,
        trip.dropoff_location,
        trip.pickup_lat,
        trip.pickup_lng,
        trip.dropoff_lat,
        trip.dropoff_lng,
        distanceResult
      );
      
      // Update trip
      await this.updateTripDistance(tripId, distanceResult);
      
      return {
        tripId,
        ...distanceResult,
        recalculated: true,
      };
    } catch (error) {
      console.error(`Error recalculating distance for trip ${tripId}:`, error);
      throw error;
    }
  }

  /**
   * Get distance cache statistics
   */
  async getCacheStats() {
    try {
      const result = await this.db.query('SELECT * FROM v_distance_cache_stats');
      const dbStats = result.rows[0] || {};
      
      const serviceStats = this.distanceService.getStats();
      
      return {
        database: {
          totalEntries: parseInt(dbStats.total_entries || 0),
          activeEntries: parseInt(dbStats.active_entries || 0),
          expiredEntries: parseInt(dbStats.expired_entries || 0),
          totalHits: parseInt(dbStats.total_hits || 0),
          avgHitsPerEntry: parseFloat(dbStats.avg_hits_per_entry || 0).toFixed(2),
          maxHits: parseInt(dbStats.max_hits || 0),
          providersUsed: parseInt(dbStats.providers_used || 0),
          entriesByProvider: dbStats.entries_by_provider || {},
        },
        service: serviceStats,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      throw error;
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupCache() {
    try {
      const result = await this.db.query('SELECT * FROM cleanup_expired_distance_cache()');
      return {
        deletedCount: parseInt(result.rows[0].deleted_count || 0),
      };
    } catch (error) {
      console.error('Error cleaning up cache:', error);
      throw error;
    }
  }

  /**
   * Get trips missing distance data
   */
  async getTripsMissingDistance(limit = 100) {
    try {
      const result = await this.db.query(
        'SELECT * FROM v_trips_missing_distance LIMIT $1',
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting trips missing distance:', error);
      throw error;
    }
  }

  /**
   * Batch calculate distances for multiple origin-destination pairs
   */
  async batchCalculateDistances(pairs) {
    return await this.distanceService.calculateBatch(pairs);
  }

  /**
   * Close database connection
   */
  async close() {
    await this.db.close();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  DatabaseDistanceService,
  DatabaseConnection,
};

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

if (require.main === module) {
  (async () => {
    const dbService = new DatabaseDistanceService();

    console.log('🚀 Database Distance Service Test\n');

    try {
      // Example 1: Get cache stats
      console.log('📊 Cache Statistics:');
      const stats = await dbService.getCacheStats();
      console.log(JSON.stringify(stats, null, 2));
      
      console.log('\n---\n');

      // Example 2: Get trips missing distance
      console.log('📋 Trips Missing Distance:');
      const missingTrips = await dbService.getTripsMissingDistance(5);
      console.log(`Found ${missingTrips.length} trips without distance`);
      console.log(JSON.stringify(missingTrips, null, 2));
      
      console.log('\n---\n');

      // Example 3: Calculate missing distances (limited to 10 for testing)
      console.log('⚙️ Calculating Missing Distances:');
      const calcResults = await dbService.calculateMissingDistances({ limit: 10, batchSize: 5 });
      console.log(JSON.stringify(calcResults, null, 2));
      
      console.log('\n---\n');

      // Example 4: Clean up cache
      console.log('🧹 Cleaning Up Cache:');
      const cleanupResult = await dbService.cleanupCache();
      console.log(JSON.stringify(cleanupResult, null, 2));

    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      await dbService.close();
    }
  })();
}
