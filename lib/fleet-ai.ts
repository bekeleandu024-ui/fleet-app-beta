/**
 * FleetAI - Comprehensive AI Service for Fleet Management
 * 
 * This module provides AI-powered features for:
 * - Dispatch optimization and driver recommendations
 * - Order profitability analysis and rate suggestions
 * - Trip ETA prediction and exception alerts
 * - Natural language search and commands
 * - Fleet-wide anomaly detection and insights
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const FLEET_AI_MODEL = "claude-sonnet-4-20250514";

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

export const FLEET_AI_SYSTEM_PROMPT = `You are FleetAI, an intelligent assistant for a trucking fleet management system operating cross-border lanes between Ontario, Canada and the United States.

You have access to:
- Orders: customer shipments with pickup/delivery locations, rates, and status
- Trips: active movements with driver, unit, and real-time location
- Drivers: company drivers, owner-operators, and rental drivers with HOS, location, and performance data
- Units: trucks and trailers with availability and maintenance status
- Costing Rules: per-mile rates, fuel costs, accessorials, and overhead allocations
- Carriers: external partners for farm-out loads

Your role is to:
1. Answer questions about fleet operations accurately
2. Make data-driven recommendations for dispatch, pricing, and routing
3. Proactively identify risks and opportunities
4. Explain your reasoning clearly
5. Execute actions when authorized (create orders, assign drivers, update trips)

Key business rules:
- Border crossing adds $15 per crossing
- Company drivers (COM) cost $0.59/mi + $0.70/mi fuel; owner-ops (OO) cost $1.42-$1.60/mi + $0.22/mi fuel
- Rental drivers (RNR) are $1.54/mi + $0.22/mi fuel
- Target margin is 18%+
- On-time delivery is critical for customer retention

Always be concise, actionable, and focused on operational efficiency.`;

// ============================================================================
// TYPES
// ============================================================================

export interface DriverRecommendation {
  driverId: string;
  driverName: string;
  driverType: "COM" | "OO" | "RNR";
  unit?: string;
  fitScore: number;
  deadheadMiles: number;
  estimatedCost: number;
  costPerMile: number;
  hosRemaining?: number;
  borderEligible: boolean;
  laneExperience: number;
  reasoning: string;
  pros: string[];
  cons: string[];
}

export interface DispatchRecommendation {
  orderId: string;
  topRecommendation: DriverRecommendation;
  alternatives: DriverRecommendation[];
  whatIfScenarios: WhatIfScenario[];
  conflicts: ConflictWarning[];
  summary: string;
}

export interface WhatIfScenario {
  driverId: string;
  driverName: string;
  totalCost: number;
  deadheadMiles: number;
  profitMargin: number;
  arrivalTime: string;
  risks: string[];
}

export interface ConflictWarning {
  type: "HOS_VIOLATION" | "DOUBLE_BOOKING" | "MAINTENANCE" | "BORDER_INELIGIBLE";
  severity: "critical" | "warning" | "info";
  message: string;
  driverId?: string;
}

export interface ProfitabilityScore {
  score: number; // 0-100
  status: "profitable" | "marginal" | "unprofitable";
  estimatedMiles: number;
  estimatedCost: number;
  minimumRate: number;
  recommendedRate: number;
  margin: number;
  marginHealth: "red" | "yellow" | "green";
  breakdown: {
    linehaul: number;
    fuel: number;
    border: number;
    accessorials: number;
    overhead: number;
  };
  warnings: string[];
  suggestions: string[];
}

export interface CustomerRateSuggestion {
  suggestedRate: number;
  marketRate: number;
  historicalAverage: number;
  acceptanceProbability: number;
  marginAtSuggestedRate: number;
  customerNotes: string[];
  negotiationTips: string[];
}

export interface TripETAPrediction {
  tripId: string;
  predictedArrival: string;
  confidenceLevel: "high" | "medium" | "low";
  onTimeStatus: "on_time" | "at_risk" | "delayed";
  delayMinutes: number;
  factors: ETAFactor[];
  alerts: TripAlert[];
  suggestedActions: string[];
}

export interface ETAFactor {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  details: string;
}

export interface TripAlert {
  type: "delay" | "weather" | "hos" | "border" | "traffic" | "exception";
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  recommendedAction?: string;
}

export interface FleetHealthSummary {
  overallScore: number;
  tripsOnTime: number;
  tripsAtRisk: number;
  tripsDelayed: number;
  totalActiveTrips: number;
  anomalies: FleetAnomaly[];
  insights: string[];
  recommendations: string[];
}

export interface FleetAnomaly {
  type: "cost_spike" | "rate_erosion" | "driver_behavior" | "customer_pattern";
  severity: "high" | "medium" | "low";
  title: string;
  details: string;
  affectedItems: string[];
}

export interface NLSearchResult {
  query: string;
  interpretation: string;
  filters: {
    customer?: string;
    status?: string;
    dateRange?: { start: string; end: string };
    location?: string;
    marginThreshold?: number;
    riskLevel?: string;
  };
  results: any[];
  summary: string;
}

export interface AICommandResult {
  success: boolean;
  action: string;
  message: string;
  data?: any;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface OrderPriorityRank {
  orderId: string;
  orderNumber: string;
  urgencyScore: number;
  factors: {
    daysUntilPickup: number;
    customerTier: "premium" | "standard" | "new";
    marginOpportunity: "high" | "medium" | "low";
    assignmentStatus: "unassigned" | "assigned" | "at_risk";
  };
  slaRisk: boolean;
  recommendedAction: string;
}

export interface FarmOutDecision {
  recommendation: "wait_for_fleet" | "farm_out_now" | "split_load";
  confidence: number;
  reasoning: string;
  fleetWaitCost: number;
  farmOutCost: number;
  riskOfMissedPickup: number;
  carrierRecommendations?: CarrierRecommendation[];
  alternativeDates?: { date: string; availableDrivers: number }[];
}

export interface CarrierRecommendation {
  carrierId: string;
  carrierName: string;
  quotedRate: number;
  marketComparison: "below" | "at" | "above";
  onTimePercentage: number;
  recentIssues: string[];
  recommended: boolean;
  negotiationTarget?: number;
}

// ============================================================================
// CORE AI FUNCTIONS
// ============================================================================

/**
 * Get optimal driver recommendations for dispatching an order
 */
