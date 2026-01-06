/**
 * Cost Calculator
 * 
 * Low-level cost calculation functions using rates from the costing_rules database.
 * For React components, use useCostingRules() hook and calculateTripCostWithRates().
 * 
 * This file provides fallback constants for when the API is unavailable.
 */

import { DEFAULT_RATES, type CostingRates } from './use-costing';

// 1. Data Structure (Interfaces)

export interface Driver {
  id: string;
  name: string;
  type: 'COM' | 'RNR' | 'OO';
  truckWk: number;
  ooZone?: 'ZONE1' | 'ZONE2' | 'ZONE3';
}

export interface CostConstants {
  key: string;
  value: number;
}

export interface TripEvents {
  border: number;
  picks: number;
  drops: number;
}

export interface CostBreakdown {
  fixed: number;
  labor: number;
  fuel: number;
  maintenance: number;
  events: number;
}

export interface CostMetadata {
  costPerMile: number;
  marginAnalysis: string;
}

export interface TripCostResult {
  totalCost: number;
  breakdown: CostBreakdown;
  metadata: CostMetadata;
}

// 2. Business Logic - Use rates from database with fallbacks

/**
 * Get weekly overhead total from rates
 */
function getWeeklyOverhead(rates: CostingRates): number {
  return rates.MISC_WK + rates.SGA_WK + rates.DTOPS_WK + 
         rates.ISSAC_WK + rates.PP_WK + rates.INS_WK + rates.TRAILER_WK;
}

/**
 * Get base wage rate for driver type
 */
function getBaseWageRate(
  driverType: 'COM' | 'RNR' | 'OO',
  miles: number,
  rates: CostingRates,
  ooZone?: 'ZONE1' | 'ZONE2' | 'ZONE3'
): number {
  if (driverType === 'OO') {
    // Dynamic OO Zones based on miles if zone not specified
    const zone = ooZone || (miles < 700 ? 'ZONE1' : miles <= 2200 ? 'ZONE2' : 'ZONE3');
    switch (zone) {
      case 'ZONE1': return rates.BASE_WAGE_OO_ZONE1;
      case 'ZONE2': return rates.BASE_WAGE_OO_ZONE2;
      case 'ZONE3': return rates.BASE_WAGE_OO_ZONE3;
    }
  } else if (driverType === 'RNR') {
    return rates.BASE_WAGE_RNR;
  }
  return rates.BASE_WAGE_COM;
}

/**
 * Get fuel cost per mile for driver type
 */
function getFuelRate(driverType: 'COM' | 'RNR' | 'OO', rates: CostingRates): number {
  switch (driverType) {
    case 'OO': return rates.FUEL_CPM_OO;
    case 'RNR': return rates.FUEL_CPM_RNR;
    default: return rates.FUEL_CPM_COM;
  }
}

/**
 * Get labor markup multiplier (benefits + performance + safety + step)
 */
function getLaborMarkup(rates: CostingRates): number {
  return 1 + rates.BENEFITS_PCT + rates.PERF_PCT + rates.SAFETY_PCT + rates.STEP_PCT;
}

/**
 * Calculates the trip cost based on driver type, miles, duration, and events.
 * Uses rates from the costing_rules database (pass rates parameter).
 * 
 * @param driver The Driver object (containing type and truckWk cost).
 * @param miles Number (Trip distance).
 * @param durationDays Number (Trip time in days).
 * @param events Object { border: number, picks: number, drops: number }.
 * @param rates Optional CostingRates from database (defaults to DEFAULT_RATES).
 * @returns Detailed cost object.
 */
export function calculateTripCost(
  driver: Driver,
  miles: number,
  durationDays: number,
  events: TripEvents,
  rates: CostingRates = DEFAULT_RATES
): TripCostResult {
  
  // A. FIXED COSTS (Time-based)
  // (Global Weekly + Driver Truck Weekly) / 7 * durationDays
  const weeklyOverhead = getWeeklyOverhead(rates);
  const dailyFixedCost = (weeklyOverhead + (driver.truckWk || 0)) / 7;
  const fixedCost = dailyFixedCost * durationDays;

  // B. VARIABLE COSTS (Mile-based)
  
  // Maintenance (from database rates)
  const maintenanceRate = rates.TRK_RM_CPM + rates.TRL_RM_CPM;
  const maintenanceCost = miles * maintenanceRate;

  // Fuel (from database rates)
  const fuelRate = getFuelRate(driver.type, rates);
  const fuelCost = miles * fuelRate;

  // Labor (Wage) with universal loading
  const baseWageRate = getBaseWageRate(driver.type, miles, rates, driver.ooZone);
  const laborMarkup = getLaborMarkup(rates);
  const laborCost = miles * baseWageRate * laborMarkup;

  // C. EVENT COSTS (from database rates)
  const borderCost = events.border * rates.BC_PER;
  const pickDropCost = (events.picks * rates.PICK_PER) + (events.drops * rates.DEL_PER);
  const eventsCost = borderCost + pickDropCost;

  // Total Cost
  const totalCost = fixedCost + maintenanceCost + fuelCost + laborCost + eventsCost;

  // Metadata
  const costPerMile = miles > 0 ? totalCost / miles : 0;
  const marginAnalysis = costPerMile > 2.50 ? "High Cost" : "Standard";

  return {
    totalCost,
    breakdown: {
      fixed: fixedCost,
      labor: laborCost,
      fuel: fuelCost,
      maintenance: maintenanceCost,
      events: eventsCost,
    },
    metadata: {
      costPerMile,
      marginAnalysis,
    },
  };
}

// Legacy constants for backward compatibility (use database rates instead)
export const GLOBAL_WEEKLY_OVERHEAD = getWeeklyOverhead(DEFAULT_RATES);
export const MAINTENANCE_PER_MILE = DEFAULT_RATES.TRK_RM_CPM + DEFAULT_RATES.TRL_RM_CPM;

export const FUEL_COST_PER_MILE = {
  COM: DEFAULT_RATES.FUEL_CPM_COM,
  RNR: DEFAULT_RATES.FUEL_CPM_RNR,
  OO: DEFAULT_RATES.FUEL_CPM_OO,
};

export const BASE_WAGE_PER_MILE = {
  COM: DEFAULT_RATES.BASE_WAGE_COM,
  RNR: DEFAULT_RATES.BASE_WAGE_RNR,
};

export const LABOR_MARKUP = getLaborMarkup(DEFAULT_RATES);

export const EVENT_COSTS = {
  BORDER: DEFAULT_RATES.BC_PER,
  PICK_DROP: DEFAULT_RATES.PICK_PER, // Pick and Del have same cost
};
