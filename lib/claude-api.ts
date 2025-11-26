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
      model: "claude-sonnet-4-20250514",
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
      model: "claude-sonnet-4-20250514",
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

export async function parseOrderOCR(text?: string, imageBase64?: string): Promise<ParsedOrderData> {
  // Check if API key is available
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set!");
    return {
      confidence: {},
      warnings: ["API key not configured. Please add ANTHROPIC_API_KEY to .env.local"],
    };
  }

  const prompt = `You are an expert at parsing transportation order emails and documents. Extract order details from the provided text or image.

**INSTRUCTIONS:**
1. Extract customer name (shipper or company name)
2. Extract origin/pickup location (full address preferred, otherwise city, state)
3. Extract destination/delivery location (full address preferred, otherwise city, state)
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
  "origin": "Full Address or City, State or null",
  "destination": "Full Address or City, State or null",
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
    console.log("Calling Claude API for OCR parsing...");
    
    const content: any[] = [];
    
    if (imageBase64) {
      let mediaType = "image/jpeg";
      let imageData = imageBase64;

      if (imageBase64.includes(';base64,')) {
        const parts = imageBase64.split(';base64,');
        mediaType = parts[0].replace('data:', '');
        imageData = parts[1];
      }
      
      // Ensure media type is supported (jpeg, png, gif, webp)
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
        mediaType = 'image/jpeg'; // Fallback
      }

      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: imageData,
        },
      });
      content.push({
        type: "text",
        text: "Extract order details from this image. " + prompt
      });
    } else if (text) {
      content.push({
        type: "text",
        text: prompt + "\n\n**TEXT TO PARSE:**\n" + text
      });
    } else {
      throw new Error("No text or image provided for OCR");
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514", // Use consistent model
      max_tokens: 1500,
      messages: [{ role: "user", content }],
    });

    console.log("Claude API response received");
    const responseContent = message.content[0];
    if (responseContent.type === "text") {
      const jsonMatch = responseContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("Successfully parsed OCR data:", parsed);
        return parsed;
      }
    }

    throw new Error("No JSON response from Claude");
  } catch (error: any) {
    console.error("OCR parsing error details:", {
      message: error.message,
      status: error.status,
      type: error.type,
      error: error.error,
    });
    return {
      confidence: {},
      warnings: [`API Error: ${error.message}. Please check your API key and try again.`],
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
      model: "claude-sonnet-4-20250514",
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
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
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
      model: "claude-sonnet-4-20250514",
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

import { BookingInsights } from "./types";

export async function generateBookingInsights(tripContext: any): Promise<BookingInsights | null> {
  const claudePrompt = `You are a logistics optimization AI for a freight brokerage. Analyze this trip and provide actionable insights.

Trip Details:
${JSON.stringify(tripContext, null, 2)}

Provide insights in the following JSON structure:

{
  "recommendedDriverType": "RNR|COM|OO_Z1|OO_Z2|OO_Z3",
  "reasoning": "2-3 sentence explanation of why this driver type is best",
  
  "costOptimization": {
    "potentialSavings": "dollar amount if not using cheapest option",
    "suggestion": "specific recommendation"
  },
  
  "operationalInsights": [
    "insight 1 about route, timing, or operations",
    "insight 2 about driver availability or requirements",
    "insight 3 about margin or pricing"
  ],
  
  "riskFactors": [
    "any potential risks or concerns to be aware of"
  ],
  
  "specificDriverRecommendation": {
    "driverId": "id of specific driver if one stands out",
    "driverName": "name",
    "reason": "why this specific driver"
  },
  "specificUnitRecommendation": {
    "unitId": "id of specific unit",
    "unitCode": "unit number/code",
    "reason": "why this unit"
  },
  
  "marginAnalysis": {
    "targetMargin": "percentage",
    "recommendedRevenue": "dollar amount",
    "reasoning": "why this margin is appropriate"
  }
}

Important: 
- Be specific and actionable
- Reference actual numbers from the trip data
- Consider cross-border complexity if applicable
- Prioritize cost efficiency while maintaining service quality
- Only recommend available drivers
- Keep insights concise (1-2 sentences each)`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        { 
          role: "user", 
          content: claudePrompt 
        }
      ]
    });
    
    const content = response.content[0];
    if (content.type === "text") {
      const responseText = content.text;
      
      // Parse JSON response (handle markdown code blocks if present)
      const cleanedResponse = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      const insights = JSON.parse(cleanedResponse);
      return insights;
    }
    
    return null;
    
  } catch (error) {
    console.error("Failed to generate insights:", error);
    return null;
  }
}

export async function calculateRouteMetrics(origin: string, destination: string): Promise<{ distance: number; duration: number } | null> {
  const prompt = `Calculate the driving distance and duration for a commercial truck route between ${origin} and ${destination}.
  
  Return ONLY a JSON object with this structure:
  {
    "distance": number (in miles),
    "duration": number (in hours)
  }
  
  Assume standard commercial truck routing (avoiding restricted roads if applicable).`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    return null;
  } catch (error) {
    console.error("Route metrics calculation error:", error);
    return null;
  }
}

export async function interpretVoiceCommand(transcript: string): Promise<{ eventType: string | null; confidence: number }> {
  const prompt = `You are an AI assistant for a truck driver app. Your job is to interpret voice commands and map them to specific trip events.

The available event types are:
- TRIP_START (e.g., "starting trip", "heading out", "leaving yard", "rolling")
- ARRIVED_PICKUP (e.g., "at shipper", "arrived at pickup", "docked at pickup")
- LEFT_PICKUP (e.g., "loaded", "leaving shipper", "left pickup")
- CROSSED_BORDER (e.g., "crossed border", "entering canada", "entering us")
- DROP_HOOK (e.g., "dropping trailer", "hooking up", "drop and hook")
- ARRIVED_DELIVERY (e.g., "at receiver", "arrived at delivery", "docked at delivery")
- LEFT_DELIVERY (e.g., "empty", "leaving receiver", "finished delivery")
- TRIP_FINISHED (e.g., "trip done", "finished trip", "completed")

Analyze the following voice transcript: "${transcript}"

Return ONLY a JSON object with this structure:
{
  "eventType": "EVENT_ID" or null if no match,
  "confidence": 0-100
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    return { eventType: null, confidence: 0 };
  } catch (error) {
    console.error("Voice command interpretation error:", error);
    return { eventType: null, confidence: 0 };
  }
}

