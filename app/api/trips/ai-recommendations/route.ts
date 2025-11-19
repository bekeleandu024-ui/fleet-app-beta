import { NextRequest, NextResponse } from "next/server";

interface BookingRecommendationRequest {
  orderId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { orderId }: BookingRecommendationRequest = await request.json();

    // Fetch order details
    const orderResponse = await fetch(
      `${process.env.ORDERS_SERVICE_URL || 'http://localhost:4002'}/orders/${orderId}`
    );
    
    if (!orderResponse.ok) {
      throw new Error('Order not found');
    }

    const order = await orderResponse.json();

    // Fetch available drivers (from master-data service)
    const driversResponse = await fetch(
      `${process.env.MASTER_DATA_SERVICE_URL || 'http://localhost:4001'}/drivers?active=true`
    );
    const drivers = await driversResponse.json();

    // Fetch available units
    const unitsResponse = await fetch(
      `${process.env.MASTER_DATA_SERVICE_URL || 'http://localhost:4001'}/units?active=true`
    );
    const units = await unitsResponse.json();

    // Fetch rate cards from database
    const rateCardsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/rates?active=true`
    );
    const rateCards = await rateCardsResponse.json();

    // Simple recommendation algorithm
    // In production, this would use more sophisticated ML/AI
    
    // Recommend driver (prefer closest to pickup, available hours)
    const suggestedDriver = drivers.data?.[0] || null;

    // Recommend unit (prefer available, not on hold)
    const suggestedUnit = units.data?.[0] || null;

    // Recommend rate (match order type if available)
    const suggestedRate = rateCards[0] || {
      id: 'default',
      rate_type: 'Linehaul',
      zone: 'Regional',
      total_cpm: 1.75,
      fixed_cpm: 0.15,
      wage_cpm: 0.50,
      rolling_cpm: 0.12,
    };

    // Calculate estimated miles (simplified - would use routing API in production)
    const estimatedMiles = 500; // Placeholder

    // Calculate target revenue (15% margin target)
    const estimatedCost = estimatedMiles * suggestedRate.total_cpm;
    const targetRevenue = estimatedCost * 1.15; // 15% margin
    const suggestedRPM = targetRevenue / estimatedMiles;

    // Lookup market rate
    const marketRateResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/market-rates/lookup?` +
      `origin=${encodeURIComponent(order.pickup_location || '')}&` +
      `destination=${encodeURIComponent(order.dropoff_location || '')}`
    );
    
    let marketRate = null;
    if (marketRateResponse.ok) {
      marketRate = await marketRateResponse.json();
    }

    return NextResponse.json({
      order,
      recommendations: {
        driver: suggestedDriver,
        unit: suggestedUnit,
        rate: suggestedRate,
        estimatedMiles,
        estimatedCost,
        targetRevenue,
        suggestedRPM,
        marketRate: marketRate?.rpm || null,
        confidence: 'medium', // Could be calculated based on data freshness
      },
      alternativeDrivers: drivers.data?.slice(1, 4) || [],
      alternativeUnits: units.data?.slice(1, 4) || [],
    });
  } catch (error) {
    console.error('Error generating booking recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
