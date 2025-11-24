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

