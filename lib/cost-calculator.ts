// import { PrismaClient } from '@prisma/client';

// 1. Data Structure (Interfaces based on Prisma Models)

export interface Driver {
  id: string;
  name: string;
  type: 'COM' | 'RNR' | 'OO';
  truckWk: number;
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

// 2. Business Logic & Constants

// Fallback Constants
const GLOBAL_WEEKLY_OVERHEAD = 1233.60; // Sum of SGA, Insurance, Trailer, Misc/Tech
const MAINTENANCE_PER_MILE = 0.11; // $0.08 Truck + $0.03 Trailer

const FUEL_COST_PER_MILE = {
  COM: 0.70,
  RNR: 0.70,
  OO: 0.22,
};

const BASE_WAGE_PER_MILE = {
  COM: 0.59,
  RNR: 0.74,
  // OO is dynamic based on zones
};

const LABOR_MARKUP = 1.29; // Universal 29% markup for all driver types

const EVENT_COSTS = {
  BORDER: 15.00,
  PICK_DROP: 30.00,
};

/**
 * Calculates the trip cost based on driver type, miles, duration, and events.
 * 
 * @param driver The Driver object (containing type and truckWk cost).
 * @param miles Number (Trip distance).
 * @param durationDays Number (Trip time).
 * @param events Object { border: number, picks: number, drops: number }.
 * @returns Detailed cost object.
 */
export function calculateTripCost(
  driver: Driver,
  miles: number,
  durationDays: number,
  events: TripEvents
): TripCostResult {
  
  // A. FIXED COSTS (Time-based)
  // (Global Weekly + Driver Truck Weekly) / 7 * durationDays
  const dailyFixedCost = (GLOBAL_WEEKLY_OVERHEAD + (driver.truckWk || 0)) / 7;
  const fixedCost = dailyFixedCost * durationDays;

  // B. VARIABLE COSTS (Mile-based)
  
  // Maintenance
  const maintenanceCost = miles * MAINTENANCE_PER_MILE;

  // Fuel
  const fuelRate = FUEL_COST_PER_MILE[driver.type] || 0;
  const fuelCost = miles * fuelRate;

  // Labor (Wage)
  let baseWageRate = 0;
  
  if (driver.type === 'OO') {
    // Dynamic OO Zones
    if (miles < 700) {
      baseWageRate = 1.60; // Zone 1
    } else if (miles <= 2200) {
      baseWageRate = 1.55; // Zone 2
    } else {
      baseWageRate = 1.42; // Zone 3
    }
  } else {
    // Standard rates for COM/RNR
    baseWageRate = BASE_WAGE_PER_MILE[driver.type as keyof typeof BASE_WAGE_PER_MILE] || 0;
  }

  // Universal Labor Loading (Benefits/Safety)
  const laborCost = miles * baseWageRate * LABOR_MARKUP;

  // C. EVENT COSTS
  const borderCost = events.border * EVENT_COSTS.BORDER;
  const pickDropCost = (events.picks + events.drops) * EVENT_COSTS.PICK_DROP;
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
