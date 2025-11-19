// app/api/trips/[id]/insights/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { serviceFetch } from '@/lib/service-client';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tripId } = await params;

  try {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 503 }
      );
    }

    // 1. Fetch trip data from your microservices
    const tripData = await fetchTripData(tripId);
    
    // 2. Fetch related data (driver, unit, order, costing)
    const enrichedData = await enrichTripData(tripData);
    
    // 3. Generate AI insights using Claude
    const insights = await generateTripInsights(enrichedData);
    
    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error generating trip insights:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

// Fetch trip data from tracking service using serviceFetch
async function fetchTripData(tripId: string) {
  return serviceFetch('tracking', `/api/trips/${tripId}`);
}

// Enrich with driver, unit, order, and costing data
async function enrichTripData(trip: any) {
  const results = await Promise.allSettled([
    serviceFetch('masterData', `/api/metadata/drivers`).then((data: any) => 
      (data.drivers || []).find((d: any) => d.driver_id === trip.driver_id || d.id === trip.driver_id)
    ),
    serviceFetch('masterData', `/api/metadata/units`).then((data: any) => 
      (data.units || []).find((u: any) => u.unit_id === trip.unit_id || u.id === trip.unit_id)
    ),
    trip.order_id ? serviceFetch('orders', `/api/orders/${trip.order_id}`).catch(() => null) : Promise.resolve(null),
  ]);

  const driver = results[0].status === 'fulfilled' ? results[0].value : null;
  const unit = results[1].status === 'fulfilled' ? results[1].value : null;
  const order = results[2].status === 'fulfilled' ? results[2].value : null;

  // Build costing from trip data
  const costing = {
    miles: trip.distance_miles || trip.miles || 0,
    hours: trip.est_duration_hours || trip.duration_hours || 0,
    totalCost: trip.total_cost || trip.totalCost || 0,
    revenue: trip.recommended_revenue || trip.revenue || 0,
    margin: trip.margin_pct || trip.margin || 0,
    linehaul: trip.linehaul_cost || trip.linehaul || 0,
    fuel: trip.fuel_cost || trip.fuel || 0,
    accessorials: trip.accessorial_cost || trip.accessorials || 0,
  };

  return {
    trip,
    driver: driver || { name: 'Unknown', region: 'N/A', status: 'Unknown' },
    unit: unit || { unitNumber: 'Unknown', type: 'N/A', status: 'Unknown', location: 'N/A' },
    order: order || { customer: 'Unknown', serviceLevel: 'Standard', commodity: 'General' },
    costing,
  };
}

// Generate insights using Claude
async function generateTripInsights(data: any) {
  const { trip, driver, unit, order, costing } = data;

  // Build context for Claude
  const prompt = `You are a logistics AI assistant analyzing a freight trip. Generate actionable insights.

TRIP DETAILS:
- Trip ID: ${trip.id}
- Status: ${trip.status}
- Route: ${trip.pickup_location} → ${trip.dropoff_location}
- Distance: ${costing.miles || 'N/A'} miles
- Duration: ${costing.hours || 'N/A'} hours

DRIVER:
- Name: ${driver.name}
- Region: ${driver.region}
- Status: ${driver.status || 'Unknown'}
- Hours Available: ${driver.hoursAvailable || 'N/A'}

UNIT:
- Unit Number: ${unit.unitNumber}
- Type: ${unit.type}
- Status: ${unit.status}
- Location: ${unit.location}

ORDER:
- Customer: ${order.customer}
- Service Level: ${order.serviceLevel || 'Standard'}
- Commodity: ${order.commodity || 'General'}

COSTING:
- Estimated Cost: $${costing.totalCost || 'N/A'}
- Revenue: $${costing.revenue || 'N/A'}
- Margin: ${costing.margin || 'N/A'}%
- Breakdown: Linehaul $${costing.linehaul || 0}, Fuel $${costing.fuel || 0}, Accessorials $${costing.accessorials || 0}

ANALYZE AND PROVIDE:
1. **Trip Profile** - Route characteristics, distance, timing
2. **Margin Analysis** - Is the margin healthy? Any concerns?
3. **Driver Optimization** - Is this the best driver choice? Any cost savings opportunities?
4. **Cost Breakdown** - Explain the cost structure
5. **Risk Assessment** - Any potential issues or delays?
6. **Recommendations** - Actionable next steps

Format as JSON:
{
  "summary": "Brief overview",
  "insights": [
    {
      "category": "TRIP_PROFILE" | "MARGIN" | "DRIVER_CHOICE" | "COST" | "RISK",
      "title": "Insight title",
      "description": "Detailed explanation",
      "severity": "info" | "success" | "warning" | "error",
      "action": "Optional recommended action"
    }
  ]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Parse Claude's response
  const content = message.content[0];
  if (content.type === 'text') {
    try {
      // Extract JSON from response (Claude might wrap it in markdown)
      let jsonText = content.text;
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, return a fallback structure
      console.error('No JSON found in Claude response:', content.text);
      return {
        summary: 'AI analysis completed but response format was unexpected.',
        insights: [{
          category: 'TRIP_PROFILE',
          title: 'Trip Analysis',
          description: content.text.substring(0, 200),
          severity: 'info'
        }]
      };
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      throw new Error('Failed to parse AI response');
    }
  }

  throw new Error('Invalid AI response format');
}
