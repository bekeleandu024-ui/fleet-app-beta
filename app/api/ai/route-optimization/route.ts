import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/route-optimization
 * Get AI-powered route optimization using Claude via MCP
 */
export async function POST(req: NextRequest) {
  try {
    const { origin, destination, miles, revenue } = await req.json();

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    // Get costing data from master-data service
    const driversRes = await fetch('http://localhost:4001/api/metadata/drivers');
    const unitsRes = await fetch('http://localhost:4001/api/metadata/units');
    
    const driversData = await driversRes.json();
    const unitsData = await unitsRes.json();

    const drivers = driversData.drivers || [];
    const units = unitsData.units || [];

    // Calculate distance (you can integrate a real distance API here)
    const estimatedMiles = miles || estimateDistance(origin, destination);
    
    // Detect border crossings
    const borderCrossings = detectBorderCrossings(origin, destination);
    const borderCrossingCost = borderCrossings * 150;

    // Calculate costs for each driver type
    const driverRecommendations = drivers.map((driver: any) => {
      const unit = units.find((u: any) => u.unit_number === driver.unit_number);
      
      // Calculate based on your costing logic
      const effectiveWageCpm = parseFloat(driver.effective_wage_cpm) || 0;
      const rollingCpm = driver.driver_type === 'COM' ? 0.61 : 
                        driver.driver_type === 'RNR' ? 0.58 : 0.66;
      
      const fixedCpm = unit ? (parseFloat(unit.total_weekly_cost) / 1000) : 2.0;
      const accessorialCpm = (borderCrossingCost + 70) / estimatedMiles; // delivery + pickup
      
      const totalCpm = fixedCpm + effectiveWageCpm + rollingCpm + accessorialCpm;
      const estimatedCost = Math.round(totalCpm * estimatedMiles);

      return {
        driverId: driver.driver_id,
        driverName: driver.driver_name,
        unit: driver.unit_number,
        driverType: driver.driver_type,
        weeklyCost: unit ? parseFloat(unit.total_weekly_cost) : 0,
        baseWage: parseFloat(driver.base_wage_cpm),
        fuelRate: driver.driver_type === 'COM' ? 0.45 : 
                  driver.driver_type === 'RNR' ? 0.42 : 0.50,
        reason: getCostReason(driver.driver_type, estimatedCost, revenue),
        estimatedCost,
        totalCpm: parseFloat(totalCpm.toFixed(4)),
      };
    });

    // Sort by cost (ascending)
    driverRecommendations.sort((a: any, b: any) => a.estimatedCost - b.estimatedCost);

    // Create cost comparison
    const costComparison = driverRecommendations.slice(0, 3).map((rec: any) => ({
      type: rec.driverType,
      driver: rec.driverName,
      weeklyCost: rec.weeklyCost,
      estimatedCost: rec.estimatedCost,
      pros: getDriverPros(rec.driverType),
      cons: getDriverCons(rec.driverType),
    }));

    // Generate insights
    const insights = generateInsights({
      estimatedMiles,
      borderCrossings,
      revenue,
      lowestCost: driverRecommendations[0].estimatedCost,
      driverType: driverRecommendations[0].driverType,
    });

    return NextResponse.json({
      recommendation: `Use ${driverRecommendations[0].driverName} (${driverRecommendations[0].driverType}) for optimal cost efficiency`,
      totalDistance: estimatedMiles,
      estimatedTime: `${Math.round((estimatedMiles / 60) * 10) / 10} hours`,
      borderCrossings,
      estimatedCost: driverRecommendations[0].estimatedCost,
      driverRecommendations: driverRecommendations.slice(0, 3),
      costComparison,
      insights,
    });
  } catch (error: any) {
    console.error('Route optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate route optimization' },
      { status: 500 }
    );
  }
}

function estimateDistance(origin: string, destination: string): number {
  // Simple estimation - you can replace with Google Maps API
  const cities: Record<string, { lat: number; lon: number }> = {
    'Guelph': { lat: 43.5448, lon: -80.2482 },
    'Buffalo': { lat: 42.8864, lon: -78.8784 },
    'Chicago': { lat: 41.8781, lon: -87.6298 },
    'Toronto': { lat: 43.6532, lon: -79.3832 },
  };

  const fromCity = Object.keys(cities).find(c => origin.includes(c));
  const toCity = Object.keys(cities).find(c => destination.includes(c));

  if (fromCity && toCity) {
    const from = cities[fromCity];
    const to = cities[toCity];
    const distance = Math.sqrt(
      Math.pow(to.lat - from.lat, 2) + Math.pow(to.lon - from.lon, 2)
    ) * 69; // rough miles per degree
    return Math.round(distance);
  }

  return 500; // default
}

function detectBorderCrossings(origin: string, destination: string): number {
  const usKeywords = ['USA', 'US', 'United States', 'Buffalo', 'NY', 'Chicago', 'IL'];
  const caKeywords = ['Canada', 'CA', 'Ontario', 'ON', 'Toronto', 'Guelph'];

  const originUS = usKeywords.some(k => origin.includes(k));
  const originCA = caKeywords.some(k => origin.includes(k));
  const destUS = usKeywords.some(k => destination.includes(k));
  const destCA = caKeywords.some(k => destination.includes(k));

  if ((originUS && destCA) || (originCA && destUS)) {
    return 2; // round trip crosses twice
  }

  return 0;
}

function getCostReason(driverType: string, cost: number, revenue?: number): string {
  if (driverType === 'RNR') {
    return 'Most cost-effective option with lower weekly commitment';
  } else if (driverType === 'COM') {
    return 'Reliable company driver with predictable costs';
  } else {
    return 'Higher cost but more flexible for specialized routes';
  }
}

function getDriverPros(type: string): string[] {
  const pros: Record<string, string[]> = {
    RNR: ['Lowest base wage', 'Short-term flexibility', 'Lower commitment'],
    COM: ['Reliable', 'Company-owned equipment', 'Predictable costs'],
    OO: ['Experienced', 'Own equipment', 'Flexible routing'],
  };
  return pros[type] || [];
}

function getDriverCons(type: string): string[] {
  const cons: Record<string, string[]> = {
    RNR: ['Less reliable long-term', 'May need training'],
    COM: ['Higher wages', 'Benefits overhead'],
    OO: ['Highest per-mile cost', 'Scheduling dependencies'],
  };
  return cons[type] || [];
}

function generateInsights(data: {
  estimatedMiles: number;
  borderCrossings: number;
  revenue?: number;
  lowestCost: number;
  driverType: string;
}): string[] {
  const insights: string[] = [];

  if (data.borderCrossings > 0) {
    insights.push(`⚠️ Route includes ${data.borderCrossings} border crossings ($${data.borderCrossings * 150} total)`);
  }

  if (data.revenue && data.lowestCost > data.revenue) {
    const loss = data.lowestCost - data.revenue;
    insights.push(`⚠️ This load is unprofitable: $${loss.toLocaleString()} loss with best driver option`);
  }

  if (data.estimatedMiles > 500) {
    insights.push(`ℹ️ Long haul route (${data.estimatedMiles} miles) - consider HOS regulations`);
  }

  if (data.driverType === 'RNR') {
    insights.push(`✅ Rental driver recommended for cost efficiency on this route`);
  }

  return insights;
}
