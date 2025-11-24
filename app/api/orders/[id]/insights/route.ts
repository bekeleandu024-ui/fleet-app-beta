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

  // Extract actual pricing from order data
  const revenueStr = order.pricing?.totals?.value?.replace(/[^0-9.]/g, '') || '0';
  const revenue = parseFloat(revenueStr) || 0;
  
  // Calculate cost from pricing items if available
  let totalCost = 0;
  if (order.pricing?.items) {
    totalCost = order.pricing.items.reduce((sum: number, item: any) => {
      const itemValue = parseFloat(item.value?.replace(/[^0-9.]/g, '') || '0');
      return sum + itemValue;
    }, 0);
  }
  
  // Extract margin from pricing if available
  const marginItem = order.pricing?.items?.find((item: any) => 
    item.label?.toLowerCase().includes('margin')
  );
  const marginStr = marginItem?.value?.replace(/[^0-9.]/g, '') || '0';
  const margin = parseFloat(marginStr) || 0;

  const costing = {
    totalCost,
    revenue,
    margin,
    miles: order.laneMiles || 0,
  };

  console.log('Costing data:', costing);

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

  // Extract stops data
  const pickup = order.snapshot?.stops?.find((s: any) => s.type === 'Pickup');
  const delivery = order.snapshot?.stops?.find((s: any) => s.type === 'Delivery');
  
  const prompt = `You are a logistics AI assistant analyzing a freight order. Provide actionable dispatch recommendations.

ORDER DETAILS:
- Order ID: ${order.id || order.reference}
- Status: ${order.status}
- Customer: ${order.customer}
- Route: ${order.lane}
- Distance: ${order.laneMiles || 0} miles
- Age: ${order.ageHours || 0} hours old
- Service Level: ${order.serviceLevel}
- Commodity: ${order.snapshot?.commodity || 'Unknown'}
- Special Notes: ${order.snapshot?.notes || 'None'}

STOPS:
- Pickup: ${pickup?.location || 'Not specified'} (${pickup?.windowStart ? new Date(pickup.windowStart).toLocaleString() : 'No time window'} - ${pickup?.windowEnd ? new Date(pickup.windowEnd).toLocaleString() : ''})
${pickup?.instructions ? `  Instructions: ${pickup.instructions}` : ''}
- Delivery: ${delivery?.location || 'Not specified'} (${delivery?.windowStart ? new Date(delivery.windowStart).toLocaleString() : 'No time window'} - ${delivery?.windowEnd ? new Date(delivery.windowEnd).toLocaleString() : ''})
${delivery?.instructions ? `  Instructions: ${delivery.instructions}` : ''}

COSTING:
- Estimated Cost: $${costing.totalCost || 'Not calculated'}
- Estimated Revenue: $${costing.revenue || 'Not calculated'}
- Target Margin: ${costing.margin || 'Not set'}%
- Distance: ${costing.miles || 'Unknown'} miles

BOOKING RECOMMENDATIONS (from system):
${order.booking?.recommendedDriverId ? `- Recommended Driver ID: ${order.booking.recommendedDriverId}` : ''}
${order.booking?.recommendedUnitId ? `- Recommended Unit ID: ${order.booking.recommendedUnitId}` : ''}

AVAILABLE DRIVERS (${availableDrivers.length} total):
${availableDrivers.length > 0 ? availableDrivers.map((d: any, i: number) => {
  const driverName = d.name || d.driver_name || d.id;
  const driverId = d.id || d.driver_id;
  const hoursAvail = d.hoursAvailable || d.hours_available || 'Unknown';
  const status = d.status || 'Unknown';
  const isRecommended = driverId === order.booking?.recommendedDriverId ? ' ⭐ RECOMMENDED' : '';
  return `${i + 1}. ${driverName} (ID: ${driverId}) - Status: ${status} - Available: ${hoursAvail}hrs${isRecommended}`;
}).join('\n') : 'No drivers currently available in system'}

AVAILABLE UNITS (${availableUnits.length} total):
${availableUnits.length > 0 ? availableUnits.map((u: any, i: number) => {
  const unitNum = u.unitNumber || u.unit_number || u.type || u.id;
  const unitId = u.id;
  const unitType = u.type || u.unit_type || 'Unknown';
  const location = u.location || 'Unknown';
  const status = u.status || 'Unknown';
  const isRecommended = unitId === order.booking?.recommendedUnitId ? ' ⭐ RECOMMENDED' : '';
  return `${i + 1}. Unit ${unitNum} (ID: ${unitId}) - Type: ${unitType} - Location: ${location} - Status: ${status}${isRecommended}`;
}).join('\n') : 'No units currently available in system'}

YOUR TASK:
Analyze this ACTUAL order data (not mock scenarios) and provide:
1. Overall dispatch readiness - is order ready to book NOW?
2. Best driver match from the available list with ID and specific reasoning
3. Best unit match from the available list with ID and specific reasoning
4. ONLY call out genuinely missing data that blocks dispatch (not zero pricing if order is new)
5. Cost/margin analysis (if pricing is $0, note "Pricing pending" not "missing")
6. Actual risks based on time windows, lead time, route complexity
7. Urgency level based on pickup date proximity

Be honest about what data is ACTUALLY present vs missing. Don't fabricate problems.

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "summary": "1-2 sentence honest assessment of order status and readiness",
  "urgency": "low|medium|high|critical",
  "recommendedDriver": {
    "id": "actual driver ID from available list (or system recommended if marked)",
    "name": "Actual driver name from the list",
    "reason": "Specific reason based on availability, hours, or system recommendation"
  },
  "recommendedUnit": {
    "id": "actual unit ID from available list (or system recommended if marked)",
    "number": "Actual unit number from the list",
    "reason": "Specific reason based on type match, location, or system recommendation"
  },
  "insights": [
    {
      "category": "URGENCY|DRIVER|UNIT|COST|RISK|DISPATCH",
      "title": "Short title describing ACTUAL situation",
      "description": "Honest assessment based on real order data",
      "severity": "info|success|warning|error",
      "action": "Actionable recommendation based on actual data"
    }
  ]
}

RULES:
- If drivers ARE available, acknowledge them - don't say "No drivers available"
- If delivery date IS present in stops, acknowledge it - don't say "Missing delivery date"
- If pricing is $0 on a new order, that's normal - say "Pricing pending" not "missing"
- Focus on REAL blockers, not hypothetical ones
- Use "success" severity for things that are working well

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
