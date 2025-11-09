import { CostData, TripCostData, DriverTypeCostData, LaneData, MarketRateData, PricingRecommendation } from "./types";

// Cost trends data for the past 30 days
export const mockCostTrends: CostData[] = [
  { date: "2025-10-10", fixed: 3500, wage: 4200, rolling: 2100, accessorials: 800, total: 10600 },
  { date: "2025-10-11", fixed: 3500, wage: 4500, rolling: 2300, accessorials: 900, total: 11200 },
  { date: "2025-10-12", fixed: 3500, wage: 4100, rolling: 2000, accessorials: 750, total: 10350 },
  { date: "2025-10-13", fixed: 3500, wage: 4800, rolling: 2400, accessorials: 1000, total: 11700 },
  { date: "2025-10-14", fixed: 3500, wage: 4300, rolling: 2200, accessorials: 850, total: 10850 },
  { date: "2025-10-15", fixed: 3500, wage: 4600, rolling: 2350, accessorials: 920, total: 11370 },
  { date: "2025-10-16", fixed: 3500, wage: 4400, rolling: 2250, accessorials: 880, total: 11030 },
  { date: "2025-10-17", fixed: 3500, wage: 4700, rolling: 2400, accessorials: 950, total: 11550 },
  { date: "2025-10-18", fixed: 3500, wage: 4200, rolling: 2100, accessorials: 800, total: 10600 },
  { date: "2025-10-19", fixed: 3500, wage: 4500, rolling: 2300, accessorials: 900, total: 11200 },
  { date: "2025-10-20", fixed: 3500, wage: 4800, rolling: 2450, accessorials: 1020, total: 11770 },
  { date: "2025-10-21", fixed: 3500, wage: 4400, rolling: 2200, accessorials: 870, total: 10970 },
  { date: "2025-10-22", fixed: 3500, wage: 4600, rolling: 2350, accessorials: 920, total: 11370 },
  { date: "2025-10-23", fixed: 3500, wage: 4300, rolling: 2150, accessorials: 830, total: 10780 },
  { date: "2025-10-24", fixed: 3500, wage: 4700, rolling: 2400, accessorials: 950, total: 11550 },
];

// Trip margin analysis data
export const mockTripMargins: TripCostData[] = [
  { id: "T001", driverName: "Jeff Churchill", driverType: "COM", cost: 850, revenue: 1050, margin: 200, marginPercentage: 19.0 },
  { id: "T002", driverName: "Denise Starr", driverType: "RNR", cost: 920, revenue: 1150, margin: 230, marginPercentage: 20.0 },
  { id: "T003", driverName: "Gurdip Dhanal", driverType: "OO", cost: 1200, revenue: 1380, margin: 180, marginPercentage: 13.0 },
  { id: "T004", driverName: "Jeff Churchill", driverType: "COM", cost: 780, revenue: 950, margin: 170, marginPercentage: 17.9 },
  { id: "T005", driverName: "Denise Starr", driverType: "RNR", cost: 1100, revenue: 1400, margin: 300, marginPercentage: 21.4 },
  { id: "T006", driverName: "Gurdip Dhanal", driverType: "OO", cost: 1350, revenue: 1500, margin: 150, marginPercentage: 10.0 },
  { id: "T007", driverName: "Jeff Churchill", driverType: "COM", cost: 900, revenue: 1080, margin: 180, marginPercentage: 16.7 },
  { id: "T008", driverName: "Denise Starr", driverType: "RNR", cost: 1050, revenue: 1320, margin: 270, marginPercentage: 20.5 },
  { id: "T009", driverName: "Gurdip Dhanal", driverType: "OO", cost: 1400, revenue: 1580, margin: 180, marginPercentage: 11.4 },
  { id: "T010", driverName: "Jeff Churchill", driverType: "COM", cost: 820, revenue: 1000, margin: 180, marginPercentage: 18.0 },
  { id: "T011", driverName: "Denise Starr", driverType: "RNR", cost: 950, revenue: 1200, margin: 250, marginPercentage: 20.8 },
  { id: "T012", driverName: "Gurdip Dhanal", driverType: "OO", cost: 1300, revenue: 1450, margin: 150, marginPercentage: 10.3 },
];

