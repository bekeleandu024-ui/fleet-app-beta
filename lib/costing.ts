// Core costing logic for fleet management system

export type DriverType = 'COM' | 'RNR' | 'OO';
export type HaulType = 'short' | 'long';
export type OOZone = 'zone1' | 'zone2' | 'zone3';

export interface CostingRates {
  wage: number;
  fuel: number;
  truckMaint: number;
  trailerMaint: number;
  benefits?: number;
  performance?: number;
  safety?: number;
  step?: number;
}

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

// Fixed event costs
const EVENT_COSTS = {
  pickup: 30,
  delivery: 30,
  borderCrossing: 15,
  dropHook: 15,
};

// Weekly overhead costs
const WEEKLY_OVERHEAD = {
  insurance: 450,
  trailerLease: 250,
  sga: 180,
  dispatchOps: 120,
  prepass: 25,
  isaacEld: 35,
  miscellaneous: 75,
};

// Costing rates by driver type and distance
const COSTING_RATES: Record<DriverType, Record<string, CostingRates>> = {
  COM: {
    short: {
      wage: 0.45,
      fuel: 0.45,
      truckMaint: 0.12,
      trailerMaint: 0.04,
      benefits: 0.12,
      performance: 0.05,
      safety: 0.03,
      step: 0.02,
    },
    long: {
      wage: 0.45,
      fuel: 0.45,
      truckMaint: 0.12,
      trailerMaint: 0.04,
      benefits: 0.12,
      performance: 0.05,
      safety: 0.03,
      step: 0.02,
    },
  },
  RNR: {
    short: {
      wage: 0.38,
      fuel: 0.42,
      truckMaint: 0.12,
      trailerMaint: 0.04,
      benefits: 0.12,
      performance: 0.05,
      safety: 0.03,
      step: 0.02,
    },
    long: {
      wage: 0.38,
      fuel: 0.42,
      truckMaint: 0.12,
      trailerMaint: 0.04,
      benefits: 0.12,
      performance: 0.05,
      safety: 0.03,
      step: 0.02,
    },
  },
  OO: {
    zone1: {
      wage: 0.72,
      fuel: 0.50,
      truckMaint: 0.12,
      trailerMaint: 0.04,
    },
    zone2: {
      wage: 0.68,
      fuel: 0.50,
      truckMaint: 0.12,
      trailerMaint: 0.04,
    },
    zone3: {
      wage: 0.65,
      fuel: 0.50,
      truckMaint: 0.12,
      trailerMaint: 0.04,
    },
  },
};

/**
 * Determine OO zone based on distance
 */
export function getOOZone(distance: number): OOZone {
  if (distance < 500) return 'zone1';
  if (distance <= 1500) return 'zone2';
  return 'zone3';
}

/**
 * Determine haul type based on distance
 */
export function getHaulType(distance: number): HaulType {
  return distance < 500 ? 'short' : 'long';
}

/**
 * Get per-mile rates based on driver type and distance
 */
export function getCostingRates(driverType: DriverType, distance: number): CostingRates {
  if (driverType === 'OO') {
    const zone = getOOZone(distance);
    return COSTING_RATES.OO[zone];
  }
  
  const haulType = getHaulType(distance);
  return COSTING_RATES[driverType][haulType];
}

/**
 * Calculate mileage-based costs
 */
export function calculateMileageCosts(driverType: DriverType, distance: number): MileageCosts {
  const rates = getCostingRates(driverType, distance);
  
  const wage = rates.wage * distance;
  const fuel = rates.fuel * distance;
  const truckMaint = rates.truckMaint * distance;
  const trailerMaint = rates.trailerMaint * distance;
  
  // Calculate benefits/bonuses (COM/RNR only)
  const benefits = rates.benefits ? wage * rates.benefits : 0;
  const performance = rates.performance ? wage * rates.performance : 0;
  const safety = rates.safety ? wage * rates.safety : 0;
  const step = rates.step ? wage * rates.step : 0;
  const rolling = benefits + performance + safety + step;
  
  const subtotal = wage + fuel + truckMaint + trailerMaint + rolling;
  
  return {
    wage,
    fuel,
    benefits,
    performance,
    safety,
    step,
    truckMaint,
    trailerMaint,
    rolling,
    subtotal,
  };
}

/**
 * Calculate event-based costs
 */
export function calculateEventCosts(
  pickups: number = 1,
  deliveries: number = 1,
  borderCrossings: number = 0,
  dropHooks: number = 0
): EventCosts {
  const pickupCost = pickups * EVENT_COSTS.pickup;
  const deliveryCost = deliveries * EVENT_COSTS.delivery;
  const borderCost = borderCrossings * EVENT_COSTS.borderCrossing;
  const dropHookCost = dropHooks * EVENT_COSTS.dropHook;
  const subtotal = pickupCost + deliveryCost + borderCost + dropHookCost;
  
  return {
    pickupCost,
    deliveryCost,
    borderCost,
    dropHookCost,
    subtotal,
  };
}

