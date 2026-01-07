/**
 * Centralized Costing Hook
 * 
 * Fetches costing rules from the backend database and provides
 * cost calculation functions that use live rates.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from './query';

// ============================================================================
// TYPES
// ============================================================================

export interface CostingRule {
  rule_key: string;
  rule_type: string;
  rule_value: number;
  rate_unit: string;
  description: string;
  is_active: boolean;
  effective_date: string;
}

export interface CostingRulesResponse {
  count: number;
  rules: CostingRule[];
}

export interface CostCalculationRequest {
  order_id?: string;
  trip_id?: string;
  driver_id?: string;
  unit_number?: string;
  miles: number;
  revenue?: number;
  direction?: 'NORTHBOUND' | 'SOUTHBOUND' | 'DOMESTIC';
  origin?: string;
  destination?: string;
  is_round_trip?: boolean;
  border_crossings?: number;
  drop_hooks?: number;
  pickups?: number;
  deliveries?: number;
  week_start?: string;
}

export interface CostBreakdown {
  fixed_weekly: {
    components: Record<string, number>;
    total_weekly: number;
    fixed_cpm: number;
  };
  wage: {
    base_wage_cpm: number;
    benefits_pct: number;
    performance_pct: number;
    safety_pct: number;
    step_pct: number;
    effective_wage_cpm: number;
  };
  rolling: {
    fuel_cpm: number;
    truck_maintenance_cpm: number;
    trailer_maintenance_cpm: number;
    total_rolling_cpm: number;
  };
  accessorials: {
    border_crossings: { count: number; cost_per: number; total: number };
    drop_hooks: { count: number; cost_per: number; total: number };
    pickups: { count: number; cost_per: number; total: number };
    deliveries: { count: number; cost_per: number; total: number };
    accessorial_cpm: number;
  };
}

export interface MarginAnalysis {
  revenue: number;
  total_cost: number;
  gross_margin: number;
  margin_percent: number;
  revenue_per_mile: number;
  cost_per_mile: number;
  margin_per_mile: number;
  status: 'PROFITABLE' | 'BREAK_EVEN' | 'LOSS';
}

export interface CostCalculationResponse {
  cost_id: string;
  order_id?: string;
  total_cost: number;
  total_cpm: number;
  breakdown: CostBreakdown;
  margin_analysis?: MarginAnalysis;
  pricing_suggestions?: {
    break_even_rpm: number;
    target_15_margin_rpm: number;
    target_20_margin_rpm: number;
    recommended_revenue_15: number;
    recommended_revenue_20: number;
  };
  auto_detected_events?: Array<{
    event_code: string;
    event_name: string;
    count: number;
    cost: number;
    reason: string;
  }>;
  calculated_at: string;
}

// ============================================================================
// RATE CACHE (populated from API)
// ============================================================================

export interface CostingRates {
  // Base wages by driver type
  BASE_WAGE_COM: number;
  BASE_WAGE_RNR: number;
  BASE_WAGE_OO_ZONE1: number;
  BASE_WAGE_OO_ZONE2: number;
  BASE_WAGE_OO_ZONE3: number;
  
  // Percentages (stored as decimals, e.g., 0.03 for 3%)
  SAFETY_PCT: number;
  BENEFITS_PCT: number;
  PERF_PCT: number;
  STEP_PCT: number;
  
  // Per-mile costs
  TRK_RM_CPM: number;
  TRL_RM_CPM: number;
  FUEL_CPM_COM: number;
  FUEL_CPM_OO: number;
  FUEL_CPM_RNR: number;
  
  // Per-event costs
  BC_PER: number;
  DH_PER: number;
  PICK_PER: number;
  DEL_PER: number;
  
  // Weekly costs
  MISC_WK: number;
  SGA_WK: number;
  DTOPS_WK: number;
  ISSAC_WK: number;
  PP_WK: number;
  INS_WK: number;
  TRAILER_WK: number;
  
  // Default RPM
  RPM_DEFAULT: number;
}

// Default rates (fallback if API fails)
const DEFAULT_RATES: CostingRates = {
  BASE_WAGE_COM: 0.59,
  BASE_WAGE_RNR: 0.74,
  BASE_WAGE_OO_ZONE1: 1.60,
  BASE_WAGE_OO_ZONE2: 1.55,
  BASE_WAGE_OO_ZONE3: 1.42,
  SAFETY_PCT: 0.03,
  BENEFITS_PCT: 0.20,
  PERF_PCT: 0.03,
  STEP_PCT: 0.03,
  TRK_RM_CPM: 0.08,
  TRL_RM_CPM: 0.03,
  FUEL_CPM_COM: 0.70,
  FUEL_CPM_OO: 0.22,
  FUEL_CPM_RNR: 0.70,
  BC_PER: 15,
  DH_PER: 15,
  PICK_PER: 30,
  DEL_PER: 30,
  MISC_WK: 76.07,
  SGA_WK: 590.91,
  DTOPS_WK: 18.94,
  ISSAC_WK: 31.92,
  PP_WK: 66.49,
  INS_WK: 164.89,
  TRAILER_WK: 284.38,
  RPM_DEFAULT: 2.50,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchCostingRules(): Promise<CostingRulesResponse> {
  // TODO: Create dedicated /api/costing/rules endpoint for costing-specific rules
  // For now, return empty rules - the costing system will use HARDCODED_DEFAULTS
  return { count: 0, rules: [] };
}

async function calculateCostAPI(request: CostCalculationRequest): Promise<CostCalculationResponse> {
  const response = await fetch('/api/master-data/costing/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to calculate cost');
  }
  return response.json();
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch and cache costing rules from the database
 */
