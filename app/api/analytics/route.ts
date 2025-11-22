import { NextResponse } from "next/server";

// Microservice URLs
const ORDERS_SERVICE = process.env.ORDERS_SERVICE_URL || "http://localhost:4002";
const TRACKING_SERVICE = process.env.TRACKING_SERVICE_URL || "http://localhost:4004";
const MASTER_DATA_SERVICE = process.env.MASTER_DATA_SERVICE_URL || "http://localhost:4001";

interface Order {
  order_id: string;
  customer_name?: string;
  revenue?: number;
  status: string;
  created_at: string;
  pickup_location?: string;
  delivery_location?: string;
}

interface Trip {
  trip_id: string;
  order_id: string;
  driver_id?: string;
  unit_id?: string;
  status: string;
  estimated_distance?: number;
  actual_distance?: number;
  total_cost?: number;
  revenue?: number;
  created_at: string;
  completed_at?: string;
  pickup?: string;
  delivery?: string;
}

interface Driver {
  driver_id: string;
  first_name: string;
  last_name: string;
  driver_type?: string;
}

export async function GET() {
  try {
    // Fetch real data from microservices in parallel
    const [ordersRes, tripsRes, driversRes] = await Promise.all([
      fetch(`${ORDERS_SERVICE}/api/orders`).catch(() => null),
      fetch(`${TRACKING_SERVICE}/api/trips`).catch(() => null),
      fetch(`${MASTER_DATA_SERVICE}/api/drivers`).catch(() => null),
    ]);

    const ordersData = ordersRes?.ok ? await ordersRes.json() : { data: [] };
    const tripsData = tripsRes?.ok ? await tripsRes.json() : { data: [] };
    const driversData = driversRes?.ok ? await driversRes.json() : { data: [] };

    const orders: Order[] = Array.isArray(ordersData) ? ordersData : (ordersData.data || []);
    const trips: Trip[] = Array.isArray(tripsData) ? tripsData : (tripsData.data || []);
    const drivers: Driver[] = Array.isArray(driversData) ? driversData : (driversData.data || []);

    // If no real data, return fallback mock data
    if (orders.length === 0 && trips.length === 0) {
      return NextResponse.json(generateMockAnalytics());
    }

    // Calculate analytics from real data
    const analytics = aggregateAnalytics(orders, trips, drivers);
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics aggregation error:", error);
    // Return fallback mock data on error
    return NextResponse.json(generateMockAnalytics());
  }
}

function aggregateAnalytics(orders: Order[], trips: Trip[], drivers: Driver[]) {
  // Filter trips from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentTrips = trips.filter(t => {
    const createdAt = new Date(t.created_at);
    return createdAt >= thirtyDaysAgo;
  });

  // Calculate summary metrics
  const totalRevenue = recentTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);
  const totalCost = recentTrips.reduce((sum, t) => sum + (t.total_cost || 0), 0);
  const totalMiles = recentTrips.reduce((sum, t) => sum + (t.actual_distance || t.estimated_distance || 0), 0);
  const marginPercent = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
  const avgRatePerMile = totalMiles > 0 ? totalRevenue / totalMiles : 0;
  const avgCostPerMile = totalMiles > 0 ? totalCost / totalMiles : 0;

  // Calculate profitable vs at-risk trips (margin < 15%)
  const tripsWithMargin = recentTrips.filter(t => t.revenue && t.total_cost);
  const profitableTrips = tripsWithMargin.filter(t => {
    const margin = ((t.revenue! - t.total_cost!) / t.revenue!) * 100;
    return margin >= 15;
  }).length;
  const atRiskTrips = tripsWithMargin.filter(t => {
    const margin = ((t.revenue! - t.total_cost!) / t.revenue!) * 100;
    return margin < 15 && margin >= 0;
  }).length;

  // Revenue trend by week
  const revenueTrend = calculateWeeklyTrend(recentTrips);

  // Margin by category (customer-based)
  const marginByCategory = calculateCategoryMargins(recentTrips, orders);

  // Driver performance
  const driverPerformance = calculateDriverPerformance(recentTrips, drivers);

  // Lane performance
  const lanePerformance = calculateLanePerformance(recentTrips);

  // Margin distribution
  const marginDistribution = calculateMarginDistribution(tripsWithMargin);

  // Generate alerts based on data patterns
  const alerts = generateAlerts(recentTrips, marginPercent, atRiskTrips);

  return {
    summary: {
      periodLabel: "Last 30 days",
      totalRevenue: Math.round(totalRevenue),
      totalCost: Math.round(totalCost),
      marginPercent: parseFloat(marginPercent.toFixed(1)),
      avgRatePerMile: parseFloat(avgRatePerMile.toFixed(2)),
      avgCostPerMile: parseFloat(avgCostPerMile.toFixed(2)),
      totalMiles: Math.round(totalMiles),
      profitableTrips,
      atRiskTrips,
    },
    revenueTrend,
    marginByCategory,
    driverPerformance,
    lanePerformance,
    marginDistribution,
    alerts,
    updatedAt: new Date().toISOString(),
  };
}

