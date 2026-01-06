/**
 * Costing Library
 * 
 * This module provides cost calculation functions for the fleet management system.
 * All rates are fetched from the centralized costing_rules database table via API.
 * 
 * For React components, use the useCostingRules() hook from lib/use-costing.ts
 * For server-side or non-React contexts, use the sync functions with pre-fetched rates.
 */

import {
  type CostingRates,
  DEFAULT_RATES,
  calculateTripCostWithRates,
  getEffectiveWageCPM,
  getFuelCPM,
  getWeeklyOverhead,
} from './use-costing';

// Re-export types and utilities from use-costing
export { DEFAULT_RATES, getWeeklyOverhead, getEffectiveWageCPM, getFuelCPM };
export type { CostingRates };

// ============================================================================
// TYPES
// ============================================================================

export type DriverType = 'COM' | 'RNR' | 'OO';
export type HaulType = 'short' | 'long';
export type OOZone = 'zone1' | 'zone2' | 'zone3';

export interface MileageCosts {
  wage: number;
  fuel: number;
  benefits: number;
  performance: number;
  safety: number;
  step: number;
  truckMaint: number;
  trailerMaint: number;
  rolling: number;
  subtotal: number;
}

export interface EventCosts {
  pickupCost: number;
  deliveryCost: number;
  borderCost: number;
  dropHookCost: number;
  subtotal: number;
}

export interface WeeklyOverhead {
  insurance: number;
  trailerLease: number;
  sga: number;
  dispatchOps: number;
  prepass: number;
  isaacEld: number;
  miscellaneous: number;
  dailyTotal: number;
}

export interface TripCost {
  mileageCosts: MileageCosts;
  eventCosts: EventCosts;
  weeklyOverhead?: WeeklyOverhead;
  directTripCost: number;
  fullyAllocatedCost: number;
  recommendedRevenue: number;
  totalCPM: number;
}

export interface TripCostResult {
  totalCost: number;
  breakdown: {
    fixed: number;
    labor: number;
    fuel: number;
    maintenance: number;
    events: number;
  };
  metadata: {
    costPerMile: number;
    marginAnalysis: string;
  };
}

// ============================================================================
// BORDER CROSSING DETECTION
// ============================================================================

/**
 * Detect if trip crosses USA/Canada border
 */
export function isCrossBorder(pickupLocation: string, deliveryLocation: string): boolean {
  const pickup = pickupLocation?.toLowerCase() || '';
  const delivery = deliveryLocation?.toLowerCase() || '';
  
  const canadaKeywords = ['canada', 'ontario', 'quebec', 'qc', 'on', 'bc', 'alberta', 'manitoba', 'saskatchewan'];
  const usaKeywords = ['usa', 'united states', 'michigan', 'ohio', 'new york', 'illinois', 'pennsylvania', 'washington'];
  
  const pickupIsCanada = canadaKeywords.some(k => pickup.includes(k));
  const pickupIsUSA = usaKeywords.some(k => pickup.includes(k));
  const deliveryIsCanada = canadaKeywords.some(k => delivery.includes(k));
  const deliveryIsUSA = usaKeywords.some(k => delivery.includes(k));
  
  return (pickupIsCanada && deliveryIsUSA) || (pickupIsUSA && deliveryIsCanada);
}

/**
 * Determine OO zone based on distance
 */
export function getOOZone(miles: number): 'ZONE1' | 'ZONE2' | 'ZONE3' {
  if (miles < 700) return 'ZONE1';
  if (miles <= 2200) return 'ZONE2';
  return 'ZONE3';
}

// ============================================================================
// COST CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate total trip cost using database rates
 * 
 * @param driverType - Driver type (COM, RNR, OO)
 * @param distance - Trip distance in miles
 * @param pickupLocation - Pickup location string (for border detection)
 * @param deliveryLocation - Delivery location string (for border detection)
 * @param options - Additional options
 * @param rates - Costing rates (use DEFAULT_RATES if not provided)
 */