export function useCostingRules() {
  return useQuery({
    queryKey: queryKeys.costingRules,
    queryFn: fetchCostingRules,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });
}

/**
 * Hook to calculate cost via the backend API
 */
export function useCalculateCost() {
  return useMutation({
    mutationFn: calculateCostAPI,
  });
}

/**
 * Transform raw costing rules into a typed rates object
 */
export function transformRulesToRates(rules: CostingRule[]): CostingRates {
  const rates = { ...DEFAULT_RATES };
  
  for (const rule of rules) {
    if (!rule.is_active) continue;
    
    const key = `${rule.rule_key}_${rule.rule_type}`;
    const value = Number(rule.rule_value);
    
    switch (key) {
      case 'BASE_WAGE_COM': rates.BASE_WAGE_COM = value; break;
      case 'BASE_WAGE_RNR': rates.BASE_WAGE_RNR = value; break;
      case 'BASE_WAGE_OO_ZONE1': rates.BASE_WAGE_OO_ZONE1 = value; break;
      case 'BASE_WAGE_OO_ZONE2': rates.BASE_WAGE_OO_ZONE2 = value; break;
      case 'BASE_WAGE_OO_ZONE3': rates.BASE_WAGE_OO_ZONE3 = value; break;
      case 'SAFETY_PCT_GLOBAL': rates.SAFETY_PCT = value; break;
      case 'BENEFITS_PCT_GLOBAL': rates.BENEFITS_PCT = value; break;
      case 'PERF_PCT_GLOBAL': rates.PERF_PCT = value; break;
      case 'STEP_PCT_GLOBAL': rates.STEP_PCT = value; break;
      case 'TRK_RM_CPM_GLOBAL': rates.TRK_RM_CPM = value; break;
      case 'TRL_RM_CPM_GLOBAL': rates.TRL_RM_CPM = value; break;
      case 'FUEL_CPM_COM': rates.FUEL_CPM_COM = value; break;
      case 'FUEL_CPM_OO': rates.FUEL_CPM_OO = value; break;
      case 'FUEL_CPM_RNR': rates.FUEL_CPM_RNR = value; break;
      case 'BC_PER_GLOBAL': rates.BC_PER = value; break;
      case 'DH_PER_GLOBAL': rates.DH_PER = value; break;
      case 'PICK_PER_GLOBAL': rates.PICK_PER = value; break;
      case 'DEL_PER_GLOBAL': rates.DEL_PER = value; break;
      case 'MISC_WK_GLOBAL': rates.MISC_WK = value; break;
      case 'SGA_WK_GLOBAL': rates.SGA_WK = value; break;
      case 'DTOPS_WK_GLOBAL': rates.DTOPS_WK = value; break;
      case 'ISSAC_WK_GLOBAL': rates.ISSAC_WK = value; break;
      case 'PP_WK_GLOBAL': rates.PP_WK = value; break;
      case 'INS_WK_GLOBAL': rates.INS_WK = value; break;
      case 'TRAILER_WK_GLOBAL': rates.TRAILER_WK = value; break;
      case 'RPM_DEFAULT_GLOBAL': rates.RPM_DEFAULT = value; break;
    }
  }
  
  return rates;
}

