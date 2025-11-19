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
      model: "claude-3-5-sonnet-latest",
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
      model: "claude-3-5-sonnet-latest",
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
