import { 
  calculateTripCost as calculateTripCostNew, 
  type Driver, 
  type TripEvents,
  type TripCostResult
} from './cost-calculator';

// Core costing logic for fleet management system

export type DriverType = 'COM' | 'RNR' | 'OO';
export type HaulType = 'short' | 'long';
export type OOZone = 'zone1' | 'zone2' | 'zone3';

// Re-export types from cost-calculator that might be needed
export type { TripCostResult };

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
 * @deprecated Use lib/cost-calculator.ts instead
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
  } = {}
): TripCost {
  const {
    pickups = 1,
    deliveries = 1,
    dropHooks = 0,
    includeOverhead = false,
    truckWk = 0,
  } = options;
  
  const borderCrossings = isCrossBorder(pickupLocation, deliveryLocation) ? 1 : 0;
  
  // Adapt to new calculator
  const driver: Driver = {
    id: 'legacy-calc',
    name: 'Legacy Calculation',
    type: driverType,
    truckWk: truckWk // Use provided truckWk or default to 0
  };

  const events: TripEvents = {
    border: borderCrossings,
    picks: pickups,
    drops: deliveries
  };

  // Estimate duration (50mph average)
  const durationHours = distance / 50;
  const durationDays = durationHours / 24;

  const result = calculateTripCostNew(driver, distance, durationDays, events);

  // Map new result back to old structure to maintain compatibility
  // This is an approximation since the new logic groups costs differently
  
  const mileageCosts: MileageCosts = {
    wage: result.breakdown.labor, // This includes benefits/markup now
    fuel: result.breakdown.fuel,
    benefits: 0, // Included in wage
    performance: 0,
    safety: 0,
    step: 0,
    truckMaint: result.breakdown.maintenance, // Combined maintenance
    trailerMaint: 0, // Included in truckMaint
    rolling: 0,
    subtotal: result.breakdown.labor + result.breakdown.fuel + result.breakdown.maintenance,
  };

  const eventCosts: EventCosts = {
    pickupCost: pickups * 30,
    deliveryCost: deliveries * 30,
    borderCost: borderCrossings * 15,
    dropHookCost: 0, // Not in new logic explicitly, maybe part of picks/drops?
    subtotal: result.breakdown.events,
  };

  const weeklyOverhead: WeeklyOverhead | undefined = includeOverhead ? {
    insurance: 0,
    trailerLease: 0,
    sga: 0,
    dispatchOps: 0,
    prepass: 0,
    isaacEld: 0,
    miscellaneous: 0,
    dailyTotal: result.breakdown.fixed / durationDays, // Daily fixed cost
  } : undefined;

  return {
    mileageCosts,
    eventCosts,
    weeklyOverhead,
    directTripCost: result.totalCost - (includeOverhead ? 0 : result.breakdown.fixed),
    fullyAllocatedCost: result.totalCost,
    recommendedRevenue: result.totalCost * 1.22, // Keeping the margin logic from before? Or use new margin analysis?
    totalCPM: result.metadata.costPerMile,
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
  // For now, just delegate to the main calculator as OO logic is simplified in new requirement
  // The new requirement has a single OO rate ($0.22 fuel, $1.60 wage)
  // It doesn't seem to distinguish zones anymore.
  return calculateTripCost('OO', distance, pickupLocation, deliveryLocation, options);
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