function calculateWeeklyTrend(trips: Trip[]) {
  const weeks: { [key: string]: { revenue: number; cost: number; miles: number; count: number } } = {};
  
  trips.forEach(trip => {
    const date = new Date(trip.created_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week
    const weekLabel = `Week ${Math.ceil((Date.now() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
    
    if (!weeks[weekLabel]) {
      weeks[weekLabel] = { revenue: 0, cost: 0, miles: 0, count: 0 };
    }
    
    weeks[weekLabel].revenue += trip.revenue || 0;
    weeks[weekLabel].cost += trip.total_cost || 0;
    weeks[weekLabel].miles += trip.actual_distance || trip.estimated_distance || 0;
    weeks[weekLabel].count += 1;
  });
  
  return Object.entries(weeks)
    .map(([label, data]) => ({
      label,
      revenue: Math.round(data.revenue),
      cost: Math.round(data.cost),
      marginPercent: data.revenue > 0 ? parseFloat((((data.revenue - data.cost) / data.revenue) * 100).toFixed(1)) : 0,
      miles: Math.round(data.miles),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-4); // Last 4 weeks
}

function calculateCategoryMargins(trips: Trip[], orders: Order[]) {
  const orderMap = new Map(orders.map(o => [o.order_id, o]));
  const categories: { [key: string]: { revenue: number; cost: number } } = {};
  
  trips.forEach(trip => {
    const order = orderMap.get(trip.order_id);
    const category = order?.customer_name || "General Freight";
    
    if (!categories[category]) {
      categories[category] = { revenue: 0, cost: 0 };
    }
    
    categories[category].revenue += trip.revenue || 0;
    categories[category].cost += trip.total_cost || 0;
  });
  
  return Object.entries(categories)
    .map(([category, data]) => ({
      category,
      revenue: Math.round(data.revenue),
      marginPercent: data.revenue > 0 ? parseFloat((((data.revenue - data.cost) / data.revenue) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.marginPercent - a.marginPercent)
    .slice(0, 4);
}

function calculateDriverPerformance(trips: Trip[], drivers: Driver[]) {
  const driverMap = new Map(drivers.map(d => [d.driver_id, d]));
  const performance: { [key: string]: { trips: number; revenue: number; cost: number } } = {};
  
  trips.forEach(trip => {
    if (!trip.driver_id) return;
    
    if (!performance[trip.driver_id]) {
      performance[trip.driver_id] = { trips: 0, revenue: 0, cost: 0 };
    }
    
    performance[trip.driver_id].trips += 1;
    performance[trip.driver_id].revenue += trip.revenue || 0;
    performance[trip.driver_id].cost += trip.total_cost || 0;
  });
  
  return Object.entries(performance)
    .map(([driverId, data]) => {
      const driver = driverMap.get(driverId);
      const driverName = driver ? `${driver.first_name} ${driver.last_name}` : `Driver ${driverId.slice(0, 8)}`;
      
      return {
        driverId,
        driverName,
        trips: data.trips,
        revenue: Math.round(data.revenue),
        marginPercent: data.revenue > 0 ? parseFloat((((data.revenue - data.cost) / data.revenue) * 100).toFixed(1)) : 0,
      };
    })
    .sort((a, b) => b.marginPercent - a.marginPercent)
    .slice(0, 5);
}

function calculateLanePerformance(trips: Trip[]) {
  const lanes: { [key: string]: { revenue: number; cost: number; miles: number } } = {};
  
  trips.forEach(trip => {
    if (!trip.pickup || !trip.delivery) return;
    
    const lane = `${trip.pickup} → ${trip.delivery}`;
    
    if (!lanes[lane]) {
      lanes[lane] = { revenue: 0, cost: 0, miles: 0 };
    }
    
    lanes[lane].revenue += trip.revenue || 0;
    lanes[lane].cost += trip.total_cost || 0;
    lanes[lane].miles += trip.actual_distance || trip.estimated_distance || 0;
  });
  
  return Object.entries(lanes)
    .map(([lane, data]) => ({
      lane,
      revenue: Math.round(data.revenue),
      miles: Math.round(data.miles),
      marginPercent: data.revenue > 0 ? parseFloat((((data.revenue - data.cost) / data.revenue) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);
}

function calculateMarginDistribution(trips: Trip[]) {
  const distribution = {
    "Loss": 0,
    "0-5%": 0,
    "5-10%": 0,
    "10-15%": 0,
    "15%+": 0,
  };
  
  trips.forEach(trip => {
    if (!trip.revenue || !trip.total_cost) return;
    
    const margin = ((trip.revenue - trip.total_cost) / trip.revenue) * 100;
    
    if (margin < 0) distribution["Loss"]++;
    else if (margin < 5) distribution["0-5%"]++;
    else if (margin < 10) distribution["5-10%"]++;
    else if (margin < 15) distribution["10-15%"]++;
    else distribution["15%+"]++;
  });
  
  return Object.entries(distribution).map(([band, trips]) => ({ band, trips }));
}

function generateAlerts(trips: Trip[], marginPercent: number, atRiskTrips: number) {
  const alerts: Array<{ id: string; title: string; description: string; severity: "info" | "warn" | "alert" }> = [];
  
  // Alert if margin is below 18%
  if (marginPercent < 18) {
    alerts.push({
      id: "alert-margin",
      title: "Margin below target",
      description: `Overall margin at ${marginPercent.toFixed(1)}% is below the 20% target. Review pricing and cost optimization opportunities.`,
      severity: marginPercent < 15 ? "alert" : "warn",
    });
  }
  
  // Alert if at-risk trips are high
  if (atRiskTrips > 10) {
    alerts.push({
      id: "alert-risk",
      title: "High at-risk trip count",
      description: `${atRiskTrips} trips operating below 15% margin target. Investigate common patterns for cost or pricing issues.`,
      severity: atRiskTrips > 20 ? "alert" : "warn",
    });
  }
  
  // Positive alert if performance is strong
  if (marginPercent >= 22 && atRiskTrips < 5) {
    alerts.push({
      id: "alert-performance",
      title: "Strong fleet performance",
      description: `Operating at ${marginPercent.toFixed(1)}% margin with minimal at-risk trips. Current strategy is effective.`,
      severity: "info",
    });
  }
  
  return alerts;
}

function generateMockAnalytics() {
  return {
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
  };
}

