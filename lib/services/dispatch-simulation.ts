/**
 * Dispatch Simulation Service
 * 
 * Simulates Fleet vs. Brokerage dispatch decisions by evaluating:
 * - Market benchmark rates (brokerage cost)
 * - Direct haul costs (single driver, full route)
 * - Trailer pool scenarios (pre-positioned assets)
 * - Split/staging scenarios (local + highway driver combo)
 */

import { Pool } from 'pg';

// ============================================================================
// TYPES
// ============================================================================

export interface SimulationRequest {
  trip_id: string;
  trip_requirements: {
    weight: number;
    equipment_type: 'Dry Van' | 'Reefer' | 'Flatbed';
  };
  route: RouteStop[];
}

export interface RouteStop {
  type: 'PICKUP' | 'DROP';
  location_id: string;
  address?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  appointment_time?: string;
}

export interface SimulationResponse {
  trip_id: string;
  market_analysis: MarketAnalysis;
  internal_simulation: InternalSimulation;
  recommendation: DispatchRecommendation;
  generated_at: string;
}

export interface MarketAnalysis {
  provider: string;
  lane: string;
  origin_zip: string;
  destination_zip: string;
  equipment_type: string;
  market_rate_avg: number;
  market_rate_low: number;
  market_rate_high: number;
  fuel_surcharge: number;
  accessorials: number;
  total_market_rate: number;
  target_buy_rate: number;
  target_margin_percent: number;
}

export interface InternalSimulation {
  total_trip_distance: number;
  estimated_drive_time_hours: number;
  scenarios: SimulationScenario[];
}

export interface SimulationScenario {
  type: 'DIRECT_HAUL' | 'TRAILER_POOL' | 'SPLIT_STAGING';
  feasible: boolean;
  feasibility_reason?: string;
  resource_match?: ResourceMatch;
  cost_breakdown?: CostBreakdown;
  total_cost?: number;
  margin_vs_market?: number;
  margin_percent?: number;
  recommendation?: 'PREFERRED' | 'VIABLE' | 'NOT_RECOMMENDED';
}

export interface ResourceMatch {
  driver?: {
    id: string;
    name: string;
    category: 'Local' | 'Highway' | 'Team';
    hos_hours_remaining: number;
  };
  unit?: {
    id: string;
    number: string;
    configuration: 'Bobtail' | 'Coupled';
    current_location: string;
  };
  trailer?: {
    id: string;
    number: string;
    type: string;
    location: string;
  };
  local_driver?: {
    id: string;
    name: string;
    hos_hours_remaining: number;
  };
}

export interface CostBreakdown {
  deadhead_miles: number;
  deadhead_cost: number;
  return_deadhead_miles: number;  // Empty return to home base
  return_deadhead_cost: number;   // Cost of empty return
  linehaul_miles: number;
  linehaul_cost: number;
  fuel_cost: number;
  driver_cost: number;
  fixed_daily_cost: number;
  accessorial_cost: number;
  total: number;
}

