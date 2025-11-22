import { NextResponse } from "next/server";

export async function GET() {
  try {
    // In production, these would be calculated from actual database queries
    // aggregating data from orders, trips, events, and costs tables
    
    const metrics = {
      // Orders
      ordersWaiting: 12,
      ordersQualified: 8,
      ordersBooked: 156,
      
      // Trips
      tripsActive: 24,
      tripsAtRisk: 3,
      tripsCompleted: 142,
      
      // Performance
      avgMargin: 18.5,
      onTimePercent: 87.3,
      
      // Resources
      activeDrivers: 24,
      totalDrivers: 30,
      activeUnits: 22,
      totalUnits: 28,
      utilizationRate: 76.2,
      
      // Financial
      totalRevenue: 145280,
      totalCost: 118425,
      netMargin: 26855,
      avgRevenuePerTrip: 3650,
      avgCostPerTrip: 2975,
      
      // Trends (7-day comparison)
      revenueGrowth: 5.2,
      marginGrowth: 1.2,
      volumeGrowth: 3.8,
      
      // Current Period Summary
      period: "Last 7 Days",
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      periodEnd: new Date().toISOString(),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

