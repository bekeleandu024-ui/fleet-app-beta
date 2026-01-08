/**
 * AI Service - Integrates Claude AI for route optimization and recommendations
 */

export interface RouteOptimization {
  recommendation: string;
  totalDistance: number;
  estimatedTime: string;
  borderCrossings: number;
  estimatedCost: number;
  driverRecommendations: DriverRecommendation[];
  costComparison: CostComparison[];
  insights: string[];
}

export interface DriverRecommendation {
  driverId: string;
  driverName: string;
  unit: string;
  driverType: 'COM' | 'RNR' | 'OO';
  weeklyCost: number;
  baseWage: number;
  fuelRate: number;
  reason: string;
  estimatedCost: number;
  totalCpm: number;
}

export interface CostComparison {
  type: string;
  driver: string;
  weeklyCost: number;
  estimatedCost: number;
  pros: string[];
  cons: string[];
}

/**
 * Get AI-powered route optimization and driver recommendations
 */
export async function getRouteOptimization(params: {
  origin: string;
  destination: string;
  orderId?: string;
  miles?: number;
  revenue?: number;
}): Promise<RouteOptimization> {
  try {
    const response = await fetch('/api/ai/route-optimization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: params.origin,
        destination: params.destination,
        orderId: params.orderId,
        miles: params.miles,
        revenue: params.revenue,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get route optimization');
    }

    return await response.json();
  } catch (error) {
    console.error('AI service error:', error);
    throw error;
  }
}

/**
 * Get AI insights for an order
 */
export async function getOrderInsights(orderId: string): Promise<{
  recommendation: string;
  driverSuggestion: DriverRecommendation | null;
  costAnalysis: string;
  risks: string[];
  opportunities: string[];
}> {
  try {
    const response = await fetch(`/api/ai/order-insights/${orderId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get order insights');
    }

    return await response.json();
  } catch (error) {
    console.error('AI service error:', error);
    throw error;
  }
}

/**
 * Get AI-powered dispatch recommendation
 */
export async function getDispatchRecommendation(params: {
  orderId: string;
  availableDrivers?: string[];
}): Promise<{
  recommendedDriver: DriverRecommendation;
  alternatives: DriverRecommendation[];
  reasoning: string;
}> {
  try {
    const response = await fetch('/api/ai/dispatch-recommendation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to get dispatch recommendation');
    }

    return await response.json();
  } catch (error) {
    console.error('AI service error:', error);
    throw error;
  }
}

/**
 * Get AI insights for a trip
 */
export async function getTripInsights(tripId: string): Promise<{
  recommendation: string;
  currentAssignment: {
    driver: string;
    driverType: string;
    unit: string;
    effectiveRate: number;
    estimatedCost: number;
  };
  alternativeDrivers: DriverRecommendation[];
  costAnalysis: {
    linehaulCost: number;
    fuelCost: number;
    totalCost: number;
    recommendedRevenue: number;
    margin: number;
    driverCost: number;
  };
  routeOptimization: {
    distance: number;
    duration: string;
    fuelStops: string[];
    warnings: string[];
  };
  insights: string[];
}> {
  try {
    const response = await fetch(`/api/ai/trip-insights/${tripId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get trip insights');
    }

    return await response.json();
  } catch (error) {
    console.error('AI service error:', error);
    throw error;
  }
}

// ============================================================================
// BATCH DISPATCH RECOMMENDATIONS
// ============================================================================

export interface BatchRecommendation {
  id: string;
  type: "consolidate" | "assign" | "alert" | "brokerage";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: {
    savings: string | null;
    miles_saved: number | null;
    utilization: string | null;
  };
  orders: string[];
  suggested_driver: {
    id: string;
    name: string;
    reason: string;
  } | null;
  suggested_unit: {
    id: string;
    type: string;
  } | null;
  urgency_hours: number | null;
  action: "create_trip" | "assign_driver" | "kick_to_brokerage" | "prioritize";
}

export interface BatchRecommendationsResponse {
  recommendations: BatchRecommendation[];
  summary: {
    total_recommendations: number;
    potential_savings: string;
    orders_analyzed: number;
    consolidation_opportunities: number;
  };
  message?: string;
}

export interface BatchDispatchOrder {
  id: string;
  status: string;
  customer: string;
  type?: string;
  origin: string;
  destination: string;
  pickup_date: string;
  delivery_date: string | null;
  equipment: string;
  weight: number;
  rate: number;
}

export interface BatchDispatchDriver {
  id: string;
  name: string;
  status: string;
  location: string;
  hours_available: number;
  equipment_access: string[];
  type: "COM" | "OO" | "RNR";
  performance?: {
    on_time_rate: number;
    acceptance_rate: number;
  };
}

export interface BatchDispatchUnit {
  id: string;
  type: string;
  status: string;
  location: string;
  capacity_lbs: number;
}

/**
 * Get AI-powered batch dispatch recommendations
 * 
 * @param params - Optional data to analyze. If not provided, fetches from database.
 * @param params.orders - Array of orders to analyze
 * @param params.drivers - Array of available drivers
 * @param params.units - Array of available units
 * @param params.capacityStatus - Fleet capacity status ("normal" | "constrained" | "critical")
 * 
 * @returns Recommendations for order consolidation, driver assignments, alerts, and brokerage decisions
 * 
 * @example
 * // Fetch recommendations using database data
 * const recommendations = await getBatchDispatchRecommendations();
 * 
 * @example
 * // Provide custom data
 * const recommendations = await getBatchDispatchRecommendations({
 *   orders: myOrders,
 *   drivers: myDrivers,
 *   units: myUnits,
 *   capacityStatus: 'constrained'
 * });
 */
export async function getBatchDispatchRecommendations(params?: {
  orders?: BatchDispatchOrder[];
  drivers?: BatchDispatchDriver[];
  units?: BatchDispatchUnit[];
  capacityStatus?: "normal" | "constrained" | "critical";
}): Promise<BatchRecommendationsResponse> {
  try {
    const response = await fetch('/api/ai/dispatch-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get dispatch recommendations');
    }

    return await response.json();
  } catch (error) {
    console.error('AI service error:', error);
    throw error;
  }
}

/**
 * Get dispatch recommendations using a simple GET request (uses database data)
 * 
 * @param capacityStatus - Optional fleet capacity status
 */
export async function getDispatchRecommendationsSimple(
  capacityStatus?: "normal" | "constrained" | "critical"
): Promise<BatchRecommendationsResponse> {
  try {
    const url = new URL('/api/ai/dispatch-recommendations', window.location.origin);
    if (capacityStatus) {
      url.searchParams.set('capacityStatus', capacityStatus);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get dispatch recommendations');
    }

    return await response.json();
  } catch (error) {
    console.error('AI service error:', error);
    throw error;
  }
}

