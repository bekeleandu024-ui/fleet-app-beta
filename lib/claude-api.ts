import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface TripInsightsContext {
  trip: any;
  order: any;
  driver: any;
  unit: any;
  costing: any;
  alternatives?: any[];
}

export async function generateTripInsights(
  context: TripInsightsContext
): Promise<any> {
  const { trip, order, driver, unit, costing, alternatives } = context;

  const prompt = buildInsightsPrompt(context);

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      // Parse the structured response
      const insights = parseInsightsResponse(content.text, context);
      return insights;
    }

    throw new Error("Unexpected response format from Claude");
  } catch (error: any) {
    console.error("Claude API error:", error);
    throw new Error(`Failed to generate AI insights: ${error.message}`);
  }
}

function buildInsightsPrompt(context: TripInsightsContext): string {
  const { trip, order, driver, unit, costing, alternatives } = context;

  return `You are a fleet management AI analyst. Analyze this trip and provide actionable insights.

**TRIP DETAILS:**
- Trip ID: ${trip.id}
- Route: ${trip.pickup} → ${trip.delivery}
- Distance: ${trip.estimatedDistance} miles
- Duration: ${trip.estimatedDuration} hours
- Status: ${trip.status}
- On-time Pickup: ${trip.onTimePickup ? "Yes" : "No"}
- On-time Delivery: ${trip.onTimeDelivery ? "Yes" : "No"}

**ORDER INFORMATION:**
${order ? `- Customer: ${order.customer}
- Commodity: ${order.commodity || "Standard freight"}
- Service Level: ${order.serviceLevel || "Standard"}
- Revenue: $${order.revenue || "N/A"}` : "- Order details not available"}

**CURRENT ASSIGNMENT:**
${driver ? `- Driver: ${driver.name} (${driver.type})
- Location: ${driver.location || "Unknown"}
- Hours Available: ${driver.hoursAvailable || "Unknown"}
- On-time Rate: ${driver.onTimeRate ? (driver.onTimeRate * 100).toFixed(1) + "%" : "N/A"}
- Estimated Cost: $${driver.estimatedCost}` : "- Driver not assigned"}

${unit ? `- Unit: ${unit.unitNumber} (${unit.type})
- Status: ${unit.status}
- Location: ${unit.location || "Unknown"}` : ""}

**COST BREAKDOWN:**
- Linehaul: $${costing.linehaulCost}
- Fuel: $${costing.fuelCost}
- Driver: $${costing.driverCost}
- Total Cost: $${costing.totalCost}
- Margin: ${costing.margin}%
- Recommended Revenue: $${costing.recommendedRevenue}

**ALTERNATIVE DRIVERS:**
${alternatives && alternatives.length > 0 ? alternatives.map(alt => 
  `- ${alt.name} (${alt.type}): $${alt.estimatedCost} (saves $${(costing.driverCost - alt.estimatedCost).toFixed(0)})`
).join("\n") : "- No alternatives available"}

Provide insights in the following JSON structure:
{
  "summary": "Brief 1-sentence trip description",
  "marginAnalysis": {
    "status": "healthy|warning|critical",
    "message": "Analysis of profit margin",
    "recommendation": "Specific recommendation"
  },
  "driverAnalysis": {
    "currentAssignment": "Assessment of current driver",
    "recommendation": "Should driver be changed? Why or why not?",
    "bestAlternative": "Name and reason if change recommended",
    "costImpact": "Savings or cost increase amount"
  },
  "riskFactors": [
    "List any risks: late delivery, driver fatigue, route issues, etc."
  ],
  "keyInsights": [
    "3-5 bullet points of actionable insights"
  ],
  "recommendations": [
    "Specific actionable recommendations"
  ]
}

Respond ONLY with the JSON object, no other text.`;
}

