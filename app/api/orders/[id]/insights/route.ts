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
  console.log('Fetching order data for:', orderId);
  const data = await serviceFetch('orders', `/api/orders/${orderId}`);
  console.log('Order data received:', data ? 'success' : 'null');
  return data;
}

async function enrichOrderData(order: any) {
  console.log('Enriching order data...');
  
  // Fetch available drivers and units for this route
  const results = await Promise.allSettled([
    serviceFetch('masterData', `/api/metadata/drivers`),
    serviceFetch('masterData', `/api/metadata/units`),
  ]);

  const driversData = results[0].status === 'fulfilled' ? results[0].value : { drivers: [] };
  const unitsData = results[1].status === 'fulfilled' ? results[1].value : { units: [] };

  console.log('Drivers result:', results[0].status, driversData);
  console.log('Units result:', results[1].status, unitsData);

  // Extract and filter drivers/units
  const allDrivers = (driversData as any).drivers || (driversData as any).data || [];
  const allUnits = (unitsData as any).units || (unitsData as any).data || [];

  // Filter to only ready/available resources
  const availableDrivers = allDrivers
    .filter((d: any) => d.status === 'Ready' || d.status === 'Available')
    .slice(0, 5);
  
  const availableUnits = allUnits
    .filter((u: any) => u.status === 'Available' || u.status === 'Ready')
    .slice(0, 5);

  console.log(`Found ${availableDrivers.length} available drivers, ${availableUnits.length} available units`);

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

  console.log('Generating insights for order:', {
    orderId: order.id,
    status: order.status,
    pickup: order.pickup_location,
    delivery: order.dropoff_location,
    availableDrivers: availableDrivers.length,
    availableUnits: availableUnits.length,
  });

  const prompt = `You are a logistics AI assistant analyzing a freight order. Provide actionable dispatch recommendations.

ORDER DETAILS:
- Order ID: ${order.id}
- Status: ${order.status || 'Unknown'}
- Customer: ${order.customer_id || 'Unknown'}
- Route: ${order.pickup_location || 'N/A'} → ${order.dropoff_location || 'N/A'}
- Order Type: ${order.order_type || 'Standard'}
- Created: ${order.created_at || 'N/A'}
- Special Instructions: ${order.special_instructions || 'None'}

TIME WINDOWS:
- Pickup: ${order.pickup_time || order.pu_window_start || 'Not specified'}
- Delivery: ${order.dropoff_time || order.del_window_start || 'Not specified'}

COSTING:
- Estimated Cost: $${costing.totalCost || 'Not calculated'}
- Estimated Revenue: $${costing.revenue || 'Not calculated'}
- Target Margin: ${costing.margin || 'Not set'}%
- Distance: ${costing.miles || 'Unknown'} miles

AVAILABLE DRIVERS:
${availableDrivers.length > 0 ? availableDrivers.slice(0, 5).map((d: any, i: number) => 
  `${i + 1}. ${d.name || d.id} - Region: ${d.region || 'Unknown'} - Available: ${d.hoursAvailable || 'Unknown'}hrs - Status: ${d.status || 'Unknown'}`
).join('\n') : 'No driver data available'}

AVAILABLE UNITS:
${availableUnits.length > 0 ? availableUnits.slice(0, 5).map((u: any, i: number) => 
  `${i + 1}. ${u.unitNumber || u.id} - Type: ${u.type || 'Unknown'} - Location: ${u.location || 'Unknown'} - Status: ${u.status || 'Unknown'}`
).join('\n') : 'No unit data available'}

YOUR TASK:
Analyze this order and provide:
1. Overall dispatch readiness assessment
2. Best driver match with specific reasoning
3. Best unit match with specific reasoning  
4. Critical missing data or blockers
5. Cost/margin optimization opportunities
6. Risk factors (time windows, distance, equipment, etc.)
7. Urgency level and recommended actions

Be specific and actionable. If data is missing, call it out clearly.

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "summary": "1-2 sentence order assessment with key concern or status",
  "urgency": "low|medium|high|critical",
  "recommendedDriver": {
    "id": "actual driver ID from the list above",
    "name": "Driver name from the list",
    "reason": "Specific reason why this driver is optimal (location, hours, experience)"
  },
  "recommendedUnit": {
    "id": "actual unit ID from the list above", 
    "number": "Unit number from the list",
    "reason": "Specific reason why this unit is optimal (type match, location, availability)"
  },
  "insights": [
    {
      "category": "URGENCY|DRIVER|UNIT|COST|RISK|DISPATCH",
      "title": "Short actionable title",
      "description": "Clear explanation of the issue or opportunity",
      "severity": "info|success|warning|error",
      "action": "Specific recommended action"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, nothing else.`;

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