export async function getDispatchRecommendations(params: {
  order: any;
  availableDrivers: any[];
  availableUnits: any[];
  costingRules?: any;
}): Promise<DispatchRecommendation> {
  const { order, availableDrivers, availableUnits, costingRules } = params;

  const prompt = `Analyze this dispatch scenario and recommend the best driver assignments.

**ORDER DETAILS:**
${JSON.stringify(order, null, 2)}

**AVAILABLE DRIVERS:**
${JSON.stringify(availableDrivers, null, 2)}

**AVAILABLE UNITS:**
${JSON.stringify(availableUnits, null, 2)}

**COSTING RULES:**
${costingRules ? JSON.stringify(costingRules, null, 2) : "Standard costing applies"}

**YOUR TASK:**
1. Score each available driver on fit for this order considering:
   - Proximity to pickup (deadhead miles = wasted cost)
   - Hours of Service remaining (must have enough for the run)
   - Border crossing eligibility (for CA↔US lanes)
   - Historical performance and lane experience
   - Cost (COM cheapest, then RNR, then OO)

2. Identify the TOP recommendation with detailed reasoning

3. Provide 2-3 alternatives with trade-off analysis

4. Create "What-If" scenarios comparing top candidates

5. Flag any conflicts (HOS violations, double-booking, maintenance due)

**RETURN JSON:**
{
  "orderId": "${order.id}",
  "topRecommendation": {
    "driverId": "string",
    "driverName": "string",
    "driverType": "COM|OO|RNR",
    "unit": "unit number or null",
    "fitScore": 0-100,
    "deadheadMiles": number,
    "estimatedCost": number,
    "costPerMile": number,
    "hosRemaining": hours or null,
    "borderEligible": boolean,
    "laneExperience": 0-5 scale,
    "reasoning": "2-3 sentence explanation",
    "pros": ["list", "of", "pros"],
    "cons": ["list", "of", "cons"]
  },
  "alternatives": [same structure],
  "whatIfScenarios": [
    {
      "driverId": "string",
      "driverName": "string",
      "totalCost": number,
      "deadheadMiles": number,
      "profitMargin": percentage,
      "arrivalTime": "estimated arrival",
      "risks": ["potential risks"]
    }
  ],
  "conflicts": [
    {
      "type": "HOS_VIOLATION|DOUBLE_BOOKING|MAINTENANCE|BORDER_INELIGIBLE",
      "severity": "critical|warning|info",
      "message": "Clear description",
      "driverId": "affected driver or null"
    }
  ],
  "summary": "One paragraph dispatch summary and recommendation"
}`;

  try {
    const response = await anthropic.messages.create({
      model: FLEET_AI_MODEL,
      max_tokens: 2500,
      system: FLEET_AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Dispatch recommendation error:", error);
    throw new Error(`Failed to get dispatch recommendations: ${error.message}`);
  }
}

/**
 * Calculate instant profitability score for an order
 */
export async function calculateProfitabilityScore(params: {
  origin: string;
  destination: string;
  customerRate?: number;
  commodity?: string;
  equipmentType?: string;
  accessorials?: string[];
  historicalData?: any[];
}): Promise<ProfitabilityScore> {
  const { origin, destination, customerRate, commodity, equipmentType, accessorials, historicalData } = params;

  const prompt = `Calculate profitability for this potential order.

**LANE:** ${origin} → ${destination}

**CUSTOMER RATE:** ${customerRate ? `$${customerRate}` : "Not yet quoted"}

**COMMODITY:** ${commodity || "General freight"}

**EQUIPMENT:** ${equipmentType || "Dry Van"}

**ACCESSORIALS:** ${accessorials?.join(", ") || "None"}

**HISTORICAL DATA FOR THIS LANE:**
${historicalData ? JSON.stringify(historicalData.slice(0, 5), null, 2) : "No historical data"}

**COSTING ASSUMPTIONS:**
- Company driver: $0.59/mi (driver) + $0.70/mi (fuel) = $1.29/mi
- Owner-operator: $1.50/mi + $0.22/mi (fuel) = $1.72/mi  
- Rental driver: $1.54/mi + $0.22/mi (fuel) = $1.76/mi
- Border crossing: $15 per crossing
- Target margin: 18%+

**YOUR TASK:**
1. Estimate total miles for this lane
2. Calculate costs using cheapest viable option (company driver if available)
3. Determine minimum rate needed for 0% margin
4. Calculate recommended rate for 18% margin
5. If customer rate provided, assess margin health
6. Provide actionable suggestions

**RETURN JSON:**
{
  "score": 0-100 (profitability health score),
  "status": "profitable|marginal|unprofitable",
  "estimatedMiles": number,
  "estimatedCost": total in dollars,
  "minimumRate": break-even rate,
  "recommendedRate": rate for 18% margin,
  "margin": actual margin percentage if rate provided or projected,
  "marginHealth": "red|yellow|green",
  "breakdown": {
    "linehaul": driver cost,
    "fuel": fuel cost,
    "border": border fees if applicable,
    "accessorials": accessorial charges,
    "overhead": 5% overhead
  },
  "warnings": ["any concerns or risks"],
  "suggestions": ["actionable recommendations"]
}`;

  try {
    const response = await anthropic.messages.create({
      model: FLEET_AI_MODEL,
      max_tokens: 1500,
      system: FLEET_AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Profitability calculation error:", error);
    throw new Error(`Failed to calculate profitability: ${error.message}`);
  }
}

/**
 * Get smart rate suggestions for a customer on a specific lane
 */
export async function getCustomerRateSuggestion(params: {
  customerId: string;
  customerName: string;
  origin: string;
  destination: string;
  historicalOrders?: any[];
  marketRates?: any;
}): Promise<CustomerRateSuggestion> {
  const { customerId, customerName, origin, destination, historicalOrders, marketRates } = params;

  const prompt = `Suggest optimal rate for this customer and lane.

**CUSTOMER:** ${customerName} (ID: ${customerId})

**LANE:** ${origin} → ${destination}

**HISTORICAL ORDERS WITH THIS CUSTOMER:**
${historicalOrders ? JSON.stringify(historicalOrders.slice(0, 10), null, 2) : "No history"}

**MARKET RATE DATA:**
${marketRates ? JSON.stringify(marketRates, null, 2) : "No market data available"}

**YOUR TASK:**
1. Analyze historical rates for this customer on this lane
2. Compare to market rates
3. Consider customer negotiation patterns
4. Suggest an optimal quote balancing competitiveness with profitability
5. Provide negotiation tips

**RETURN JSON:**
{
  "suggestedRate": recommended rate in dollars,
  "marketRate": current market rate,
  "historicalAverage": customer's average rate on this lane,
  "acceptanceProbability": 0-100 likelihood customer accepts,
  "marginAtSuggestedRate": expected margin percentage,
  "customerNotes": ["patterns about this customer's behavior"],
  "negotiationTips": ["tactical suggestions for pricing discussion"]
}`;

  try {
    const response = await anthropic.messages.create({
      model: FLEET_AI_MODEL,
      max_tokens: 1200,
      system: FLEET_AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Rate suggestion error:", error);
    throw new Error(`Failed to get rate suggestion: ${error.message}`);
  }
}

/**
 * Predict ETA and detect exceptions for active trips
 */
export async function predictTripETA(params: {
  trip: any;
  currentLocation?: { lat: number; lng: number };
  weather?: any;
  traffic?: any;
  borderConditions?: any;
}): Promise<TripETAPrediction> {
  const { trip, currentLocation, weather, traffic, borderConditions } = params;

  const prompt = `Predict ETA and identify risks for this active trip.

**TRIP DETAILS:**
${JSON.stringify(trip, null, 2)}

**CURRENT LOCATION:**
${currentLocation ? JSON.stringify(currentLocation) : "Unknown"}

**WEATHER CONDITIONS:**
${weather ? JSON.stringify(weather) : "Normal conditions assumed"}

**TRAFFIC DATA:**
${traffic ? JSON.stringify(traffic) : "Normal traffic assumed"}

**BORDER CONDITIONS:**
${borderConditions ? JSON.stringify(borderConditions) : "Normal wait times assumed"}

**YOUR TASK:**
1. Calculate realistic ETA based on remaining distance and conditions
2. Compare against delivery window
3. Identify risk factors (HOS limits, weather, border delays)
4. Generate alerts if delivery is at risk
5. Suggest proactive actions

**RETURN JSON:**
{
  "tripId": "${trip.id}",
  "predictedArrival": "ISO datetime",
  "confidenceLevel": "high|medium|low",
  "onTimeStatus": "on_time|at_risk|delayed",
  "delayMinutes": expected delay (0 if on time),
  "factors": [
    {
      "factor": "factor name",
      "impact": "positive|negative|neutral",
      "details": "explanation"
    }
  ],
  "alerts": [
    {
      "type": "delay|weather|hos|border|traffic|exception",
      "severity": "critical|warning|info",
      "title": "short title",
      "message": "detailed message",
      "recommendedAction": "what to do"
    }
  ],
  "suggestedActions": ["proactive steps to ensure on-time delivery"]
}`;

  try {
    const response = await anthropic.messages.create({
      model: FLEET_AI_MODEL,
      max_tokens: 1500,
      system: FLEET_AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("ETA prediction error:", error);
    throw new Error(`Failed to predict ETA: ${error.message}`);
  }
}

/**
 * Scan all active trips for exceptions and risks
 */
export async function scanTripsForExceptions(trips: any[]): Promise<{
  atRiskTrips: TripETAPrediction[];
  summary: string;
  urgentAlerts: TripAlert[];
}> {
  const prompt = `Scan these active trips and identify any at risk of delay or exception.

**ACTIVE TRIPS:**
${JSON.stringify(trips.slice(0, 20), null, 2)}

**YOUR TASK:**
1. Identify trips at risk of missing delivery windows
2. Flag HOS concerns
3. Detect weather or traffic impacts
4. Check border crossing considerations
5. Prioritize by severity

**RETURN JSON:**
{
  "atRiskTrips": [
    {
      "tripId": "id",
      "tripNumber": "display number",
      "onTimeStatus": "at_risk|delayed",
      "delayMinutes": number,
      "primaryRisk": "main concern",
      "alerts": [{ type, severity, title, message }]
    }
  ],
  "summary": "Fleet running well with X trips on time, Y at risk...",
  "urgentAlerts": [{ type, severity, title, message, recommendedAction }]
}`;

  try {
    const response = await anthropic.messages.create({
      model: FLEET_AI_MODEL,
      max_tokens: 2000,
      system: FLEET_AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Exception scan error:", error);
    return {
      atRiskTrips: [],
      summary: "Unable to scan trips for exceptions",
      urgentAlerts: [],
    };
  }
}

/**
 * Process natural language search queries
 */
export async function processNaturalLanguageSearch(params: {
  query: string;
  context?: {
    orders?: any[];
    trips?: any[];
    drivers?: any[];
    customers?: any[];
  };
}): Promise<NLSearchResult> {
  const { query, context } = params;

  const prompt = `Parse this natural language search query and convert to structured filters.

**USER QUERY:** "${query}"

**AVAILABLE DATA CONTEXT:**
${context ? `
- Orders: ${context.orders?.length || 0} records
- Trips: ${context.trips?.length || 0} records  
- Drivers: ${context.drivers?.length || 0} records
- Customers: ${context.customers?.length || 0} records
` : "No context provided"}

**EXAMPLES OF QUERIES TO HANDLE:**
- "Show me all orders for Brightline picking up tomorrow"
- "Find high-margin orders going to Buffalo"
- "Which orders are at risk?"
- "Late trips"
- "Orders without drivers"
- "Chicago to Toronto runs"
- "Premium customers this week"

**YOUR TASK:**
1. Interpret the user's intent
2. Extract structured filters
3. Explain how you interpreted the query

**RETURN JSON:**
{
  "query": "${query}",
  "interpretation": "Plain English explanation of what user wants",
  "filters": {
    "customer": "customer name or null",
    "status": "status filter or null",
    "dateRange": { "start": "ISO date", "end": "ISO date" } or null,
    "location": "origin or destination filter or null",
    "marginThreshold": number or null,
    "riskLevel": "high|medium|low or null",
    "assignmentStatus": "unassigned|assigned|at_risk or null",
    "driver": "driver name or null",
    "orderType": "type filter or null"
  },
  "summary": "Brief summary of what filters will be applied"
}`;

  try {
    const response = await anthropic.messages.create({
      model: FLEET_AI_MODEL,
      max_tokens: 800,
      system: FLEET_AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          ...result,
          results: [], // Results would be populated by the caller
        };
      }
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("NL search error:", error);
    return {
      query,
      interpretation: "Could not interpret query",
      filters: {},
      results: [],
      summary: "Search failed - please try a more specific query",
    };
  }
}

/**
 * Execute natural language commands
 */
export async function executeNaturalLanguageCommand(params: {
  command: string;
  context?: any;
}): Promise<AICommandResult> {
  const { command, context } = params;

  const prompt = `Interpret and execute this natural language command.

**USER COMMAND:** "${command}"

**CURRENT CONTEXT:**
${context ? JSON.stringify(context, null, 2) : "No context"}

**SUPPORTED ACTIONS:**
- Assign driver to order: "Assign driver Mike to order 12345"
- Get status: "What's the status of the Brightline shipment?"
- Calculate cost: "Calculate cost for Chicago to Toronto"
- Update trip: "Mark trip TRP-123 as at pickup"
- Search: "Show me all late trips"

**YOUR TASK:**
1. Identify the action type
2. Extract required parameters
3. Determine if action needs confirmation
4. Return structured result

**RETURN JSON:**
{
  "success": true/false,
  "action": "action_type",
  "message": "Human-readable response",
  "data": { extracted parameters },
  "requiresConfirmation": true/false,
  "confirmationMessage": "message to show user before executing" or null
}`;

  try {
    const response = await anthropic.messages.create({
      model: FLEET_AI_MODEL,
      max_tokens: 800,
      system: FLEET_AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Command execution error:", error);
    return {
      success: false,
      action: "unknown",
      message: "I couldn't understand that command. Please try rephrasing.",
    };
  }
}

/**
 * Analyze farm-out vs fleet decision
 */
export async function analyzeFarmOutDecision(params: {
  order: any;
  fleetCapacity: any;
  carriers?: any[];
  urgency: "immediate" | "flexible";
}): Promise<FarmOutDecision> {
  const { order, fleetCapacity, carriers, urgency } = params;

  const prompt = `Analyze whether to use fleet capacity or farm out this order.

**ORDER:**
${JSON.stringify(order, null, 2)}

**FLEET CAPACITY:**
${JSON.stringify(fleetCapacity, null, 2)}

**AVAILABLE CARRIERS:**
${carriers ? JSON.stringify(carriers, null, 2) : "No carriers quoted"}

**URGENCY:** ${urgency}

**YOUR TASK:**
1. Estimate cost of waiting for fleet capacity
2. Compare against farm-out costs
3. Assess risk of missing pickup window
4. Recommend best action with confidence level

**RETURN JSON:**
{
  "recommendation": "wait_for_fleet|farm_out_now|split_load",
  "confidence": 0-100,
  "reasoning": "Detailed explanation",
  "fleetWaitCost": estimated cost if waiting,
  "farmOutCost": estimated farm-out cost,
  "riskOfMissedPickup": 0-100 probability,
  "carrierRecommendations": [
    {
      "carrierId": "id",
      "carrierName": "name",
      "quotedRate": rate,
      "marketComparison": "below|at|above",
      "onTimePercentage": reliability %,
      "recentIssues": ["any concerns"],
      "recommended": boolean,
      "negotiationTarget": counter-offer amount
    }
  ],
  "alternativeDates": [
    { "date": "ISO date", "availableDrivers": count }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: FLEET_AI_MODEL,
      max_tokens: 1500,
      system: FLEET_AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Farm-out analysis error:", error);
    throw new Error(`Failed to analyze farm-out decision: ${error.message}`);
  }
}

/**
 * Get fleet health summary and anomaly detection
 */
export async function getFleetHealthSummary(data: {
  trips: any[];
  orders: any[];
  drivers: any[];
  recentMetrics?: any;
}): Promise<FleetHealthSummary> {
  const { trips, orders, drivers, recentMetrics } = data;

  const prompt = `Analyze fleet health and detect anomalies.

**ACTIVE TRIPS:** ${trips.length}
${JSON.stringify(trips.slice(0, 15), null, 2)}

**PENDING ORDERS:** ${orders.filter((o: any) => o.status === "pending").length}
${JSON.stringify(orders.slice(0, 10), null, 2)}

**DRIVER UTILIZATION:**
${JSON.stringify(drivers.slice(0, 10), null, 2)}

**RECENT METRICS:**
${recentMetrics ? JSON.stringify(recentMetrics, null, 2) : "No historical metrics"}

**YOUR TASK:**
1. Calculate overall fleet health score (0-100)
2. Count trips by status (on-time, at-risk, delayed)
3. Detect anomalies (cost spikes, rate erosion, unusual patterns)
4. Generate actionable insights
5. Provide top recommendations

**RETURN JSON:**
{
  "overallScore": 0-100,
  "tripsOnTime": count,
  "tripsAtRisk": count,
  "tripsDelayed": count,
  "totalActiveTrips": count,
  "anomalies": [
    {
      "type": "cost_spike|rate_erosion|driver_behavior|customer_pattern",
      "severity": "high|medium|low",
      "title": "Short title",
      "details": "Explanation",
      "affectedItems": ["list of affected orders/trips/drivers"]
    }
  ],
  "insights": ["Key observations about fleet performance"],
  "recommendations": ["Top priority actions to take"]
}`;

  try {
    const response = await anthropic.messages.create({
      model: FLEET_AI_MODEL,
      max_tokens: 1800,
      system: FLEET_AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Fleet health analysis error:", error);
    return {
      overallScore: 0,
      tripsOnTime: 0,
      tripsAtRisk: 0,
      tripsDelayed: 0,
      totalActiveTrips: trips.length,
      anomalies: [],
      insights: ["Unable to analyze fleet health"],
      recommendations: [],
    };
  }
}

/**
 * Rank orders by priority for dispatch attention
 */
export async function rankOrdersByPriority(orders: any[]): Promise<OrderPriorityRank[]> {
  const prompt = `Rank these orders by dispatch urgency and priority.

**ORDERS:**
${JSON.stringify(orders.slice(0, 25), null, 2)}

**RANKING FACTORS:**
1. Days until pickup (closer = more urgent)
2. Customer tier (premium > standard > new)
3. Margin opportunity (high margin = higher priority)
4. Assignment status (unassigned = needs attention)
5. SLA risk (tight windows = urgent)

**RETURN JSON ARRAY:**
[
  {
    "orderId": "id",
    "orderNumber": "display number",
    "urgencyScore": 0-100,
    "factors": {
      "daysUntilPickup": number,
      "customerTier": "premium|standard|new",
      "marginOpportunity": "high|medium|low",
      "assignmentStatus": "unassigned|assigned|at_risk"
    },
    "slaRisk": boolean,
    "recommendedAction": "What dispatcher should do"
  }
]

Sort by urgencyScore descending.`;

  try {
    const response = await anthropic.messages.create({
      model: FLEET_AI_MODEL,
      max_tokens: 2000,
      system: FLEET_AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Priority ranking error:", error);
    return [];
  }
}

/**
 * Generate customer notification draft
 */
export async function generateCustomerNotification(params: {
  trip: any;
  customer: any;
  notificationType: "delay" | "eta_update" | "delivered" | "exception";
  details?: string;
}): Promise<{ subject: string; body: string }> {
  const { trip, customer, notificationType, details } = params;

  const prompt = `Draft a professional customer notification email.

**TRIP:**
${JSON.stringify(trip, null, 2)}

**CUSTOMER:**
${JSON.stringify(customer, null, 2)}

**NOTIFICATION TYPE:** ${notificationType}

**ADDITIONAL DETAILS:** ${details || "None"}

**YOUR TASK:**
Write a concise, professional notification that:
- Clearly states the situation
- Provides relevant details (new ETA, reason if applicable)
- Maintains positive customer relationship
- Is ready to send with minimal editing

**RETURN JSON:**
{
  "subject": "Email subject line",
  "body": "Full email body with proper formatting"
}`;

  try {
    const response = await anthropic.messages.create({
      model: FLEET_AI_MODEL,
      max_tokens: 800,
      system: FLEET_AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Notification generation error:", error);
    return {
      subject: "Shipment Update",
      body: "We wanted to update you on your shipment. Please contact us for details.",
    };
  }
}

/**
 * Chat with FleetAI assistant
 */
export async function chatWithFleetAI(params: {
  message: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  context?: {
    currentPage?: string;
    selectedOrder?: any;
    selectedTrip?: any;
    selectedDriver?: any;
  };
}): Promise<string> {
  const { message, conversationHistory = [], context } = params;

  const contextPrompt = context
    ? `
**CURRENT CONTEXT:**
- Page: ${context.currentPage || "Unknown"}
${context.selectedOrder ? `- Selected Order: ${JSON.stringify(context.selectedOrder)}` : ""}
${context.selectedTrip ? `- Selected Trip: ${JSON.stringify(context.selectedTrip)}` : ""}
${context.selectedDriver ? `- Selected Driver: ${JSON.stringify(context.selectedDriver)}` : ""}
`
    : "";

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...conversationHistory,
    { role: "user", content: `${contextPrompt}\n\n${message}` },
  ];

  try {
    const response = await anthropic.messages.create({
      model: FLEET_AI_MODEL,
      max_tokens: 1000,
      system: FLEET_AI_SYSTEM_PROMPT,
      messages,
    });

    const content = response.content[0];
    if (content.type === "text") {
      return content.text;
    }

    return "I'm here to help with fleet operations. What would you like to know?";
  } catch (error: any) {
    console.error("FleetAI chat error:", error);
    return "I'm having trouble responding right now. Please try again.";
  }
}

/**
 * Generate weekly summary report
 */
export async function generateWeeklySummary(data: {
  trips: any[];
  orders: any[];
  financials: any;
  compareToLastWeek?: any;
}): Promise<{
  summary: string;
  highlights: string[];
  concerns: string[];
  recommendations: string[];
  metrics: Record<string, any>;
}> {
  const { trips, orders, financials, compareToLastWeek } = data;

  const prompt = `Generate a weekly fleet performance summary.

**THIS WEEK'S DATA:**
- Trips Completed: ${trips.filter((t: any) => t.status === "completed").length}
- Orders Processed: ${orders.length}
- Revenue: ${financials?.revenue || "N/A"}
- Costs: ${financials?.costs || "N/A"}
- Margin: ${financials?.margin || "N/A"}%

**TRIP DETAILS:**
${JSON.stringify(trips.slice(0, 20), null, 2)}

**COMPARISON TO LAST WEEK:**
${compareToLastWeek ? JSON.stringify(compareToLastWeek, null, 2) : "No comparison data"}

**YOUR TASK:**
Create an executive summary covering:
1. Overall performance
2. Key highlights (wins)
3. Areas of concern
4. Recommendations for next week

**RETURN JSON:**
{
  "summary": "2-3 paragraph executive summary",
  "highlights": ["Positive achievements"],
  "concerns": ["Areas needing attention"],
  "recommendations": ["Actions for next week"],
  "metrics": {
    "onTimePercentage": number,
    "averageMargin": number,
    "utilizationRate": number,
    "tripCount": number,
    "weekOverWeekChange": percentage
  }
}`;

  try {
    const response = await anthropic.messages.create({
      model: FLEET_AI_MODEL,
      max_tokens: 1500,
      system: FLEET_AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Weekly summary error:", error);
    return {
      summary: "Unable to generate weekly summary",
      highlights: [],
      concerns: [],
      recommendations: [],
      metrics: {},
    };
  }
}

// ============================================================================
// BATCH DISPATCH RECOMMENDATIONS (AI-Powered)
// ============================================================================

export interface BatchRecommendation {
  id: string;
  type: "consolidate" | "assign" | "alert" | "brokerage";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: {
    savings: string | null;
    miles_saved: number | null;
    utilization: string | null;
  };
  orders: string[];
  suggested_driver: {
    id: string;
    name: string;
    reason: string;
  } | null;
  suggested_unit: {
    id: string;
    type: string;
  } | null;
  urgency_hours: number | null;
  action: "create_trip" | "assign_driver" | "kick_to_brokerage" | "prioritize";
  brokerage_alternative: {
    recommended: boolean;
    reason: string;
    estimated_savings: string | null;
    fleet_fallback: string;
  } | null;
}

export interface BatchRecommendationsResponse {
  recommendations: BatchRecommendation[];
  summary: {
    total_recommendations: number;
    potential_savings: string;
    orders_analyzed: number;
    consolidation_opportunities: number;
  };
}

export interface BatchDispatchOrder {
  id: string;
  status: string;
  customer: string;
  type?: string;
  origin: string;
  destination: string;
  pickup_date: string;
  delivery_date: string | null;
  equipment: string;
  weight: number;
  rate: number;
}

export interface BatchDispatchDriver {
  id: string;
  name: string;
  status: string;
  location: string;
  hours_available: number;
  equipment_access: string[];
  type: "COM" | "OO" | "RNR";
  performance?: {
    on_time_rate: number;
    acceptance_rate: number;
  };
}

export interface BatchDispatchUnit {
  id: string;
  type: string;
  status: string;
  location: string;
  capacity_lbs: number;
}

/**
 * Get AI-powered batch dispatch recommendations for multiple orders
 * Analyzes all available orders, drivers, and units to provide optimization recommendations
 */
export async function getBatchDispatchRecommendations(params: {
  orders: BatchDispatchOrder[];
  drivers: BatchDispatchDriver[];
  units: BatchDispatchUnit[];
  capacityStatus?: "normal" | "constrained" | "critical";
}): Promise<BatchRecommendationsResponse> {
  const { orders, drivers, units, capacityStatus = "normal" } = params;

  // Read system prompt from file
  let systemPrompt = "";
  try {
    const fs = await import('fs');
    const path = await import('path');
    systemPrompt = fs.readFileSync(
      path.join(process.cwd(), 'AI_DISPATCH_RECOMMENDATIONS_PROMPT.md'), 
      'utf-8'
    );
  } catch (e) {
    console.error("Failed to read dispatch recommendations prompt file:", e);
    // Fallback to inline prompt
    systemPrompt = `You are an expert freight dispatch optimization assistant. Analyze orders, drivers, and units to provide consolidation, assignment, alert, and brokerage recommendations. Return valid JSON only.`;
  }

  // Identify the fleet's primary operating region based on driver locations
  const driverLocations = drivers.map(d => d.location).filter(l => l && l !== 'Unknown');
  const hasCanadianDrivers = driverLocations.some(l => 
    l.includes('ON') || l.includes('Ontario') || l.includes('QC') || l.includes('Quebec') ||
    l.includes('ZONE') || l.includes('Cambridge') || l.includes('Toronto') || l.includes('Brampton')
  );
  
  const fleetRegionContext = hasCanadianDrivers 
    ? `⚠️ FLEET OPERATING REGION: This fleet is based in ONTARIO, CANADA. 
       - Orders in US locations (Texas, Ohio, etc.) require MASSIVE deadhead (1000+ miles) to position a truck
       - Dallas-Houston type runs are 1,400+ miles from the driver base - STRONGLY recommend brokerage
       - Only lanes near Ontario/Michigan/New York make sense for fleet execution
       - For distant US lanes, brokerage will almost ALWAYS be more profitable than fleet`
    : `Fleet operating region appears to be US-based based on driver locations.`;

  const userPrompt = `Analyze the following dispatch data and provide optimization recommendations.

## Available Orders
${JSON.stringify(orders, null, 2)}

## Available Drivers
${JSON.stringify(drivers, null, 2)}

## Available Units
${JSON.stringify(units, null, 2)}

## Current Context
- Current date/time: ${new Date().toISOString()}
- Fleet capacity status: ${capacityStatus}

${fleetRegionContext}

## What I Need
Analyze these orders and provide your top recommendations for:
1. Which orders should be consolidated into trips
2. Best driver/unit assignments for unassigned orders
3. Any urgent alerts I should act on immediately
4. Orders that might be better suited for brokerage - ESPECIALLY if the origin is far from driver home bases

**IMPORTANT:** Do NOT make up specific dollar amounts for fleet costs or savings. 
Say "Check trip costing" for actual numbers since deadhead costs are unknown.

Respond with JSON only.`;

  try {
    const response = await anthropic.messages.create({
      model: FLEET_AI_MODEL,
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      // Clean up response - remove markdown code blocks if present
      let text = content.text;
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as BatchRecommendationsResponse;
        
        // Ensure recommendations have unique IDs
        parsed.recommendations = parsed.recommendations.map((rec, idx) => ({
          ...rec,
          id: rec.id || `rec-${Date.now()}-${idx}`,
        }));
        
        return parsed;
      }
    }

    throw new Error("Invalid response format from Claude");
  } catch (error: any) {
    console.error("Batch dispatch recommendations error:", error);
    
    // Return empty response on error
    return {
      recommendations: [],
      summary: {
        total_recommendations: 0,
        potential_savings: "$0",
        orders_analyzed: orders.length,
        consolidation_opportunities: 0,
      },
    };
  }
}
