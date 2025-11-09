export interface CostData {
  date: string;
  fixed: number;
  wage: number;
  rolling: number;
  accessorials: number;
  total: number;
}

export interface TripCostData {
  id: string;
  driverName: string;
  driverType: 'COM' | 'RNR' | 'OO';
  cost: number;
  revenue: number;
  margin: number;
  marginPercentage: number;
}

export interface DriverTypeCostData {
  type: 'COM' | 'RNR' | 'OO';
  avgCPM: number;
  avgMargin: number;
  utilization: number;
  tripCount: number;
}

export interface LaneData {
  origin: string;
  destination: string;
  tripCount: number;
  avgCost: number;
  avgRevenue: number;
  avgMargin: number;
}

export interface CostCalculation {
  miles: number;
  driverType: 'COM' | 'RNR' | 'OO';
  events: number;
  estimatedCost: number;
  breakEvenPrice: number;
  targetPrice: number;
  marketRate: number;
}

export interface MarketRateData {
  lane: string;
  currentRate: number;
  historicalRates: { date: string; rate: number }[];
  predictedRate: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PricingRecommendation {
  orderId: string;
  customer: string;
  lane: string;
  currentPrice: number;
  recommendedPrice: number;
  status: 'under-priced' | 'over-priced' | 'optimal';
  margin: number;
}