// Driver type comparison data
export const mockDriverTypeCosts: DriverTypeCostData[] = [
  { type: "COM", avgCPM: 1.85, avgMargin: 18.2, utilization: 92, tripCount: 45 },
  { type: "RNR", avgCPM: 1.72, avgMargin: 20.7, utilization: 88, tripCount: 38 },
  { type: "OO", avgCPM: 2.35, avgMargin: 11.6, utilization: 85, tripCount: 32 },
];

// Lane analysis data
export const mockLaneData: LaneData[] = [
  { origin: "Toronto, ON", destination: "Chicago, IL", tripCount: 24, avgCost: 950, avgRevenue: 1150, avgMargin: 17.4 },
  { origin: "Toronto, ON", destination: "Detroit, MI", tripCount: 18, avgCost: 620, avgRevenue: 780, avgMargin: 20.5 },
  { origin: "Guelph, ON", destination: "Buffalo, NY", tripCount: 15, avgCost: 480, avgRevenue: 600, avgMargin: 20.0 },
  { origin: "Windsor, ON", destination: "Cleveland, OH", tripCount: 12, avgCost: 720, avgRevenue: 900, avgMargin: 20.0 },
  { origin: "Toronto, ON", destination: "Columbus, OH", tripCount: 10, avgCost: 850, avgRevenue: 1020, avgMargin: 16.7 },
  { origin: "Guelph, ON", destination: "Pittsburgh, PA", tripCount: 8, avgCost: 920, avgRevenue: 1100, avgMargin: 16.4 },
  { origin: "Windsor, ON", destination: "Indianapolis, IN", tripCount: 7, avgCost: 980, avgRevenue: 1180, avgMargin: 16.9 },
  { origin: "Toronto, ON", destination: "Milwaukee, WI", tripCount: 6, avgCost: 1050, avgRevenue: 1300, avgMargin: 19.2 },
];

// Market rate data
export const mockMarketRates: MarketRateData[] = [
  {
    lane: "Toronto, ON → Chicago, IL",
    currentRate: 2.45,
    historicalRates: [
      { date: "2025-09-01", rate: 2.35 },
      { date: "2025-09-15", rate: 2.40 },
      { date: "2025-10-01", rate: 2.42 },
      { date: "2025-10-15", rate: 2.45 },
      { date: "2025-11-01", rate: 2.48 },
    ],
    predictedRate: 2.52,
    trend: "up",
  },
  {
    lane: "Toronto, ON → Detroit, MI",
    currentRate: 2.15,
    historicalRates: [
      { date: "2025-09-01", rate: 2.20 },
      { date: "2025-09-15", rate: 2.18 },
      { date: "2025-10-01", rate: 2.16 },
      { date: "2025-10-15", rate: 2.15 },
      { date: "2025-11-01", rate: 2.14 },
    ],
    predictedRate: 2.12,
    trend: "down",
  },
  {
    lane: "Guelph, ON → Buffalo, NY",
    currentRate: 1.95,
    historicalRates: [
      { date: "2025-09-01", rate: 1.92 },
      { date: "2025-09-15", rate: 1.94 },
      { date: "2025-10-01", rate: 1.95 },
      { date: "2025-10-15", rate: 1.95 },
      { date: "2025-11-01", rate: 1.96 },
    ],
    predictedRate: 1.96,
    trend: "stable",
  },
];

// Pricing recommendations
export const mockPricingRecommendations: PricingRecommendation[] = [
  { orderId: "O001", customer: "ABC Corp", lane: "Toronto → Chicago", currentPrice: 2.20, recommendedPrice: 2.45, status: "under-priced", margin: 12.5 },
  { orderId: "O002", customer: "XYZ Ltd", lane: "Toronto → Detroit", currentPrice: 2.50, recommendedPrice: 2.15, status: "over-priced", margin: 25.0 },
  { orderId: "O003", customer: "The Center", lane: "Guelph → Buffalo", currentPrice: 1.95, recommendedPrice: 1.95, status: "optimal", margin: 18.5 },
  { orderId: "O004", customer: "Fast Freight", lane: "Windsor → Cleveland", currentPrice: 2.10, recommendedPrice: 2.35, status: "under-priced", margin: 14.2 },
  { orderId: "O005", customer: "Global Logistics", lane: "Toronto → Columbus", currentPrice: 2.45, recommendedPrice: 2.40, status: "optimal", margin: 19.8 },
];