export function calculateTripCost(
  driverType: DriverType,
  distance: number,
  pickupLocation: string = '',
  deliveryLocation: string = '',
  options: {
    pickups?: number;
    deliveries?: number;
    dropHooks?: number;
    includeOverhead?: boolean;
    truckWk?: number;
  } = {},
  rates: CostingRates = DEFAULT_RATES
): TripCost {
  const {
    pickups = 1,
    deliveries = 1,
    dropHooks = 0,
    includeOverhead = false,
  } = options;
  
  const borderCrossings = isCrossBorder(pickupLocation, deliveryLocation) ? 1 : 0;
  
  // Determine OO zone based on distance
  const ooZone = driverType === 'OO' ? getOOZone(distance) : undefined;
  
  // Estimate duration (50mph average)
  const durationHours = distance / 50;
  const durationDays = Math.max(durationHours / 24, 0.5); // Minimum half day

  // Calculate using centralized rates
  const result = calculateTripCostWithRates(
    rates,
    driverType,
    distance,
    durationDays,
    { border: borderCrossings, picks: pickups, drops: deliveries, dropHooks },
    ooZone
  );

  // Get base wage for breakdown
  let baseWageRate: number;
  if (driverType === 'OO') {
    switch (ooZone) {
      case 'ZONE1': baseWageRate = rates.BASE_WAGE_OO_ZONE1; break;
      case 'ZONE2': baseWageRate = rates.BASE_WAGE_OO_ZONE2; break;
      case 'ZONE3': baseWageRate = rates.BASE_WAGE_OO_ZONE3; break;
      default: baseWageRate = rates.BASE_WAGE_OO_ZONE1; break;
    }
  } else if (driverType === 'RNR') {
    baseWageRate = rates.BASE_WAGE_RNR;
  } else {
    baseWageRate = rates.BASE_WAGE_COM;
  }

  const baseWage = distance * baseWageRate;
  
  // Calculate individual benefit components
  const benefits = baseWage * rates.BENEFITS_PCT;
  const performance = baseWage * rates.PERF_PCT;
  const safety = baseWage * rates.SAFETY_PCT;
  const step = baseWage * rates.STEP_PCT;
  
  // Maintenance breakdown
  const truckMaint = distance * rates.TRK_RM_CPM;
  const trailerMaint = distance * rates.TRL_RM_CPM;

  // Build mileage costs breakdown
  const mileageCosts: MileageCosts = {
    wage: baseWage, 
    fuel: result.breakdown.fuel,
    benefits,
    performance,
    safety,
    step,
    truckMaint,
    trailerMaint,
    rolling: 0,
    subtotal: baseWage + benefits + performance + safety + step + result.breakdown.fuel + truckMaint + trailerMaint,
  };

  // Build event costs breakdown
  const eventCosts: EventCosts = {
    pickupCost: pickups * rates.PICK_PER,
    deliveryCost: deliveries * rates.DEL_PER,
    borderCost: borderCrossings * rates.BC_PER,
    dropHookCost: dropHooks * rates.DH_PER,
    subtotal: result.breakdown.events,
  };

  // Build weekly overhead breakdown
  const weeklyOverhead: WeeklyOverhead | undefined = includeOverhead ? {
    insurance: rates.INS_WK / 7 * durationDays,
    trailerLease: rates.TRAILER_WK / 7 * durationDays,
    sga: rates.SGA_WK / 7 * durationDays,
    dispatchOps: rates.DTOPS_WK / 7 * durationDays,
    prepass: rates.PP_WK / 7 * durationDays,
    isaacEld: rates.ISSAC_WK / 7 * durationDays,
    miscellaneous: rates.MISC_WK / 7 * durationDays,
    dailyTotal: getWeeklyOverhead(rates) / 7,
  } : undefined;

  // Calculate totals
  const totalMileageCost = mileageCosts.subtotal;
  const totalEventCost = eventCosts.subtotal;
  const totalFixedCost = includeOverhead ? result.breakdown.fixed : 0;
  
  const calculatedDirectCost = totalMileageCost + totalEventCost;
  const calculatedTotalCost = calculatedDirectCost + totalFixedCost;

  return {
    mileageCosts,
    eventCosts,
    weeklyOverhead,
    directTripCost: calculatedDirectCost,
    fullyAllocatedCost: calculatedTotalCost,
    recommendedRevenue: calculatedTotalCost * 1.22, // 22% margin target
    totalCPM: distance > 0 ? calculatedTotalCost / distance : 0,
  };
}

/**
 * Calculate trip cost for a specific OO zone
 */
function calculateTripCostWithZone(
  zone: OOZone,
  distance: number,
  pickupLocation: string = '',
  deliveryLocation: string = '',
  options: {
    pickups?: number;
    deliveries?: number;
    dropHooks?: number;
  } = {},
  rates: CostingRates = DEFAULT_RATES
): TripCost {
  return calculateTripCost('OO', distance, pickupLocation, deliveryLocation, options, rates);
}

/**
 * Get all 5 costing options for a trip (for comparison on booking page)
 * 
 * @param distance - Trip distance in miles
 * @param pickupLocation - Pickup location string
 * @param deliveryLocation - Delivery location string
 * @param options - Additional options
 * @param rates - Costing rates (use DEFAULT_RATES if not provided)
 */
export function getAllCostingOptions(
  distance: number,
  pickupLocation: string = '',
  deliveryLocation: string = '',
  options: {
    pickups?: number;
    deliveries?: number;
    dropHooks?: number;
  } = {},
  rates: CostingRates = DEFAULT_RATES
): Array<{ driverType: DriverType; label: string; zone?: string; cost: TripCost }> {
  return [
    {
      driverType: 'OO',
      label: 'Owner Operator - Zone 1 (<700mi)',
      zone: 'zone1',
      cost: calculateTripCostWithZone('zone1', distance, pickupLocation, deliveryLocation, options, rates),
    },
    {
      driverType: 'OO',
      label: 'Owner Operator - Zone 2 (700-2200mi)',
      zone: 'zone2',
      cost: calculateTripCostWithZone('zone2', distance, pickupLocation, deliveryLocation, options, rates),
    },
    {
      driverType: 'OO',
      label: 'Owner Operator - Zone 3 (2200+mi)',
      zone: 'zone3',
      cost: calculateTripCostWithZone('zone3', distance, pickupLocation, deliveryLocation, options, rates),
    },
    {
      driverType: 'COM',
      label: 'Company Driver',
      cost: calculateTripCost('COM', distance, pickupLocation, deliveryLocation, options, rates),
    },
    {
      driverType: 'RNR',
      label: 'Rental Driver',
      cost: calculateTripCost('RNR', distance, pickupLocation, deliveryLocation, options, rates),
    },
  ];
}

/**
 * Estimate distance between two locations using the distance API
 * Returns null if estimation fails
 */
export async function estimateDistance(
  origin: string,
  destination: string
): Promise<{ miles: number; durationHours: number } | null> {
  try {
    const response = await fetch('/api/distance/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination }),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      miles: data.miles || data.distance_miles,
      durationHours: data.duration_hours || (data.duration_minutes / 60),
    };
  } catch {
    return null;
  }
}

/**
 * Haversine distance calculation (fallback when API unavailable)
 * Returns approximate road distance (straight-line * 1.3 factor)
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  
  // Apply road factor (roads are typically 1.2-1.4x longer than straight line)
  return straightLine * 1.3;
}
