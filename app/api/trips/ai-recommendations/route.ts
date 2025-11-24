import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface BookingRecommendationRequest {
  orderId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { orderId }: BookingRecommendationRequest = await request.json();

    // Fetch order details
    const orderResponse = await fetch(
      `${process.env.ORDERS_SERVICE_URL || 'http://localhost:4002'}/api/orders/${orderId}`
    );
    
    if (!orderResponse.ok) {
      throw new Error('Order not found');
    }

    const order = await orderResponse.json();

    // Fetch available drivers (not on hold, not already booked)
    const driversResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/drivers?active=true`
    );
    const driversData = await driversResponse.json();
    const allDrivers = driversData.data || driversData || [];
    
    // Filter out drivers that are already on trips
    const drivers = allDrivers.filter((d: any) => d.status !== 'On Trip' && d.status !== 'unavailable');

    // Fetch available units (not on hold, not in use)
    const unitsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/units?active=true&isOnHold=false`
    );
    const unitsData = await unitsResponse.json();
    const units = unitsData.data || unitsData || [];

    // Fetch rate cards
    const rateCardsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/rates?active=true`
    );
    const rateCards = await rateCardsResponse.json();

    // Calculate estimated miles
    const estimatedMiles = order.laneMiles || order.lane_miles || 500;

    // Get AI recommendations using Claude
    const aiRecommendations = await generateAIRecommendations({
      order,
      drivers,
      units,
      rateCards,
      estimatedMiles,
    });

    return NextResponse.json(aiRecommendations);
  } catch (error) {
    console.error('Error generating booking recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

async function generateAIRecommendations(context: {
  order: any;
  drivers: any[];
  units: any[];
  rateCards: any[];
  estimatedMiles: number;
}) {
  const { order, drivers, units, rateCards, estimatedMiles } = context;

  // Build context for Claude
  const driversContext = drivers.slice(0, 10).map((d, i) => 
    `${i + 1}. ${d.name} - ${d.homeBase || d.region} - ${d.hoursAvailableToday || 10}h available - Type: ${d.type || 'Company'}`
  ).join('\n');

  const unitsContext = units.slice(0, 10).map((u, i) =>
    `${i + 1}. ${u.code || u.unit_number} - ${u.type} - ${u.homeBase || u.region} - Status: ${u.status}`
  ).join('\n');

  const ratesContext = rateCards.slice(0, 5).map((r, i) =>
    `${i + 1}. ${r.rate_type} ${r.zone} - $${r.total_cpm.toFixed(2)} CPM`
  ).join('\n');

  const prompt = `You are an expert transportation dispatch AI. Analyze this order and provide comprehensive booking recommendations.

**ORDER DETAILS:**
- Customer: ${order.customer || order.customer_name}
- Route: ${order.pickup || order.pickup_location} → ${order.delivery || order.dropoff_location}
- Distance: ${estimatedMiles} miles
- Window: ${order.window || 'Not specified'}
- Service Level: ${order.serviceLevel || order.service_level || 'Standard'}
- Commodity: ${order.commodity || 'General Freight'}

**AVAILABLE DRIVERS (NOT CURRENTLY ON TRIPS):**
${driversContext}

**AVAILABLE UNITS (NOT ON HOLD OR IN USE):**
${unitsContext}

**DRIVER TYPE COSTS (use these for cost analysis):**
- RNR (Rental): Most economical for short/medium hauls, good for cross-border
- COM (Company): Moderate cost, reliable, good for cross-border
- OO (Owner Operator): Higher cost but flexible, zone-based rates

**RATE CARDS:**
${ratesContext}

**CRITICAL REQUIREMENTS:**
1. ONLY recommend drivers from the "AVAILABLE DRIVERS" list above
2. ONLY recommend units from the "AVAILABLE UNITS" list above
3. Match driver type to most cost-effective option for this distance
4. Consider proximity to pickup location when selecting driver/unit

**YOUR ANALYSIS SHOULD INCLUDE:**

1. **OPTIMAL RESOURCE ASSIGNMENT:**
   - Best AVAILABLE driver (must be from list above, consider: location match, availability, driver type cost, experience)
   - Best AVAILABLE unit (must be from list above, consider: equipment type, location, status)
   - Clear reason explaining WHY each is optimal for THIS specific trip

2. **FINANCIAL OPTIMIZATION:**
   - Recommended rate card
   - Suggested Revenue Per Mile (RPM) - must meet 5% margin floor (minimum)
   - Cost breakdown and margin analysis
   - Market rate comparison (typical $2.00-3.00/mile for this distance)

