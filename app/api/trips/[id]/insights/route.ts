// app/api/trips/[id]/insights/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tripId } = await params;

  try {
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
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

// Fetch trip data from tracking service
async function fetchTripData(tripId: string) {
  const response = await fetch(`http://localhost:4004/api/trips/${tripId}`);
  if (!response.ok) throw new Error('Failed to fetch trip');
  return response.json();
}

// Enrich with driver, unit, order, and costing data
async function enrichTripData(trip: any) {
  const [driver, unit, order, costing] = await Promise.all([
    fetch(`http://localhost:4001/api/drivers/${trip.driver_id}`).then(r => r.json()),
    fetch(`http://localhost:4001/api/units/${trip.unit_id}`).then(r => r.json()),
    fetch(`http://localhost:4002/api/orders/${trip.order_id}`).then(r => r.json()),
    fetch(`http://localhost:4004/api/trips/${trip.id}/cost`).then(r => r.json()),
  ]);

  return {
    trip,
    driver,
    unit,
    order,
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
    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  }

  throw new Error('Failed to parse AI response');
}
