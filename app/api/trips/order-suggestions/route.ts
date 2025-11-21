import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const { orders } = await request.json();

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        suggestions: [],
        message: "No orders available for booking",
      });
    }

    // Build context for Claude
    const ordersContext = orders.map((order: any, index: number) => {
      const ageHours = order.ageHours || 0;
      const ageDays = Math.floor(ageHours / 24);
      const ageDisplay = ageDays > 0 ? `${ageDays}d ${ageHours % 24}h` : `${ageHours}h`;
      
      return `${index + 1}. Order ${order.reference || order.id}
   - Customer: ${order.customer}
   - Route: ${order.pickup} → ${order.delivery}
   - Miles: ${order.laneMiles || 'Unknown'}
   - Status: ${order.status}
   - Age: ${ageDisplay} since placed
   - Window: ${order.window}
   - Service Level: ${order.serviceLevel || 'Standard'}
   - Commodity: ${order.commodity || 'General'}`;
    }).join('\n\n');

    const prompt = `You are a transportation dispatch AI assistant. Analyze these unassigned orders and recommend which ones should be prioritized for booking a trip.

**ORDERS TO ANALYZE:**
${ordersContext}

**PRIORITIZATION CRITERIA:**
1. **Urgency**: Time-sensitive orders with tight pickup windows
2. **Age**: Orders that have been waiting longest
3. **Service Level**: Premium service levels get priority
4. **Risk**: Orders at risk of becoming late
5. **Lane Efficiency**: Orders on high-volume or profitable lanes

**YOUR TASK:**
Recommend the TOP 3 orders that should be booked first, explaining WHY each one is a priority.

Respond with JSON only:
{
  "topOrders": [
    {
      "orderId": "order id",
      "reference": "order reference",
      "priority": "URGENT|HIGH|MEDIUM",
      "reason": "Brief reason why this is priority",
      "urgencyScore": 1-100,
      "riskFactors": ["list of risk factors"]
    }
  ],
  "summary": "Brief overview of the booking situation"
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return NextResponse.json(suggestions);
      }
    }

    throw new Error("No valid response from Claude");
  } catch (error) {
    console.error("Error generating order suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
