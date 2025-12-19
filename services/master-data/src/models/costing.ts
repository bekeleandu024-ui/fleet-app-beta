// Costing models for comprehensive cost calculation and margin analysis

export enum DriverType {
  COMPANY = 'COM',
  RENTAL = 'RNR',
  OWNER_OPERATOR = 'OO'
}

export enum OOZone {
  ZONE1 = 'ZONE1',
  ZONE2 = 'ZONE2',
  ZONE3 = 'ZONE3'
}

export enum OrderDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

export enum CostComponentType {
  FIXED_WEEKLY = 'FIXED_WEEKLY',
  WAGE_CPM = 'WAGE_CPM',
  ROLLING_CPM = 'ROLLING_CPM',
  ACCESSORIAL = 'ACCESSORIAL'
}

// Driver profile with costing attributes
export interface DriverProfile {
  driver_id: string;
  driver_name: string;
  unit_number: string;
  driver_type: DriverType;
  oo_zone?: OOZone;
  base_wage_cpm: number;
  benefits_pct: number;
  performance_pct: number;
  safety_pct: number;
  step_pct: number;
  effective_wage_cpm: number; // calculated
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Unit profile with weekly costs
export interface UnitProfile {
  unit_id: string;
  unit_number: string;
  driver_id?: string;
  truck_weekly_cost: number;
  trailer_weekly_cost: number;
  insurance_weekly_cost: number;
  isaac_weekly_cost: number;
  prepass_weekly_cost: number;
  sga_weekly_cost: number;
  dtops_weekly_cost: number;
  misc_weekly_cost: number;
  total_weekly_cost: number; // calculated
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Costing rules (global rates)
export interface CostingRule {
  rule_id: string;
  rule_key: string; // e.g., BASE_WAGE, FUEL_CPM, BC_PER, DH_PER
  rule_type: string; // driver_type or GLOBAL
  rule_value: number;
  description?: string;
  effective_date: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Event types that add costs
export interface EventType {
  event_id: string;
  event_code: string; // BC, DH, PICKUP, DELIVERY
  event_name: string;
  cost_per_event: number;
  is_automatic: boolean; // auto-detected by rule engine
  created_at: Date;
  updated_at: Date;
}

// Event detection rule
export interface EventRule {
  rule_id: string;
  event_code: string;
  trigger_type: string; // BORDER_CROSSING, ROUND_TRIP, etc.
  trigger_condition: any; // JSONB for flexible rules
  created_at: Date;
  updated_at: Date;
}

// Trip cost breakdown
export interface TripCost {
  cost_id: string;
  order_id: string;
  driver_id?: string;
  unit_id?: string;
  driver_type?: DriverType;
  oo_zone?: OOZone;
  
  // Trip details
  miles: number;
  direction?: OrderDirection;
  is_round_trip: boolean;
  
  // Events
  border_crossings: number;
  drop_hooks: number;
  pickups: number;
  deliveries: number;
  
  // Cost components (all in CPM or total $)
  fixed_cpm: number;
  wage_cpm: number;
  rolling_cpm: number;
  accessorial_cpm: number;
  total_cpm: number;
  
  // Total costs
  total_cost: number;
  
  // Revenue and margin
  revenue?: number;
  rpm?: number; // revenue per mile
  ppm?: number; // profit per mile
  profit?: number;
  margin_pct?: number;
  is_profitable?: boolean;
  
  // Audit trail
  calculation_formula: any; // JSONB storing the detailed formula
  calculated_at: Date;
  calculated_by?: string;
  
  // Actual tracking
  actual_miles?: number;
  actual_cost?: number;
  variance?: number;
  variance_pct?: number;
  
  created_at: Date;
  updated_at: Date;
}

// Cost calculation request
export interface CostCalculationRequest {
  trip_id?: string;
  order_id: string;
  driver_id?: string;
  unit_number?: string;
  miles: number;
  direction?: OrderDirection;
  is_round_trip?: boolean;
  origin?: string;
  destination?: string;
  order_type?: string;
  
  // Manual event overrides
  border_crossings?: number;
  drop_hooks?: number;
  pickups?: number;
  deliveries?: number;
  
  // Revenue for margin calculation
  revenue?: number;
  
  // Week start for weekly cost allocation
  week_start?: Date;
}

// Cost calculation response with full breakdown
export interface CostCalculationResponse {
  cost_id: string;
  order_id: string;
  
  // Summary
  total_cost: number;
  total_cpm: number;
  
  // Detailed breakdown
  breakdown: {
    fixed_weekly: {
      total_weekly_cost: number;
      weekly_miles: number; // sum of miles for this unit this week
      fixed_cpm: number;
      components: {
        truck_weekly: number;
        trailer_weekly: number;
        insurance_weekly: number;
        isaac_weekly: number;
        prepass_weekly: number;
        sga_weekly: number;
        dtops_weekly: number;
        misc_weekly: number;
      };
    };
    
    wage: {
      base_cpm: number;
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
      border_crossing_count: number;
      border_crossing_cost: number;
      drop_hook_count: number;
      drop_hook_cost: number;
      pickup_count: number;
      pickup_cost: number;
      delivery_count: number;
      delivery_cost: number;
      total_accessorial_cost: number;
      accessorial_cpm: number;
    };
  };
  
  // Margin analysis
  margin_analysis?: {
    revenue: number;
    rpm: number;
    ppm: number;
    profit: number;
    margin_pct: number;
    is_profitable: boolean;
    break_even_rpm: number;
  };
  
  // Pricing suggestions
  pricing_suggestions?: {
    minimum_rpm: number; // break-even
    target_rpm: number; // 10-15% margin
    recommended_price: number;
  };
  
  // Events auto-detected
  auto_detected_events: Array<{
    event_code: string;
    event_name: string;
    quantity: number;
    cost_per_event: number;
    total_cost: number;
    detection_reason: string;
  }>;
  
  // Audit trail
  calculation_formula: any;
  calculated_at: Date;
}

// Week miles summary for fixed cost allocation
export interface WeekMilesSummary {
  unit_number: string;
  week_start: Date;
  total_miles: number;
  trip_count: number;
}

// Margin analytics for reporting
export interface MarginAnalytics {
  period_start: Date;
  period_end: Date;
  total_trips: number;
  total_miles: number;
  total_revenue: number;
  total_cost: number;
  average_rpm: number;
  average_cpm: number;
  average_ppm: number;
  average_margin_pct: number;
  profitable_trips: number;
  unprofitable_trips: number;
  
  // By driver type
  by_driver_type: Array<{
    driver_type: DriverType;
    trips: number;
    revenue: number;
    cost: number;
    margin_pct: number;
  }>;
  
  // Top performers
  top_drivers: Array<{
    driver_id: string;
    driver_name: string;
    trips: number;
    margin_pct: number;
  }>;
}