/**
 * Calculate weekly overhead allocation
 */
export function calculateWeeklyOverhead(): WeeklyOverhead {
  const dailyTotal = Object.values(WEEKLY_OVERHEAD).reduce((sum, val) => sum + val, 0) / 7;
  
  return {
    insurance: WEEKLY_OVERHEAD.insurance / 7,
    trailerLease: WEEKLY_OVERHEAD.trailerLease / 7,
    sga: WEEKLY_OVERHEAD.sga / 7,
    dispatchOps: WEEKLY_OVERHEAD.dispatchOps / 7,
    prepass: WEEKLY_OVERHEAD.prepass / 7,
    isaacEld: WEEKLY_OVERHEAD.isaacEld / 7,
    miscellaneous: WEEKLY_OVERHEAD.miscellaneous / 7,
    dailyTotal,
  };
}

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
 * Calculate total trip cost
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
  } = {}
): TripCost {
  const {
    pickups = 1,
    deliveries = 1,
    dropHooks = 0,
    includeOverhead = false,
  } = options;
  
  const borderCrossings = isCrossBorder(pickupLocation, deliveryLocation) ? 1 : 0;
  
  const mileageCosts = calculateMileageCosts(driverType, distance);
  const eventCosts = calculateEventCosts(pickups, deliveries, borderCrossings, dropHooks);
  const weeklyOverhead = includeOverhead ? calculateWeeklyOverhead() : undefined;
  
  const directTripCost = mileageCosts.subtotal + eventCosts.subtotal;
  const fullyAllocatedCost = directTripCost + (weeklyOverhead?.dailyTotal || 0);
  const recommendedRevenue = fullyAllocatedCost * 1.22; // 18% margin
  const totalCPM = distance > 0 ? directTripCost / distance : 0;
  
  return {
    mileageCosts,
    eventCosts,
    weeklyOverhead,
    directTripCost,
    fullyAllocatedCost,
    recommendedRevenue,
    totalCPM,
  };
}

/**
 * Calculate trip cost using specific OO zone rates (for comparison cards)
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
  } = {}
): TripCost {
  const {
    pickups = 1,
    deliveries = 1,
    dropHooks = 0,
  } = options;
  
  const borderCrossings = isCrossBorder(pickupLocation, deliveryLocation) ? 1 : 0;
  const rates = COSTING_RATES.OO[zone];
  
  // Calculate mileage costs using specific zone rates
  const wage = distance * rates.wage;
  const fuel = distance * rates.fuel;
  const truckMaint = distance * rates.truckMaint;
  const trailerMaint = distance * rates.trailerMaint;
  
  const mileageCosts: MileageCosts = {
    wage,
    fuel,
    benefits: 0,
    performance: 0,
    safety: 0,
    step: 0,
    truckMaint,
    trailerMaint,
    rolling: 0,
    subtotal: wage + fuel + truckMaint + trailerMaint,
  };
  
  const eventCosts = calculateEventCosts(pickups, deliveries, borderCrossings, dropHooks);
  const directTripCost = mileageCosts.subtotal + eventCosts.subtotal;
  const fullyAllocatedCost = directTripCost;
  const recommendedRevenue = fullyAllocatedCost * 1.22;
  const totalCPM = distance > 0 ? directTripCost / distance : 0;
  
  return {
    mileageCosts,
    eventCosts,
    directTripCost,
    fullyAllocatedCost,
    recommendedRevenue,
    totalCPM,
  };
}

/**
 * Get all 5 costing options for a trip (for comparison on booking page)
 * Always returns all 5 driver type options regardless of distance
 */
export function getAllCostingOptions(
  distance: number,
  pickupLocation: string = '',
  deliveryLocation: string = '',
  options: {
    pickups?: number;
    deliveries?: number;
    dropHooks?: number;
  } = {}
): Array<{ driverType: DriverType; label: string; zone?: string; cost: TripCost }> {
  return [
    {
      driverType: 'OO',
      label: 'Owner Operator - Zone 1 (<500mi)',
      zone: 'zone1',
      cost: calculateTripCostWithZone('zone1', distance, pickupLocation, deliveryLocation, options),
    },
    {
      driverType: 'OO',
      label: 'Owner Operator - Zone 2 (501-1500mi)',
      zone: 'zone2',
      cost: calculateTripCostWithZone('zone2', distance, pickupLocation, deliveryLocation, options),
    },
    {
      driverType: 'OO',
      label: 'Owner Operator - Zone 3 (1500+mi)',
      zone: 'zone3',
      cost: calculateTripCostWithZone('zone3', distance, pickupLocation, deliveryLocation, options),
    },
    {
      driverType: 'COM',
      label: 'Company Driver',
      cost: calculateTripCost('COM', distance, pickupLocation, deliveryLocation, options),
    },
    {
      driverType: 'RNR',
      label: 'Rental Driver',
      cost: calculateTripCost('RNR', distance, pickupLocation, deliveryLocation, options),
    },
  ];
}