3. **RISK ASSESSMENT:**
   - On-time delivery risk (LOW/MEDIUM/HIGH)
   - Profitability risk
   - Key risk factors
   - Mitigation suggestions

4. **ROUTE & SCHEDULE:**
   - Estimated transit time in hours
   - Recommended departure time
   - Potential delays or challenges
   - Backhaul opportunities

5. **MARKET INTELLIGENCE:**
   - Is this lane typically profitable? (based on distance and route)
   - Market demand level (HIGH/MEDIUM/LOW)
   - Rate positioning vs market

Respond with JSON only:
{
  "recommendations": {
    "driver": {
      "id": "driver id",
      "name": "driver name",
      "homeBase": "location",
      "hoursAvailableToday": hours,
      "reason": "why this driver"
    },
    "unit": {
      "id": "unit id",
      "code": "unit code",
      "type": "unit type",
      "homeBase": "location",
      "reason": "why this unit"
    },
    "rate": {
      "id": "rate id",
      "rate_type": "type",
      "zone": "zone",
      "total_cpm": cpm_value,
      "reason": "why this rate"
    },
    "estimatedMiles": ${estimatedMiles},
    "estimatedCost": calculated_cost,
    "targetRevenue": calculated_revenue,
    "suggestedRPM": calculated_rpm,
    "marginPercent": margin_percentage,
    "marketRate": estimated_market_rpm,
    "confidence": "high|medium|low"
  },
  "riskAssessment": {
    "onTimeRisk": "LOW|MEDIUM|HIGH",
    "profitabilityRisk": "LOW|MEDIUM|HIGH",
    "riskFactors": ["list of risks"],
    "mitigations": ["list of mitigation actions"]
  },
  "routeOptimization": {
    "estimatedTransitHours": hours,
    "recommendedDeparture": "suggestion",
    "potentialDelays": ["list of potential issues"],
    "backhaul": "backhaul suggestion or null"
  },
  "marketIntelligence": {
    "laneProfitability": "HIGH|MEDIUM|LOW",
    "demandLevel": "HIGH|MEDIUM|LOW",
    "ratePositioning": "above|at|below market",
    "insights": ["key market insights"]
  },
  "alternativeOptions": [
    {
      "type": "driver|unit",
      "option": "alternative name/code",
      "advantage": "why consider this",
      "tradeoff": "what you give up"
    }
  ]
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiAnalysis = JSON.parse(jsonMatch[0]);
        
        // Merge with actual data objects
        if (aiAnalysis.recommendations?.driver) {
          const matchedDriver = drivers.find(d => 
            d.name.toLowerCase().includes(aiAnalysis.recommendations.driver.name.toLowerCase()) ||
            d.id === aiAnalysis.recommendations.driver.id
          );
          if (matchedDriver) {
            aiAnalysis.recommendations.driver = { 
              ...matchedDriver, 
              reason: aiAnalysis.recommendations.driver.reason 
            };
          }
        }

        if (aiAnalysis.recommendations?.unit) {
          const matchedUnit = units.find(u => 
            (u.code || u.unit_number)?.includes(aiAnalysis.recommendations.unit.code) ||
            u.id === aiAnalysis.recommendations.unit.id
          );
          if (matchedUnit) {
            aiAnalysis.recommendations.unit = { 
              ...matchedUnit, 
              code: matchedUnit.code || matchedUnit.unit_number,
              reason: aiAnalysis.recommendations.unit.reason 
            };
          }
        }

        if (aiAnalysis.recommendations?.rate) {
          const matchedRate = rateCards.find(r => 
            r.rate_type === aiAnalysis.recommendations.rate.rate_type ||
            r.id === aiAnalysis.recommendations.rate.id
          );
          if (matchedRate) {
            aiAnalysis.recommendations.rate = { 
              ...matchedRate, 
              reason: aiAnalysis.recommendations.rate.reason 
            };
          }
        }

        return aiAnalysis;
      }
    }

    throw new Error("Invalid AI response");
  } catch (error) {
    console.error("Claude AI error:", error);
    
    // SMART FALLBACK: Use costing logic to make basic recommendations
    // Import costing functions
    const { getAllCostingOptions } = await import('@/lib/costing');
    
    const pickup = order.pickup || order.pickup_location || '';
    const delivery = order.delivery || order.dropoff_location || '';
    
    // Get all costing options
    const costingOptions = getAllCostingOptions(estimatedMiles, pickup, delivery);
    
    // Find the lowest cost option
    const bestOption = costingOptions.reduce((best, current) => 
      current.cost.directTripCost < best.cost.directTripCost ? current : best
    );
    
    // Find best driver based on:
    // 1. Matches the best costing driver type
    // 2. Has hours available
    // 3. Closest to pickup location (Western Ontario for this order)
    const driverTypeMap: Record<string, string[]> = {
      'COM': ['COM', 'Company'],
      'RNR': ['RNR', 'Rental', 'Rail and Ramp'],
      'OO': ['OO', 'Owner Operator']
    };
    
    const matchingTypes = driverTypeMap[bestOption.driverType] || [];
    const bestDrivers = drivers
      .filter((d: any) => matchingTypes.includes(d.type))
      .sort((a: any, b: any) => (b.hoursAvailableToday || 10) - (a.hoursAvailableToday || 10));
    
    const recommendedDriver = bestDrivers[0] || drivers[0];
    const recommendedUnit = units.find((u: any) => 
      u.status === 'Available' && u.type === 'Dry Van'
    ) || units[0];
    
    const estimatedCost = bestOption.cost.directTripCost;
    const targetRevenue = bestOption.cost.recommendedRevenue;
    const suggestedRPM = estimatedMiles > 0 ? targetRevenue / estimatedMiles : 0;
    const marginPercent = targetRevenue > 0 ? ((targetRevenue - estimatedCost) / targetRevenue * 100) : 5;
    
    return {
      recommendations: {
        driver: recommendedDriver ? {
          ...recommendedDriver,
          reason: `Best available ${bestOption.driverType} driver with ${recommendedDriver.hoursAvailableToday || 10}h available. ${bestOption.label} is most cost-effective for this ${estimatedMiles}mi trip.`
        } : null,
        unit: recommendedUnit ? {
          ...recommendedUnit,
          code: recommendedUnit.code || recommendedUnit.unit_number,
          reason: `Available ${recommendedUnit.type} in good condition. Located in ${recommendedUnit.homeBase || 'service area'}.`
        } : null,
        rate: rateCards[0] || null,
        estimatedMiles,
        estimatedCost,
        targetRevenue,
        suggestedRPM,
        marginPercent: Math.round(marginPercent * 100) / 100,
        marketRate: 2.50,
        confidence: "medium"
      },
      riskAssessment: {
        onTimeRisk: estimatedMiles < 300 ? "LOW" : estimatedMiles < 800 ? "MEDIUM" : "HIGH",
        profitabilityRisk: marginPercent >= 15 ? "LOW" : marginPercent >= 8 ? "MEDIUM" : "HIGH",
        riskFactors: [
          ...(recommendedDriver ? [] : ["No available drivers found"]),
          ...(marginPercent < 10 ? ["Margin below 10% - profitability concern"] : []),
          ...(estimatedMiles > 500 ? ["Long haul - increased delivery risk"] : [])
        ],
        mitigations: [
          "Monitor driver hours of service",
          "Track real-time GPS location",
          "Maintain buffer time for delivery window"
        ]
      },
      routeOptimization: {
        estimatedTransitHours: Math.ceil(estimatedMiles / 50),
        recommendedDeparture: "ASAP to meet customer window",
        potentialDelays: estimatedMiles > 200 ? ["Border crossing delays", "Weather conditions"] : [],
        backhaul: null
      },
      marketIntelligence: {
        laneProfitability: marginPercent >= 15 ? "HIGH" : marginPercent >= 10 ? "MEDIUM" : "LOW",
        demandLevel: "MEDIUM",
        ratePositioning: "at market",
        insights: [
          `${bestOption.label} offers best cost efficiency at ${bestOption.cost.totalCPM.toFixed(2)}/mi`,
          `Target revenue: $${targetRevenue.toFixed(2)} (${marginPercent.toFixed(1)}% margin)`
        ]
      },
      alternativeOptions: costingOptions
        .filter(opt => opt.driverType !== bestOption.driverType)
        .slice(0, 2)
        .map(opt => ({
          type: "driver",
          option: opt.label,
          advantage: `Cost: $${opt.cost.directTripCost.toFixed(2)}`,
          tradeoff: `${(((opt.cost.directTripCost - bestOption.cost.directTripCost) / bestOption.cost.directTripCost) * 100).toFixed(1)}% more expensive`
        }))
    };
  }
}

