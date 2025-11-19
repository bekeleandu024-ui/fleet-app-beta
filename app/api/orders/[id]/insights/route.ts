// app/api/orders/[id]/insights/route.ts

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
  const { id: orderId } = await params;

  try {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 503 }
      );
    }

    // 1. Fetch order data
    const orderData = await fetchOrderData(orderId);
    
    // 2. Enrich with available drivers, units, and costing
    const enrichedData = await enrichOrderData(orderData);
    
    // 3. Generate AI insights
    const insights = await generateOrderInsights(enrichedData);
    
    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error generating order insights:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

async function fetchOrderData(orderId: string) {
  return serviceFetch('orders', `/api/orders/${orderId}`);
}

async function enrichOrderData(order: any) {
  // Fetch available drivers and units for this route
  const results = await Promise.allSettled([
    serviceFetch('masterData', `/api/metadata/drivers`),
    serviceFetch('masterData', `/api/metadata/units`),
  ]);

  const driversData = results[0].status === 'fulfilled' ? results[0].value : { drivers: [] };
  const unitsData = results[1].status === 'fulfilled' ? results[1].value : { units: [] };

  // Extract and filter drivers/units
  const allDrivers = (driversData as any).drivers || [];
  const allUnits = (unitsData as any).units || [];

  // Simple filtering - take first 5 available
  const availableDrivers = allDrivers.slice(0, 5);
  const availableUnits = allUnits.slice(0, 5);

  // Build costing estimate
  const costing = {
    totalCost: order.estimated_cost || 2500,
    revenue: order.estimated_revenue || 3000,
    margin: order.margin || 20,
    miles: order.distance_miles || order.miles || 750,
  };

  return {
    order,
    availableDrivers,
    availableUnits,
    costing,
  };
}

async function generateOrderInsights(data: any) {
  const { order, availableDrivers, availableUnits, costing } = data;

  const prompt = `You are a logistics AI assistant analyzing a freight order. Generate dispatch recommendations.

ORDER DETAILS:
- Order ID: ${order.id}
- Status: ${order.status}
- Customer: ${order.customer}
- Route: ${order.pickup_location} → ${order.dropoff_location}
- Service Level: ${order.serviceLevel || 'Standard'}
- Commodity: ${order.commodity || 'General'}
- Age: ${order.ageHours || 0} hours

PICKUP WINDOW:
- Start: ${order.pickup_window_start}
- End: ${order.pickup_window_end}

DELIVERY WINDOW:
- Start: ${order.delivery_window_start}
- End: ${order.delivery_window_end}

COSTING:
- Estimated Cost: $${costing.totalCost || 'N/A'}
- Estimated Revenue: $${costing.revenue || 'N/A'}
- Target Margin: ${costing.margin || 'N/A'}%
- Distance: ${costing.miles || 'N/A'} miles

AVAILABLE DRIVERS (Top 5):
${availableDrivers.map((d: any, i: number) => 
  `${i + 1}. ${d.name} - ${d.region} - ${d.hoursAvailable || 0}hrs available`
).join('\n')}

AVAILABLE UNITS (Top 5):
${availableUnits.map((u: any, i: number) => 
  `${i + 1}. ${u.unitNumber} - ${u.type} - ${u.location}`
).join('\n')}

ANALYZE AND PROVIDE:
1. **Urgency Assessment** - How urgent is this order? (based on age and windows)
2. **Driver Recommendation** - Which driver is best and why?
3. **Unit Recommendation** - Which unit is best and why?
4. **Cost Optimization** - Any ways to improve margin?
5. **Risk Factors** - Potential issues (tight windows, distance, weather, etc.)
6. **Dispatch Priority** - Should this be dispatched immediately?

Format as JSON:
{
  "summary": "Brief overview",
  "urgency": "low" | "medium" | "high" | "critical",
  "recommendedDriver": {
    "id": "driver_id",
    "name": "Driver name",
    "reason": "Why this driver"
  },
  "recommendedUnit": {
    "id": "unit_id",
    "number": "Unit number",
    "reason": "Why this unit"
  },
  "insights": [
    {
      "category": "URGENCY" | "DRIVER" | "UNIT" | "COST" | "RISK" | "DISPATCH",
      "title": "Insight title",
      "description": "Detailed explanation",
      "severity": "info" | "success" | "warning" | "error",
      "action": "Recommended action"
    }
  ]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

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
        urgency: 'medium',
        insights: [{
          category: 'URGENCY',
          title: 'Order Analysis',
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