function parseInsightsResponse(response: string, context: TripInsightsContext): any {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Enhance with context data
      return {
        ...parsed,
        routeProfile: {
          distance: context.trip.estimatedDistance,
          duration: context.trip.estimatedDuration,
          pickup: context.trip.pickup,
          delivery: context.trip.delivery,
        },
        costBreakdown: context.costing,
        currentDriver: context.driver,
        alternatives: context.alternatives || [],
      };
    }
    
    throw new Error("No JSON found in response");
  } catch (error) {
    console.error("Failed to parse Claude response:", error);
    // Return fallback structure
    return {
      summary: `${context.trip.pickup} → ${context.trip.delivery} run`,
      marginAnalysis: {
        status: context.costing.margin >= 15 ? "healthy" : "warning",
        message: `Margin of ${context.costing.margin}% is ${context.costing.margin >= 15 ? "healthy" : "below target"}`,
        recommendation: context.costing.margin < 15 ? "Consider optimizing costs or adjusting pricing" : "Current margin is acceptable",
      },
      driverAnalysis: {
        currentAssignment: context.driver ? `${context.driver.name} (${context.driver.type})` : "Not assigned",
        recommendation: "Current assignment is appropriate",
        bestAlternative: null,
        costImpact: 0,
      },
      riskFactors: [],
      keyInsights: [
        `Trip covers ${context.trip.estimatedDistance} miles`,
        `Current margin: ${context.costing.margin}%`,
        (context.alternatives && context.alternatives.length > 0) ? `${context.alternatives.length} alternative drivers available` : "No alternatives available",
      ],
      recommendations: ["Monitor trip progress", "Track on-time performance"],
      routeProfile: {
        distance: context.trip.estimatedDistance,
        duration: context.trip.estimatedDuration,
        pickup: context.trip.pickup,
        delivery: context.trip.delivery,
      },
      costBreakdown: context.costing,
      currentDriver: context.driver,
      alternatives: context.alternatives || [],
    };
  }
}

export async function generateFleetInsights(tripsData: any[]): Promise<any> {
  const prompt = `Analyze this fleet data and provide insights:

**ACTIVE TRIPS:** ${tripsData.filter(t => t.status === "in_transit").length}
**TOTAL TRIPS:** ${tripsData.length}

Provide brief insights on:
1. Fleet utilization
2. Any trips at risk
3. Overall efficiency

Respond with JSON: { "utilization": "X%", "risks": [], "summary": "Brief overview" }`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    return {
      utilization: "Unknown",
      risks: [],
      summary: "Unable to generate fleet insights",
    };
  } catch (error) {
    console.error("Failed to generate fleet insights:", error);
    return {
      utilization: "Unknown",
      risks: [],
      summary: "Unable to generate fleet insights",
    };
  }
}

// ============= ORDER ASSISTANT FUNCTIONS =============

interface ParsedOrderData {
  customer?: string;
  origin?: string;
  destination?: string;
  puWindowStart?: string;
  puWindowEnd?: string;
  delWindowStart?: string;
  delWindowEnd?: string;
  requiredTruck?: string;
  notes?: string;
  confidence: {
    [key: string]: number;
  };
  warnings: string[];
}