/**
 * Get total weekly overhead from rates
 */
export function getWeeklyOverhead(rates: CostingRates): number {
  return rates.MISC_WK + rates.SGA_WK + rates.DTOPS_WK + 
         rates.ISSAC_WK + rates.PP_WK + rates.INS_WK + rates.TRAILER_WK;
}

/**
 * Get effective wage CPM for a driver type (including benefits markup)
 */
export function getEffectiveWageCPM(
  rates: CostingRates, 
  driverType: 'COM' | 'RNR' | 'OO',
  ooZone?: 'ZONE1' | 'ZONE2' | 'ZONE3'
): number {
  let baseWage: number;
  
  if (driverType === 'OO') {
    switch (ooZone) {
      case 'ZONE1': baseWage = rates.BASE_WAGE_OO_ZONE1; break;
      case 'ZONE2': baseWage = rates.BASE_WAGE_OO_ZONE2; break;
      case 'ZONE3': baseWage = rates.BASE_WAGE_OO_ZONE3; break;
      default: baseWage = rates.BASE_WAGE_OO_ZONE1; break;
    }
  } else if (driverType === 'RNR') {
    baseWage = rates.BASE_WAGE_RNR;
  } else {
    baseWage = rates.BASE_WAGE_COM;
  }
  
  const markup = 1 + rates.BENEFITS_PCT + rates.PERF_PCT + rates.SAFETY_PCT + rates.STEP_PCT;
  return baseWage * markup;
}

/**
 * Get fuel CPM for a driver type
 */
export function getFuelCPM(rates: CostingRates, driverType: 'COM' | 'RNR' | 'OO'): number {
  switch (driverType) {
    case 'OO': return rates.FUEL_CPM_OO;
    case 'RNR': return rates.FUEL_CPM_RNR;
    default: return rates.FUEL_CPM_COM;
  }
}

/**
 * Calculate trip cost using database rates (client-side calculation)
 * For accurate calculations, use useCalculateCost() to call the backend API
 */
export function calculateTripCostWithRates(
  rates: CostingRates,
  driverType: 'COM' | 'RNR' | 'OO',
  miles: number,
  durationDays: number,
  events: { border: number; picks: number; drops: number; dropHooks?: number },
  ooZone?: 'ZONE1' | 'ZONE2' | 'ZONE3'
): {
  totalCost: number;
  totalCPM: number;
  breakdown: {
    fixed: number;
    labor: number;
    fuel: number;
    maintenance: number;
    events: number;
  };
} {
  // Fixed costs (weekly overhead / 7 * days)
  const weeklyOverhead = getWeeklyOverhead(rates);
  const fixedCost = (weeklyOverhead / 7) * durationDays;
  
  // Labor cost
  const effectiveWageCPM = getEffectiveWageCPM(rates, driverType, ooZone);
  const laborCost = effectiveWageCPM * miles;
  
  // Fuel cost
  const fuelCPM = getFuelCPM(rates, driverType);
  const fuelCost = fuelCPM * miles;
  
  // Maintenance cost
  const maintenanceCPM = rates.TRK_RM_CPM + rates.TRL_RM_CPM;
  const maintenanceCost = maintenanceCPM * miles;
  
  // Event costs
  const borderCost = events.border * rates.BC_PER;
  const pickCost = events.picks * rates.PICK_PER;
  const dropCost = events.drops * rates.DEL_PER;
  const dropHookCost = (events.dropHooks || 0) * rates.DH_PER;
  const eventsCost = borderCost + pickCost + dropCost + dropHookCost;
  
  // Total
  const totalCost = fixedCost + laborCost + fuelCost + maintenanceCost + eventsCost;
  const totalCPM = miles > 0 ? totalCost / miles : 0;
  
  return {
    totalCost,
    totalCPM,
    breakdown: {
      fixed: fixedCost,
      labor: laborCost,
      fuel: fuelCost,
      maintenance: maintenanceCost,
      events: eventsCost,
    },
  };
}

// Export default rates for fallback
export { DEFAULT_RATES };