export interface DispatchRecommendation {
  decision: 'FLEET' | 'BROKERAGE' | 'NEEDS_REVIEW';
  preferred_scenario?: string;
  savings_vs_market: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const COSTING_CONFIG = {
  // Cost per mile rates
  fuel_cost_per_gallon: 4.25,
  mpg_coupled: 6.5,       // Tractor + Trailer
  mpg_bobtail: 8.5,       // Tractor only
  
  // Driver costs
  driver_cpm_highway: 0.52,  // Cost per mile for highway drivers
  driver_cpm_local: 0.48,    // Cost per mile for local drivers
  
  // Fixed costs
  fixed_daily_cost: 185.00,  // Insurance, depreciation, etc.
  
  // Accessorials
  stop_charge: 50.00,        // Per additional stop beyond 2
  detention_per_hour: 75.00,
  
  // Operational parameters
  average_speed_mph: 55,
  hook_unhook_time_hours: 0.5,
  
  // Margin targets
  target_margin_percent: 15,
  minimum_margin_percent: 8,
};

// ============================================================================
// DISPATCH SIMULATION SERVICE
// ============================================================================

export class DispatchSimulationService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Main simulation entry point
   */
  async simulate(request: SimulationRequest): Promise<SimulationResponse> {
    const startTime = Date.now();

    // 1. Calculate route distances
    const routeAnalysis = await this.analyzeRoute(request.route);

    // 2. Get market benchmark
    const marketAnalysis = await this.getMarketBenchmark(
      request.route,
      request.trip_requirements.equipment_type,
      routeAnalysis.totalDistance
    );

    // 3. Get available resources
    const resources = await this.getAvailableResources(
      routeAnalysis.estimatedHours,
      request.trip_requirements.equipment_type
    );

    // 4. Run simulation scenarios
    const scenarios: SimulationScenario[] = [];

    // Scenario A: Direct Haul
    const directHaul = await this.simulateDirectHaul(
      request.route,
      routeAnalysis,
      resources
    );
    scenarios.push(directHaul);

    // Scenario B: Trailer Pool
    const trailerPool = await this.simulateTrailerPool(
      request.route,
      routeAnalysis,
      resources
    );
    scenarios.push(trailerPool);

    // Scenario C: Split/Staging
    const splitStaging = await this.simulateSplitStaging(
      request.route,
      routeAnalysis,
      resources
    );
    scenarios.push(splitStaging);

    // 5. Determine recommendation
    const recommendation = this.determineRecommendation(
      scenarios,
      marketAnalysis
    );

    return {
      trip_id: request.trip_id,
      market_analysis: marketAnalysis,
      internal_simulation: {
        total_trip_distance: routeAnalysis.totalDistance,
        estimated_drive_time_hours: routeAnalysis.estimatedHours,
        scenarios,
      },
      recommendation,
      generated_at: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // ROUTE ANALYSIS
  // ==========================================================================

  private async analyzeRoute(route: RouteStop[]): Promise<{
    totalDistance: number;
    estimatedHours: number;
    segments: Array<{ from: string; to: string; distance: number }>;
  }> {
    const segments: Array<{ from: string; to: string; distance: number }> = [];
    let totalDistance = 0;

    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i];
      const to = route[i + 1];
      
      const distance = await this.calculateDistance(from, to);
      segments.push({
        from: from.city || from.zip || from.location_id,
        to: to.city || to.zip || to.location_id,
        distance,
      });
      totalDistance += distance;
    }

    return {
      totalDistance,
      estimatedHours: totalDistance / COSTING_CONFIG.average_speed_mph,
      segments,
    };
  }

