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
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to get route optimization');
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
