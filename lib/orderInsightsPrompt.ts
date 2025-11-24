export function generateOrderInsightsPrompt(orderData: any): string {
  const driverCount = orderData?.booking?.driverOptions?.length || 0;
  const unitCount = orderData?.booking?.unitOptions?.length || 0;
  
  return `You are a logistics AI assistant for a fleet management system. Analyze this transportation order and provide dispatch insights.

ORDER DATA:
${JSON.stringify(orderData, null, 2)}

CURRENT DATE: ${new Date().toISOString().split('T')[0]}

AVAILABLE RESOURCES SUMMARY:
- Drivers Available: ${driverCount} (see booking.driverOptions array for details)
- Units Available: ${unitCount} (see booking.unitOptions array for details)
- Recommended Driver ID: ${orderData?.booking?.recommendedDriverId || 'Not set'}
- Recommended Unit ID: ${orderData?.booking?.recommendedUnitId || 'Not set'}

ANALYSIS FRAMEWORK:

1. RESOURCE RECOMMENDATIONS (Driver & Unit)
   - Check booking.driverOptions array - these ARE the available drivers
   - Check booking.unitOptions array - these ARE the available units
   - If recommendedDriverId/recommendedUnitId are set, use those IDs to find the recommended resources
   - Provide specific driver and unit recommendations with clear reasoning

2. OPERATIONAL INSIGHTS (Focus on Facts & Analysis)
   - Data completeness: Missing customer info, locations, time windows, or commodity
   - Timing analysis: Days until pickup, hours until delivery window closes
   - Schedule conflicts: Pickup window already passed, delivery timeline unrealistic
   - Pricing anomalies: Missing costs, margin too low/high, cost structure issues
   - Route challenges: Distance vs time window mismatch, cross-border requirements
   - Risk factors: Long lead time cancellation risk, tight delivery pressure, special requirements

3. INSIGHT PRINCIPLES
   - State FACTS about the order (e.g., "Pickup window closes in 4 hours", "Margin is 2.3%, below 5% target")
   - Provide ANALYSIS of implications (e.g., "Insufficient time for driver assignment", "Revenue at risk")
   - Avoid generic recommendations like "contact customer" or "verify details"
   - Focus on dispatch readiness, timeline pressure, cost issues, and operational risks
   - Only recommend actions for Driver/Unit selection - other insights should be informational

OUTPUT REQUIREMENTS:

Return ONLY a valid JSON object (no markdown, no backticks, no code blocks) with this structure:

{
  "summary": "One clear sentence describing the order's dispatch readiness",
  "canDispatch": boolean,
  "recommendedDriver": {
    "id": "driver-id or null",
    "name": "Driver Name or 'N/A'",
    "reason": "Why this driver is best or why none available"
  },
  "recommendedUnit": {
    "id": "unit-id or null",
    "number": "Unit number or 'N/A'",
    "reason": "Why this unit is best or why none available"
  },
  "insights": [
    {
      "category": "Schedule|Cost|Route|Risk|Data",
      "severity": "critical|warning|info",
      "title": "Concise insight title (max 8 words)",
      "description": "What the insight reveals about this order (1 sentence)",
      "recommendation": "Brief implication or key fact (1 sentence, no generic advice)"
    }
  ]
}

SEVERITY GUIDELINES:
- critical: Blocks dispatch or indicates severe operational issue (missing data, impossible timeline, no margin)
- warning: Creates operational risk or inefficiency (tight schedule, low margin, long lead time)
- info: Notable observations or opportunities (good margin, optimal timing, route efficiency)

INSIGHT CATEGORIES & EXAMPLES:
- Schedule: "Pickup window closes in 3 hours" | "47 days until pickup creates cancellation risk"
- Cost: "Margin is 2.1%, below 5% target" | "Pricing not calculated, costs unknown"
- Route: "380 mile trip requires 12+ driving hours" | "Cross-border clearance adds 2-4 hours"
- Risk: "No driver has 12+ hours available" | "Delivery window allows only 2-hour buffer"
- Data: "Customer information missing" | "Pickup location not specified"

RULES:
1. LOOK at booking.driverOptions array - if it has items, drivers ARE available
2. LOOK at booking.unitOptions array - if it has items, units ARE available
3. If recommendedDriverId is set, find that driver in driverOptions by matching the 'id' field
4. If recommendedUnitId is set, find that unit in unitOptions by matching the 'id' field
5. Use actual driver names and unit numbers from the arrays for Driver/Unit recommendations
6. For Driver/Unit recommendations: Be specific (e.g., "Best match based on 11h availability and Zone 2 rates")
7. For other insights: State facts and implications, NOT recommendations
8. Calculate time deltas: hours until pickup/delivery, days of lead time
9. Check pricing: flag if missing, margin <3% critical, 3-5% warning
10. Prioritize: critical first, then warnings, then info
11. Limit to 5 most actionable insights
12. Recommendation field should state implications, not suggest actions (except for Driver/Unit)

IMPORTANT DISTINCTIONS:
1. Driver/Unit recommendations: Use "recommendation" field to suggest the best choice and why
2. All other insights: Use "recommendation" field to state implications or key facts about the situation
3. DO NOT use generic phrases like "contact customer", "verify details", "update system"
4. DO state specific facts: "Window missed by 6 hours", "Creates 14% margin", "Requires 8+ driving hours"

The booking.driverOptions and booking.unitOptions arrays contain the ACTUAL available resources. 
If these arrays have items, resources ARE available. Extract the recommended driver/unit using the recommendedDriverId/recommendedUnitId.

Analyze now and return only the JSON.`;
}