  private async calculateDistance(from: RouteStop, to: RouteStop): Promise<number> {
    // If we have coordinates, use Haversine with road multiplier
    if (from.lat && from.lng && to.lat && to.lng) {
      const straightLine = this.haversineDistance(
        from.lat, from.lng,
        to.lat, to.lng
      );
      return straightLine * 1.3; // Road distance multiplier
    }

    // Otherwise, try to lookup from database or estimate
    if (from.city && to.city) {
      const cached = await this.getCachedDistance(from.city, to.city);
      if (cached) return cached;
    }

    // Default fallback estimate based on zip codes
    return this.estimateDistanceFromZip(from.zip, to.zip);
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private async getCachedDistance(fromCity: string, toCity: string): Promise<number | null> {
    // Check lane_profiles table for cached distance
    try {
      const result = await this.pool.query(`
        SELECT distance_miles FROM lane_profiles 
        WHERE LOWER(origin_city) = LOWER($1) 
        AND LOWER(destination_city) = LOWER($2)
        LIMIT 1
      `, [fromCity, toCity]);
      
      return result.rows[0]?.distance_miles || null;
    } catch {
      return null;
    }
  }

  private estimateDistanceFromZip(fromZip?: string, toZip?: string): number {
    // Simple zip-based estimation (first 3 digits indicate region)
    if (!fromZip || !toZip) return 250; // Default estimate
    
    const fromPrefix = fromZip.substring(0, 3);
    const toPrefix = toZip.substring(0, 3);
    
    // Same region
    if (fromPrefix === toPrefix) return 50;
    
    // Adjacent regions (simplified)
    const prefixDiff = Math.abs(parseInt(fromPrefix) - parseInt(toPrefix));
    return Math.min(50 + prefixDiff * 15, 2500);
  }

  // ==========================================================================
  // MARKET BENCHMARK
  // ==========================================================================

  private async getMarketBenchmark(
    route: RouteStop[],
    equipmentType: string,
    totalDistance: number
  ): Promise<MarketAnalysis> {
    const originStop = route.find(s => s.type === 'PICKUP');
    const destStop = [...route].reverse().find(s => s.type === 'DROP');

    const originZip = originStop?.zip || 'N1H';
    const destZip = destStop?.zip || 'N9A';
    const originCity = originStop?.city || 'Guelph';
    const destCity = destStop?.city || 'Windsor';

    // Try to get live rate from database/API
    const liveRate = await this.getLiveMarketRate(originZip, destZip, equipmentType);
    
    // Calculate base rate per mile for this equipment type
    const baseRpm = this.getBaseRatePerMile(equipmentType);
    
    // Market rate calculation
    const marketRateAvg = liveRate || (totalDistance * baseRpm);
    const marketRateLow = marketRateAvg * 0.85;
    const marketRateHigh = marketRateAvg * 1.20;

    // Fuel surcharge (typically 15-25% of linehaul)
    const fuelSurcharge = marketRateAvg * 0.18;

    // Accessorials for multi-stop
    const extraStops = Math.max(0, route.length - 2);
    const accessorials = extraStops * COSTING_CONFIG.stop_charge;

    const totalMarketRate = marketRateAvg + fuelSurcharge + accessorials;
    const targetBuyRate = totalMarketRate * (1 - COSTING_CONFIG.target_margin_percent / 100);

    return {
      provider: liveRate ? 'LIVE_API' : 'ESTIMATED',
      lane: `${originCity}, ON -> ${destCity}, ON`,
      origin_zip: originZip,
      destination_zip: destZip,
      equipment_type: equipmentType,
      market_rate_avg: Math.round(marketRateAvg * 100) / 100,
      market_rate_low: Math.round(marketRateLow * 100) / 100,
      market_rate_high: Math.round(marketRateHigh * 100) / 100,
      fuel_surcharge: Math.round(fuelSurcharge * 100) / 100,
      accessorials: Math.round(accessorials * 100) / 100,
      total_market_rate: Math.round(totalMarketRate * 100) / 100,
      target_buy_rate: Math.round(targetBuyRate * 100) / 100,
      target_margin_percent: COSTING_CONFIG.target_margin_percent,
    };
  }

  private async getLiveMarketRate(
    originZip: string,
    destZip: string,
    equipmentType: string
  ): Promise<number | null> {
    // Check internal rate index first
    try {
      const result = await this.pool.query(`
        SELECT avg_rate, last_updated 
        FROM market_rate_index 
        WHERE origin_zip = $1 
        AND dest_zip = $2 
        AND equipment_type = $3
        AND last_updated > NOW() - INTERVAL '7 days'
        LIMIT 1
      `, [originZip, destZip, equipmentType]);

      if (result.rows[0]) {
        return result.rows[0].avg_rate;
      }
    } catch {
      // Table may not exist, continue
    }

    // In production, integrate with DAT/FreightWaves API here
    // For now, return null to use estimation
    return null;
  }

  private getBaseRatePerMile(equipmentType: string): number {
    const rates: Record<string, number> = {
      'Dry Van': 2.85,
      'Reefer': 3.25,
      'Flatbed': 3.45,
    };
    return rates[equipmentType] || 2.85;
  }

  // ==========================================================================
  // RESOURCE AVAILABILITY
  // ==========================================================================

  private async getAvailableResources(
    requiredHours: number,
    equipmentType: string
  ): Promise<{
    drivers: Array<{
      id: string;
      name: string;
      category: string;
      hos_hours_remaining: number;
      current_location: string;
      available_at: Date;
    }>;
    units: Array<{
      id: string;
      number: string;
      configuration: string;
      current_location_id: string;
      current_location: string;
      fuel_consumption: number;
    }>;
    trailers: Array<{
      id: string;
      number: string;
      type: string;
      status: string;
      location_id: string;
      location: string;
    }>;
    trailerPools: Array<{
      location_id: string;
      location_name: string;
      pool_count_empty: number;
    }>;
  }> {
    // Get available drivers with sufficient HOS
    // Note: driver_profiles uses driver_id, driver_name, driver_category
    const driversResult = await this.pool.query(`
      SELECT 
        dp.driver_id as id,
        dp.driver_name as name,
        COALESCE(dp.driver_category, 'Highway') as category,
        COALESCE(dp.hos_hours_remaining, 11) as hos_hours_remaining,
        'Home Base - Guelph' as current_location,
        dp.available_to_start_at
      FROM driver_profiles dp
      WHERE dp.is_active = true
      AND COALESCE(dp.hos_hours_remaining, 11) >= $1
      ORDER BY dp.hos_hours_remaining DESC
    `, [requiredHours]);

    // Get available units
    // Note: unit_profiles uses unit_id, unit_number, current_location_id
    const unitsResult = await this.pool.query(`
      SELECT 
        up.unit_id as id,
        up.unit_number as number,
        COALESCE(up.current_configuration, 'Bobtail') as configuration,
        up.current_location_id,
        COALESCE(c.name, 'Home Base - Guelph') as current_location,
        COALESCE(up.avg_fuel_consumption, 6.5) as fuel_consumption
      FROM unit_profiles up
      LEFT JOIN customers c ON up.current_location_id = c.customer_id
      WHERE up.is_active = true
      ORDER BY up.unit_number
    `);

    // Get available trailers of the required type
    // Note: trailers uses trailer_id, unit_number (as trailer number), type
    const trailersResult = await this.pool.query(`
      SELECT 
        t.trailer_id as id,
        t.unit_number as number,
        t.type,
        t.status,
        t.current_location_id as location_id,
        COALESCE(c.name, 'Unknown') as location
      FROM trailers t
      LEFT JOIN customers c ON t.current_location_id = c.customer_id
      WHERE t.status IN ('Available', 'Loaded')
      AND t.type = $1
      ORDER BY t.status, t.unit_number
    `, [equipmentType]);

    // Get locations with trailer pools
    // Note: customers uses customer_id
    const poolsResult = await this.pool.query(`
      SELECT 
        customer_id as location_id,
        name as location_name,
        COALESCE(pool_count_empty, 0) as pool_count_empty
      FROM customers
      WHERE has_trailer_pool = true
      AND COALESCE(pool_count_empty, 0) > 0
    `);

    return {
      drivers: driversResult.rows,
      units: unitsResult.rows,
      trailers: trailersResult.rows,
      trailerPools: poolsResult.rows,
    };
  }

  // ==========================================================================
  // SCENARIO A: DIRECT HAUL
  // ==========================================================================

  private async simulateDirectHaul(
    route: RouteStop[],
    routeAnalysis: { totalDistance: number; estimatedHours: number },
    resources: Awaited<ReturnType<typeof this.getAvailableResources>>
  ): Promise<SimulationScenario> {
    // Find a highway driver with sufficient HOS
    const eligibleDriver = resources.drivers.find(
      d => d.category === 'Highway' && d.hos_hours_remaining >= routeAnalysis.estimatedHours
    );

    if (!eligibleDriver) {
      return {
        type: 'DIRECT_HAUL',
        feasible: false,
        feasibility_reason: 'No highway driver available with sufficient HOS hours',
      };
    }

    // Find an available unit
    const eligibleUnit = resources.units[0];
    if (!eligibleUnit) {
      return {
        type: 'DIRECT_HAUL',
        feasible: false,
        feasibility_reason: 'No units available at home base',
      };
    }

    // Find a trailer (if unit is bobtail)
    let trailer: typeof resources.trailers[0] | undefined;
    if (eligibleUnit.configuration === 'Bobtail') {
      trailer = resources.trailers.find(t => t.status === 'Available');
      if (!trailer) {
        return {
          type: 'DIRECT_HAUL',
          feasible: false,
          feasibility_reason: 'No available trailer for bobtail unit',
        };
      }
    }

    // Calculate deadhead distance (home base to first pickup)
    const firstPickup = route.find(s => s.type === 'PICKUP');
    const lastDrop = [...route].reverse().find(s => s.type === 'DROP');
    
    const deadheadMiles = await this.calculateDeadhead(
      eligibleUnit.current_location,
      firstPickup
    );

    // Calculate return deadhead (last drop back to home base)
    const returnDeadheadMiles = await this.calculateDeadhead(
      lastDrop,
      { city: 'Guelph', lat: 43.5448, lng: -80.2482 } // Home base
    );

    // Calculate costs (including return deadhead)
    const costBreakdown = this.calculateCosts(
      deadheadMiles,
      routeAnalysis.totalDistance,
      returnDeadheadMiles,
      eligibleUnit.fuel_consumption,
      'Highway',
      routeAnalysis.estimatedHours
    );

    return {
      type: 'DIRECT_HAUL',
      feasible: true,
      resource_match: {
        driver: {
          id: eligibleDriver.id,
          name: eligibleDriver.name,
          category: eligibleDriver.category as 'Highway',
          hos_hours_remaining: eligibleDriver.hos_hours_remaining,
        },
        unit: {
          id: eligibleUnit.id,
          number: eligibleUnit.number,
          configuration: eligibleUnit.configuration as 'Bobtail' | 'Coupled',
          current_location: eligibleUnit.current_location,
        },
        trailer: trailer ? {
          id: trailer.id,
          number: trailer.number,
          type: trailer.type,
          location: trailer.location,
        } : undefined,
      },
      cost_breakdown: costBreakdown,
      total_cost: costBreakdown.total,
    };
  }

  // ==========================================================================
  // SCENARIO B: TRAILER POOL
  // ==========================================================================

  private async simulateTrailerPool(
    route: RouteStop[],
    routeAnalysis: { totalDistance: number; estimatedHours: number },
    resources: Awaited<ReturnType<typeof this.getAvailableResources>>
  ): Promise<SimulationScenario> {
    const firstPickup = route.find(s => s.type === 'PICKUP');
    
    // Check if first pickup location has a trailer pool
    const pickupPool = resources.trailerPools.find(
      p => p.location_name.toLowerCase().includes(firstPickup?.city?.toLowerCase() || '')
    );

    if (!pickupPool || pickupPool.pool_count_empty === 0) {
      return {
        type: 'TRAILER_POOL',
        feasible: false,
        feasibility_reason: 'No trailer pool available at pickup location',
      };
    }

    // Find a highway driver
    const eligibleDriver = resources.drivers.find(
      d => d.category === 'Highway' && d.hos_hours_remaining >= routeAnalysis.estimatedHours
    );

    if (!eligibleDriver) {
      return {
        type: 'TRAILER_POOL',
        feasible: false,
        feasibility_reason: 'No highway driver available with sufficient HOS hours',
      };
    }

    // Find a bobtail unit (we'll run without trailer to pickup)
    const bobtailUnit = resources.units.find(u => u.configuration === 'Bobtail');
    if (!bobtailUnit) {
      return {
        type: 'TRAILER_POOL',
        feasible: false,
        feasibility_reason: 'No bobtail unit available',
      };
    }

    // Calculate deadhead (bobtail gets better MPG)
    const deadheadMiles = await this.calculateDeadhead(
      bobtailUnit.current_location,
      firstPickup
    );

    // Calculate return deadhead (last drop back to home base) - bobtail return
    const lastDrop = [...route].reverse().find(s => s.type === 'DROP');
    const returnDeadheadMiles = await this.calculateDeadhead(
      lastDrop,
      { city: 'Guelph', lat: 43.5448, lng: -80.2482 } // Home base
    );

    // Bobtail has better fuel efficiency for deadhead
    const deadheadCost = (deadheadMiles / COSTING_CONFIG.mpg_bobtail) * COSTING_CONFIG.fuel_cost_per_gallon;
    const returnDeadheadCost = (returnDeadheadMiles / COSTING_CONFIG.mpg_bobtail) * COSTING_CONFIG.fuel_cost_per_gallon;
    
    // Linehaul cost (coupled after pickup)
    const linehaulFuelCost = (routeAnalysis.totalDistance / COSTING_CONFIG.mpg_coupled) * COSTING_CONFIG.fuel_cost_per_gallon;
    
    // Driver cost includes return deadhead
    const totalDriverMiles = deadheadMiles + routeAnalysis.totalDistance + returnDeadheadMiles;
    const driverCost = totalDriverMiles * COSTING_CONFIG.driver_cpm_highway;
    
    // Fixed costs - include return time
    const returnHours = returnDeadheadMiles / COSTING_CONFIG.average_speed_mph;
    const totalTripHours = routeAnalysis.estimatedHours + returnHours;
    const tripDays = Math.ceil(totalTripHours / 11);
    const fixedCost = tripDays * COSTING_CONFIG.fixed_daily_cost;

    const totalCost = deadheadCost + returnDeadheadCost + linehaulFuelCost + driverCost + fixedCost;

    return {
      type: 'TRAILER_POOL',
      feasible: true,
      feasibility_reason: `Using trailer pool at ${pickupPool.location_name} (${pickupPool.pool_count_empty} available)`,
      resource_match: {
        driver: {
          id: eligibleDriver.id,
          name: eligibleDriver.name,
          category: eligibleDriver.category as 'Highway',
          hos_hours_remaining: eligibleDriver.hos_hours_remaining,
        },
        unit: {
          id: bobtailUnit.id,
          number: bobtailUnit.number,
          configuration: 'Bobtail',
          current_location: bobtailUnit.current_location,
        },
      },
      cost_breakdown: {
        deadhead_miles: deadheadMiles,
        deadhead_cost: Math.round(deadheadCost * 100) / 100,
        return_deadhead_miles: returnDeadheadMiles,
        return_deadhead_cost: Math.round(returnDeadheadCost * 100) / 100,
        linehaul_miles: routeAnalysis.totalDistance,
        linehaul_cost: Math.round(linehaulFuelCost * 100) / 100,
        fuel_cost: Math.round((deadheadCost + returnDeadheadCost + linehaulFuelCost) * 100) / 100,
        driver_cost: Math.round(driverCost * 100) / 100,
        fixed_daily_cost: Math.round(fixedCost * 100) / 100,
        accessorial_cost: 0,
        total: Math.round(totalCost * 100) / 100,
      },
      total_cost: Math.round(totalCost * 100) / 100,
    };
  }

  // ==========================================================================
  // SCENARIO C: SPLIT/STAGING
  // ==========================================================================

  private async simulateSplitStaging(
    route: RouteStop[],
    routeAnalysis: { totalDistance: number; estimatedHours: number },
    resources: Awaited<ReturnType<typeof this.getAvailableResources>>
  ): Promise<SimulationScenario> {
    // Find a local driver for first leg
    const localDriver = resources.drivers.find(d => d.category === 'Local');
    
    if (!localDriver) {
      return {
        type: 'SPLIT_STAGING',
        feasible: false,
        feasibility_reason: 'No local driver available for first leg',
      };
    }

    // Find a highway driver for main haul
    const highwayDriver = resources.drivers.find(
      d => d.category === 'Highway' && d.hos_hours_remaining >= routeAnalysis.estimatedHours * 0.8
    );

    if (!highwayDriver) {
      return {
        type: 'SPLIT_STAGING',
        feasible: false,
        feasibility_reason: 'No highway driver available for main haul',
      };
    }

    // Find available unit and trailer
    const unit = resources.units[0];
    const trailer = resources.trailers.find(t => t.status === 'Available');

    if (!unit || !trailer) {
      return {
        type: 'SPLIT_STAGING',
        feasible: false,
        feasibility_reason: 'Insufficient equipment for split operation',
      };
    }

    // Split calculation: Local driver does first pickup to yard
    const firstPickup = route.find(s => s.type === 'PICKUP');
    const lastDrop = [...route].reverse().find(s => s.type === 'DROP');
    const localLegMiles = await this.calculateDeadhead(unit.current_location, firstPickup) + 30; // Pickup + return to yard
    const mainHaulMiles = routeAnalysis.totalDistance;
    
    // Return deadhead for highway driver (last drop back to home base)
    const returnDeadheadMiles = await this.calculateDeadhead(
      lastDrop,
      { city: 'Guelph', lat: 43.5448, lng: -80.2482 } // Home base
    );

    // Costs
    const localDriverCost = localLegMiles * COSTING_CONFIG.driver_cpm_local;
    const localFuelCost = (localLegMiles / COSTING_CONFIG.mpg_coupled) * COSTING_CONFIG.fuel_cost_per_gallon;
    
    // Highway driver cost includes return deadhead
    const highwayTotalMiles = mainHaulMiles + returnDeadheadMiles;
    const highwayDriverCost = highwayTotalMiles * COSTING_CONFIG.driver_cpm_highway;
    const highwayFuelCost = (mainHaulMiles / COSTING_CONFIG.mpg_coupled) * COSTING_CONFIG.fuel_cost_per_gallon;
    const returnFuelCost = (returnDeadheadMiles / COSTING_CONFIG.mpg_bobtail) * COSTING_CONFIG.fuel_cost_per_gallon;
    
    // Fixed costs - include return time
    const returnHours = returnDeadheadMiles / COSTING_CONFIG.average_speed_mph;
    const totalTripHours = routeAnalysis.estimatedHours + returnHours;
    const tripDays = Math.ceil(totalTripHours / 11);
    const fixedCost = tripDays * COSTING_CONFIG.fixed_daily_cost;

    const totalCost = localDriverCost + localFuelCost + highwayDriverCost + highwayFuelCost + returnFuelCost + fixedCost;

    return {
      type: 'SPLIT_STAGING',
      feasible: true,
      feasibility_reason: 'Local driver handles pickup, Highway driver takes main haul',
      resource_match: {
        driver: {
          id: highwayDriver.id,
          name: highwayDriver.name,
          category: 'Highway',
          hos_hours_remaining: highwayDriver.hos_hours_remaining,
        },
        local_driver: {
          id: localDriver.id,
          name: localDriver.name,
          hos_hours_remaining: localDriver.hos_hours_remaining,
        },
        unit: {
          id: unit.id,
          number: unit.number,
          configuration: unit.configuration as 'Bobtail' | 'Coupled',
          current_location: unit.current_location,
        },
        trailer: {
          id: trailer.id,
          number: trailer.number,
          type: trailer.type,
          location: trailer.location,
        },
      },
      cost_breakdown: {
        deadhead_miles: localLegMiles,
        deadhead_cost: Math.round((localDriverCost + localFuelCost) * 100) / 100,
        return_deadhead_miles: returnDeadheadMiles,
        return_deadhead_cost: Math.round(returnFuelCost * 100) / 100,
        linehaul_miles: mainHaulMiles,
        linehaul_cost: Math.round((highwayDriverCost + highwayFuelCost) * 100) / 100,
        fuel_cost: Math.round((localFuelCost + highwayFuelCost + returnFuelCost) * 100) / 100,
        driver_cost: Math.round((localDriverCost + highwayDriverCost) * 100) / 100,
        fixed_daily_cost: Math.round(fixedCost * 100) / 100,
        accessorial_cost: 0,
        total: Math.round(totalCost * 100) / 100,
      },
      total_cost: Math.round(totalCost * 100) / 100,
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private async calculateDeadhead(
    currentLocation: string | RouteStop | undefined,
    firstStop?: RouteStop | { city?: string; lat?: number; lng?: number }
  ): Promise<number> {
    if (!firstStop) return 0;
    if (!currentLocation) return 50;

    // Normalize currentLocation to a city string
    const originCity = typeof currentLocation === 'string' 
      ? currentLocation.toLowerCase()
      : (currentLocation.city?.toLowerCase() || '');

    // Try to get from database first
    const cached = await this.getCachedDistance(originCity, firstStop.city || '');
    if (cached) return cached;

    // Default estimates based on location
    if (originCity.includes('guelph') || originCity.includes('home base')) {
      const estimates: Record<string, number> = {
        'kitchener': 25,
        'cambridge': 30,
        'toronto': 95,
        'brampton': 70,
        'milton': 55,
        'burlington': 60,
        'vaughan': 85,
        'markham': 100,
        'windsor': 280,
        'columbus': 450,    // Columbus, OH from Guelph
        'detroit': 250,
        'buffalo': 160,
        'montreal': 550,
        'chicago': 520,
      };
      
      const destCity = firstStop.city?.toLowerCase() || '';
      for (const [key, dist] of Object.entries(estimates)) {
        if (destCity.includes(key)) return dist;
      }
    }
    
    // Reverse lookup - if firstStop is Guelph (home base), estimate from origin city
    if (firstStop?.city?.toLowerCase().includes('guelph') || 
        (firstStop?.lat && Math.abs(firstStop.lat - 43.5448) < 0.5)) {
      const estimates: Record<string, number> = {
        'kitchener': 25,
        'cambridge': 30,
        'toronto': 95,
        'brampton': 70,
        'milton': 55,
        'burlington': 60,
        'vaughan': 85,
        'markham': 100,
        'windsor': 280,
        'columbus': 450,
        'detroit': 250,
        'buffalo': 160,
        'montreal': 550,
        'chicago': 520,
      };
      
      for (const [key, dist] of Object.entries(estimates)) {
        if (originCity.includes(key)) return dist;
      }
    }

    return 50; // Default deadhead estimate
  }

  private calculateCosts(
    deadheadMiles: number,
    linehaulMiles: number,
    returnDeadheadMiles: number,  // Empty return to home base
    mpg: number,
    driverCategory: 'Local' | 'Highway',
    estimatedHours: number
  ): CostBreakdown {
    const totalMiles = deadheadMiles + linehaulMiles + returnDeadheadMiles;
    
    // Fuel costs - return is typically bobtail (better MPG)
    const mpgBobtail = COSTING_CONFIG.mpg_bobtail;
    const deadheadFuelCost = (deadheadMiles / mpg) * COSTING_CONFIG.fuel_cost_per_gallon;
    const linehaulFuelCost = (linehaulMiles / mpg) * COSTING_CONFIG.fuel_cost_per_gallon;
    const returnFuelCost = (returnDeadheadMiles / mpgBobtail) * COSTING_CONFIG.fuel_cost_per_gallon;
    const fuelCost = deadheadFuelCost + linehaulFuelCost + returnFuelCost;

    // Driver costs (paid for all miles including return)
    const driverCpm = driverCategory === 'Highway' 
      ? COSTING_CONFIG.driver_cpm_highway 
      : COSTING_CONFIG.driver_cpm_local;
    const driverCost = totalMiles * driverCpm;

    // Fixed daily costs - include return time
    const returnHours = returnDeadheadMiles / COSTING_CONFIG.average_speed_mph;
    const totalTripHours = estimatedHours + returnHours;
    const tripDays = Math.ceil(totalTripHours / 11); // 11 hour driving limit
    const fixedCost = tripDays * COSTING_CONFIG.fixed_daily_cost;

    const total = fuelCost + driverCost + fixedCost;

    return {
      deadhead_miles: Math.round(deadheadMiles * 10) / 10,
      deadhead_cost: Math.round(deadheadFuelCost * 100) / 100,
      return_deadhead_miles: Math.round(returnDeadheadMiles * 10) / 10,
      return_deadhead_cost: Math.round(returnFuelCost * 100) / 100,
      linehaul_miles: Math.round(linehaulMiles * 10) / 10,
      linehaul_cost: Math.round(linehaulFuelCost * 100) / 100,
      fuel_cost: Math.round(fuelCost * 100) / 100,
      driver_cost: Math.round(driverCost * 100) / 100,
      fixed_daily_cost: Math.round(fixedCost * 100) / 100,
      accessorial_cost: 0,
      total: Math.round(total * 100) / 100,
    };
  }

  private determineRecommendation(
    scenarios: SimulationScenario[],
    marketAnalysis: MarketAnalysis
  ): DispatchRecommendation {
    const feasibleScenarios = scenarios.filter(s => s.feasible && s.total_cost);
    
    if (feasibleScenarios.length === 0) {
      return {
        decision: 'BROKERAGE',
        savings_vs_market: 0,
        confidence: 'HIGH',
        reasoning: [
          'No feasible internal execution scenarios',
          'Recommend farming out to carrier partner',
          `Target buy rate: $${marketAnalysis.target_buy_rate.toFixed(2)}`,
        ],
      };
    }

    // Calculate margins for each scenario
    for (const scenario of feasibleScenarios) {
      scenario.margin_vs_market = marketAnalysis.total_market_rate - scenario.total_cost!;
      scenario.margin_percent = (scenario.margin_vs_market / marketAnalysis.total_market_rate) * 100;
      
      if (scenario.margin_percent >= COSTING_CONFIG.target_margin_percent) {
        scenario.recommendation = 'PREFERRED';
      } else if (scenario.margin_percent >= COSTING_CONFIG.minimum_margin_percent) {
        scenario.recommendation = 'VIABLE';
      } else {
        scenario.recommendation = 'NOT_RECOMMENDED';
      }
    }

    // Find best scenario
    const bestScenario = feasibleScenarios.reduce((best, current) => 
      (current.margin_vs_market || 0) > (best.margin_vs_market || 0) ? current : best
    );

    const reasoning: string[] = [];
    let decision: 'FLEET' | 'BROKERAGE' | 'NEEDS_REVIEW' = 'FLEET';
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';

    if (bestScenario.margin_percent! >= COSTING_CONFIG.target_margin_percent) {
      decision = 'FLEET';
      confidence = 'HIGH';
      reasoning.push(`${bestScenario.type} achieves ${bestScenario.margin_percent!.toFixed(1)}% margin`);
      reasoning.push(`Savings vs market: $${bestScenario.margin_vs_market!.toFixed(2)}`);
      reasoning.push(`Internal cost: $${bestScenario.total_cost!.toFixed(2)}`);
    } else if (bestScenario.margin_percent! >= COSTING_CONFIG.minimum_margin_percent) {
      decision = 'FLEET';
      confidence = 'MEDIUM';
      reasoning.push(`${bestScenario.type} achieves ${bestScenario.margin_percent!.toFixed(1)}% margin (below target)`);
      reasoning.push('Consider brokerage if market softens');
    } else {
      decision = 'BROKERAGE';
      confidence = 'MEDIUM';
      reasoning.push('Internal execution margin below minimum threshold');
      reasoning.push(`Best internal cost: $${bestScenario.total_cost!.toFixed(2)}`);
      reasoning.push(`Target buy rate: $${marketAnalysis.target_buy_rate.toFixed(2)}`);
    }

    return {
      decision,
      preferred_scenario: bestScenario.type,
      savings_vs_market: Math.round(bestScenario.margin_vs_market! * 100) / 100,
      confidence,
      reasoning,
    };
  }
}
