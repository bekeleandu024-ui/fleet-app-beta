import axios from 'axios';

const MASTER_DATA_URL = process.env.MASTER_DATA_URL || 'http://master-data:4001';

export interface CostRequest {
  order_id: string;
  driver_id?: string;
  unit_number?: string;
  miles: number;
  direction?: string;
  is_round_trip?: boolean;
  origin?: string;
  destination?: string;
  order_type?: string;
  border_crossings?: number;
  drop_hooks?: number;
  pickups?: number;
  deliveries?: number;
  revenue?: number;
  week_start?: Date;
}

export interface CostResponse {
  cost_id: string;
  order_id: string;
  total_cost: number;
  total_cpm: number;
  breakdown: any;
  margin_analysis?: any;
  pricing_suggestions?: any;
  auto_detected_events: any[];
  calculation_formula: any;
  calculated_at: Date;
}

/**
 * Calculate cost for an order by calling master-data costing API
 */
export async function calculateOrderCost(request: CostRequest): Promise<CostResponse> {
  try {
    const response = await axios.post(`${MASTER_DATA_URL}/api/costing/calculate`, request, {
      timeout: 10000, // 10 second timeout
    });
    return response.data;
  } catch (error: any) {
    console.error('Error calling costing API:', error.message);
    throw new Error(`Failed to calculate cost: ${error.message}`);
  }
}

/**
 * Get cost breakdown for an order
 */
export async function getCostBreakdown(orderId: string): Promise<any> {
  try {
    const response = await axios.get(`${MASTER_DATA_URL}/api/costing/breakdown/${orderId}`, {
      timeout: 5000,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error getting cost breakdown:', error.message);
    throw new Error(`Failed to get cost breakdown: ${error.message}`);
  }
}

/**
 * Update actual costs after trip completion
 */
export async function updateActualCost(
  orderId: string,
  actualMiles: number,
  actualCost: number
): Promise<void> {
  try {
    await axios.patch(
      `${MASTER_DATA_URL}/api/costing/actual/${orderId}`,
      { actual_miles: actualMiles, actual_cost: actualCost },
      { timeout: 5000 }
    );
  } catch (error: any) {
    console.error('Error updating actual costs:', error.message);
    throw new Error(`Failed to update actual costs: ${error.message}`);
  }
}
