import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    summary: {
      periodLabel: "Last 30 days",
      totalRevenue: 1280000,
      totalCost: 1005000,
      marginPercent: 21.5,
      avgRatePerMile: 2.96,
      avgCostPerMile: 2.33,
      totalMiles: 432000,
      profitableTrips: 124,
      atRiskTrips: 11,
    },
    revenueTrend: [
      { label: "Week 1", revenue: 310000, cost: 246000, marginPercent: 20.6, miles: 108000 },
      { label: "Week 2", revenue: 318000, cost: 249500, marginPercent: 21.5, miles: 109500 },
      { label: "Week 3", revenue: 326000, cost: 252000, marginPercent: 22.7, miles: 107000 },
      { label: "Week 4", revenue: 322000, cost: 249000, marginPercent: 22.7, miles: 107500 },
    ],
    marginByCategory: [
      { category: "Retail Dedicated", revenue: 420000, marginPercent: 19.2 },
      { category: "Food & Bev", revenue: 365000, marginPercent: 23.4 },
      { category: "Manufacturing", revenue: 298000, marginPercent: 20.7 },
      { category: "Cross-border", revenue: 198000, marginPercent: 17.9 },
    ],
    driverPerformance: [
      { driverId: "DRV-101", driverName: "S. Redding", trips: 14, marginPercent: 26.4, revenue: 132000 },
      { driverId: "DRV-204", driverName: "J. McCall", trips: 12, marginPercent: 24.1, revenue: 118000 },
      { driverId: "DRV-311", driverName: "N. Torres", trips: 10, marginPercent: 22.8, revenue: 104000 },
      { driverId: "DRV-128", driverName: "P. Hooper", trips: 9, marginPercent: 18.3, revenue: 89000 },
      { driverId: "DRV-455", driverName: "A. Kim", trips: 11, marginPercent: 25.6, revenue: 110000 },
    ],
    lanePerformance: [
      { lane: "DAL → ATL", revenue: 168000, marginPercent: 24.5, miles: 42000 },
      { lane: "LAX → DEN", revenue: 154000, marginPercent: 21.2, miles: 38600 },
      { lane: "ORD → MCI", revenue: 138000, marginPercent: 19.7, miles: 31800 },
      { lane: "SEA → RNO", revenue: 126000, marginPercent: 16.4, miles: 35200 },
    ],
    marginDistribution: [
      { band: "Loss", trips: 6 },
      { band: "0-5%", trips: 9 },
      { band: "5-10%", trips: 18 },
      { band: "10-15%", trips: 28 },
      { band: "15%+", trips: 40 },
    ],
    alerts: [
      {
        id: "alert-1",
        title: "West coast refrigerated margin dip",
        description: "Margin fell 4.2 pts vs prior 30 days due to fuel surcharges not applied on LAX origin freight.",
        severity: "warn",
      },
      {
        id: "alert-2",
        title: "At-risk trips trending up",
        description: "11 trips closed under target margin; 6 tied to detention and dwell overages on DAL → ATL lane.",
        severity: "alert",
      },
      {
        id: "alert-3",
        title: "Strong driver performance",
        description: "Top 5 drivers averaging 24% margin with 99% on-time delivery across 56 trips.",
        severity: "info",
      },
    ],
    updatedAt: new Date().toISOString(),
  });
}
