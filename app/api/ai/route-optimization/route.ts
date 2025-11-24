import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { serviceFetch } from '@/lib/service-client';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * POST /api/ai/route-optimization
 * Get AI-powered route optimization using Claude
 */
export async function POST(req: NextRequest) {
  try {
    const { origin, destination, miles, revenue, orderId } = await req.json();

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 503 }
      );
    }

    // Fetch real order data if orderId provided
    let orderData = null;
    if (orderId) {
      try {
        orderData = await serviceFetch('orders', `/api/orders/${orderId}`);
      } catch (err) {
        console.error('Failed to fetch order data:', err);
      }
    }

    // Get costing data from master-data service
    const results = await Promise.allSettled([
      serviceFetch('masterData', '/api/metadata/drivers'),
      serviceFetch('masterData', '/api/metadata/units'),
    ]);

    const driversData = results[0].status === 'fulfilled' ? results[0].value : { drivers: [] };
    const unitsData = results[1].status === 'fulfilled' ? results[1].value : { units: [] };

    const drivers = (driversData as any).drivers || (driversData as any).data || [];
    const units = (unitsData as any).units || (unitsData as any).data || [];

    // Filter to available resources
    const availableDrivers = drivers.filter((d: any) => 
      d.status === 'Ready' || d.status === 'Available'
    );
    const availableUnits = units.filter((u: any) => 
      u.status === 'Available' || u.status === 'Ready'
    );

    // Use actual miles from order or provided, fallback to estimate
    const estimatedMiles = orderData?.distance_miles || miles || estimateDistance(origin, destination);
    const actualRevenue = orderData?.estimated_revenue || revenue;

    // Build prompt for Claude
    const prompt = `You are a logistics optimization AI. Analyze this freight route and provide driver/unit recommendations.

ROUTE DETAILS:
- Origin: ${origin}
- Destination: ${destination}
- Distance: ${estimatedMiles} miles
- Estimated Revenue: $${actualRevenue || 'Not specified'}
${orderData ? `- Order ID: ${orderData.id}
- Customer: ${orderData.customer_id || 'Unknown'}
- Status: ${orderData.status || 'Unknown'}` : ''}

AVAILABLE DRIVERS (${availableDrivers.length}):
${availableDrivers.slice(0, 5).map((d: any, i: number) => 
  `${i + 1}. ${d.name || d.driver_name || d.id} - Type: ${d.driver_type || 'Unknown'} - Base: $${d.base_wage_cpm || 'N/A'}/mi - Available: ${d.hoursAvailable || d.hours_available || 'Unknown'}hrs`
).join('\n')}

AVAILABLE UNITS (${availableUnits.length}):
${availableUnits.slice(0, 5).map((u: any, i: number) => 
  `${i + 1}. ${u.unitNumber || u.unit_number || u.id} - Type: ${u.type || u.unit_type || 'Unknown'} - Weekly Cost: $${u.total_weekly_cost || 'N/A'} - Location: ${u.location || 'Unknown'}`
).join('\n')}

YOUR TASK:
Analyze costs, route efficiency, and provide:
1. Best 3 driver recommendations with cost analysis
2. Border crossing analysis if applicable
3. Route optimization insights
4. Cost comparison between driver types
5. Estimated total trip cost and time

Respond with ONLY valid JSON (no markdown):
{
  "recommendation": "Overall best recommendation with driver name",
  "totalDistance": ${estimatedMiles},
  "estimatedTime": "X hours driving time",
  "borderCrossings": 0 or 1 or 2,
  "estimatedCost": calculated total cost as number,
  "driverRecommendations": [
    {
      "driverId": "actual driver ID from list",
      "driverName": "driver name from list",
      "unit": "recommended unit number",
      "driverType": "COM|RNR|OO",
      "weeklyCost": weekly cost as number,
      "baseWage": base wage as number,
      "fuelRate": fuel rate as number,
      "reason": "why this driver is optimal",
      "estimatedCost": total cost as number,
      "totalCpm": cost per mile as number
    }
  ],
  "costComparison": [
    {
      "type": "driver type",
      "driver": "driver name",
      "weeklyCost": number,
      "estimatedCost": number,
      "pros": ["advantage 1", "advantage 2"],
      "cons": ["disadvantage 1"]
    }
  ],
  "insights": ["insight 1", "insight 2", "insight 3"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      try {
        // Extract JSON from response
        let jsonText = content.text;
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return NextResponse.json(result);
        }
        
        throw new Error('No JSON found in Claude response');
      } catch (parseError) {
        console.error('Error parsing Claude response:', parseError, content.text);
        return NextResponse.json(
          { error: 'Failed to parse AI response' },
          { status: 500 }
        );
      }
    }

    throw new Error('Invalid AI response format');
  } catch (error: any) {
    console.error('Route optimization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate route optimization' },
      { status: 500 }
    );
  }
}

function estimateDistance(origin: string, destination: string): number {
  // Simple estimation fallback
  const cities: Record<string, { lat: number; lon: number }> = {
    'London': { lat: 42.9849, lon: -81.2453 },
    'Cleveland': { lat: 41.4993, lon: -81.6944 },
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