export async function parseOrderOCR(text: string): Promise<ParsedOrderData> {
  const prompt = `You are an expert at parsing transportation order emails and documents. Extract order details from the following text.

**TEXT TO PARSE:**
${text}

**INSTRUCTIONS:**
1. Extract customer name (shipper or company name)
2. Extract origin/pickup location (city, state format preferred)
3. Extract destination/delivery location (city, state format)
4. Extract pickup date/time windows (start and end)
5. Extract delivery date/time windows (start and end)
6. Identify truck/equipment type needed (Dry Van, Flatbed, Reefer, etc.)
7. Extract any special instructions or notes
8. Handle typos, abbreviations, and informal language
9. Provide confidence scores (0-100) for each extracted field
10. Flag any warnings or ambiguities

**COMMON PATTERNS TO RECOGNIZE:**
- "PU" or "Pickup" = origin
- "DEL" or "Delivery" or "Drop" = destination
- Equipment: "53' dry van", "flatbed", "reefer", "refers to refrigerated"
- Date formats: various formats like "12/20", "Dec 20", "tomorrow"
- Time windows: "8am-5pm", "0800-1700", "morning", "afternoon"

Return ONLY a JSON object with this structure:
{
  "customer": "Company Name or null",
  "origin": "City, State or null",
  "destination": "City, State or null",
  "puWindowStart": "ISO datetime or null",
  "puWindowEnd": "ISO datetime or null",
  "delWindowStart": "ISO datetime or null",
  "delWindowEnd": "ISO datetime or null",
  "requiredTruck": "Truck type or null",
  "notes": "Special instructions or null",
  "confidence": {
    "customer": 0-100,
    "origin": 0-100,
    "destination": 0-100,
    "dates": 0-100,
    "truck": 0-100
  },
  "warnings": ["List any ambiguities or concerns"]
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error("No JSON response from Claude");
  } catch (error: any) {
    console.error("OCR parsing error:", error);
    return {
      confidence: {},
      warnings: ["Failed to parse text automatically. Please enter details manually."],
    };
  }
}

interface FieldSuggestion {
  field: string;
  suggestions: Array<{
    value: string;
    reason: string;
    confidence: number;
  }>;
}

export async function suggestOrderFields(
  partialOrder: any,
  historicalOrders: any[] = []
): Promise<FieldSuggestion[]> {
  const prompt = `You are a logistics AI assistant. Based on partial order data and historical patterns, suggest values for incomplete fields.

**PARTIAL ORDER:**
${JSON.stringify(partialOrder, null, 2)}

**HISTORICAL ORDERS (for pattern recognition):**
${historicalOrders.length > 0 ? JSON.stringify(historicalOrders.slice(0, 5), null, 2) : "No historical data available"}

**YOUR TASK:**
Suggest smart completions for missing or incomplete fields:
- If customer is entered but origin is blank, suggest common origins for this customer
- If origin/destination are set, suggest appropriate truck type based on distance/route
- Suggest time windows based on distance and typical patterns
- Detect if entered data needs correction (e.g., "LA" should be "Los Angeles, CA")
- Provide reasoning for each suggestion

Return JSON array:
[
  {
    "field": "fieldName",
    "suggestions": [
      {
        "value": "suggested value",
        "reason": "why this makes sense",
        "confidence": 0-100
      }
    ]
  }
]`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    return [];
  } catch (error) {
    console.error("Field suggestion error:", error);
    return [];
  }
}

interface OrderValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: "error" | "warning" | "info";
  }>;
  suggestions: string[];
  riskScore: number;
}

export async function validateOrder(orderData: any): Promise<OrderValidation> {
  const prompt = `You are a logistics validation expert. Analyze this order for issues, risks, and improvements.

**ORDER DATA:**
${JSON.stringify(orderData, null, 2)}

**VALIDATION CHECKS:**
1. Required fields present and valid
2. Dates logical (pickup before delivery, realistic transit time)
3. Locations valid and properly formatted
4. Equipment type appropriate for the route
5. Risk factors (tight windows, long distance, etc.)
6. Common mistakes or ambiguities
7. Missing information that should be added
8. Compliance requirements (e.g., border crossings, hazmat)

**MARKET INTELLIGENCE:**
- Typical transit time for this distance
- Whether time windows are realistic
- Equipment availability concerns
- Rate reasonableness

Return JSON:
{
  "isValid": true/false,
  "errors": [
    {
      "field": "fieldName",
      "message": "Clear error description",
      "severity": "error|warning|info"
    }
  ],
  "suggestions": [
    "Helpful suggestions to improve the order"
  ],
  "riskScore": 0-100 (higher = more risky)
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type === "text") {
      // Try to extract JSON from the response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          // Try to clean up common JSON issues
          let cleanedJson = jsonMatch[0];
          // Remove trailing commas before closing brackets/braces
          cleanedJson = cleanedJson.replace(/,\s*([\]}])/g, '$1');
          // Try parsing again
          try {
            return JSON.parse(cleanedJson);
          } catch (secondError) {
            console.error("JSON parsing failed after cleanup:", secondError);
            throw parseError; // Throw original error
          }
        }
      }
    }

    throw new Error("No validation response");
  } catch (error) {
    console.error("Order validation error:", error);
    return {
      isValid: false,
      errors: [{ field: "general", message: "Validation service unavailable", severity: "warning" }],
      suggestions: [],
      riskScore: 50,
    };
  }
}

export async function chatWithOrderAssistant(
  message: string,
  context: {
    currentOrder?: any;
    conversationHistory?: Array<{ role: string; content: string }>;
  } = {}
): Promise<string> {
  const { currentOrder, conversationHistory = [] } = context;

  const systemPrompt = `You are an intelligent order entry assistant for a transportation management system. 
  
Your role:
- Help users enter order details quickly and accurately
- Answer questions about order requirements, routing, equipment, etc.
- Provide proactive suggestions and catch potential issues
- Be concise but helpful
- Use transportation industry terminology appropriately

Current order context:
${currentOrder ? JSON.stringify(currentOrder, null, 2) : "No order data yet"}

Respond naturally and helpfully. If asked to perform actions like "book a load", extract the details and confirm.`;

  try {
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...conversationHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 800,
      system: systemPrompt,
      messages,
    });

    const content = response.content[0];
    if (content.type === "text") {
      return content.text;
    }

    return "I'm here to help with your order. What do you need?";
  } catch (error) {
    console.error("Chat assistant error:", error);
    return "I'm having trouble responding right now. Please try again.";
  }
}
