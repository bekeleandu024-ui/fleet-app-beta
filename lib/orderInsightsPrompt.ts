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

1. DATA COMPLETENESS
   - Is customer information present?
   - Are pickup/delivery locations specified?
   - Are time windows defined?
   - Is service level/commodity specified?

2. RESOURCE AVAILABILITY
   - Check booking.driverOptions array - these ARE the available drivers
   - Check booking.unitOptions array - these ARE the available units
   - If recommendedDriverId/recommendedUnitId are set, use those IDs to find the recommended resources

3. PRICING & COST
   - Is pricing calculated?
   - Are costs reasonable for the lane?
   - Is margin adequate?

4. TIMING & SCHEDULE
   - How much lead time before pickup?
   - Are time windows realistic?
   - Any scheduling conflicts?

5. OPERATIONAL RISKS
   - Long lead times (risk of cancellation)
   - Tight delivery windows
   - Special requirements or qualifications
   - Cross-border considerations
   - Equipment type mismatches

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
      "category": "Dispatch|Driver|Unit|Cost|Risk|Schedule",
      "severity": "critical|warning|info",
      "title": "Concise title (max 8 words)",
      "description": "Clear explanation of the issue or observation (1-2 sentences)",
      "recommendation": "Specific actionable step to address this"
    }
  ]
}

SEVERITY GUIDELINES:
- critical: Prevents dispatch, requires immediate action before proceeding
- warning: Should be addressed soon, may cause operational issues
- info: Informational item, optimization opportunity, or FYI

RULES:
1. LOOK at booking.driverOptions array - if it has items, drivers ARE available
2. LOOK at booking.unitOptions array - if it has items, units ARE available
3. If recommendedDriverId is set, find that driver in driverOptions by matching the 'id' field
4. If recommendedUnitId is set, find that unit in unitOptions by matching the 'id' field
5. Use the actual driver names and unit IDs from the arrays - don't say "N/A" if resources exist
6. If pricing is $0.00, flag as critical issue
7. If order is missing customer, locations, or dates, flag as critical
8. Calculate days until pickup and flag if >60 days (cancellation risk) or <2 days (tight timeline)
9. Prioritize insights: critical first, then warnings, then info
10. Limit to 5 most important insights
11. Be specific in recommendations - use actual driver names and unit numbers from the data

IMPORTANT: The booking.driverOptions and booking.unitOptions arrays contain the ACTUAL available resources. 
If these arrays have items, resources ARE available. Extract the recommended driver/unit using the recommendedDriverId/recommendedUnitId.

Analyze now and return only the JSON.`;
}
