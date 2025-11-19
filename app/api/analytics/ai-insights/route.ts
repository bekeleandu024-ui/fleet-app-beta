import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface AnalyticsContext {
  summary: {
    periodLabel: string;
    totalRevenue: number;
    totalCost: number;
    marginPercent: number;
    avgRatePerMile: number;
    avgCostPerMile: number;
    totalMiles: number;
    profitableTrips: number;
    atRiskTrips: number;
  };
  revenueTrend: Array<{
    label: string;
    revenue: number;
    cost: number;
    marginPercent: number;
    miles: number;
  }>;
  marginByCategory: Array<{
    category: string;
    revenue: number;
    marginPercent: number;
  }>;
  driverPerformance: Array<{
    driverId: string;
    driverName: string;
    trips: number;
    marginPercent: number;
    revenue: number;
  }>;
  lanePerformance: Array<{
    lane: string;
    revenue: number;
    marginPercent: number;
    miles: number;
  }>;
  marginDistribution: Array<{
    band: string;
    trips: number;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    description: string;
    severity: "info" | "warn" | "alert";
  }>;
}

export async function POST(request: Request) {
  try {
    const analyticsData: AnalyticsContext = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        insights: generateFallbackInsights(analyticsData),
        generatedAt: new Date().toISOString(),
      });
    }

    const prompt = buildAnalyticsPrompt(analyticsData);

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const insights = parseInsightsResponse(content.text, analyticsData);
      return NextResponse.json({
        insights,
        generatedAt: new Date().toISOString(),
      });
    }

    throw new Error("Unexpected response format from Claude");
  } catch (error: any) {
    console.error("Claude API error:", error);
    
    // Return fallback insights on error
    const analyticsData: AnalyticsContext = await request.json();
    return NextResponse.json({
      insights: generateFallbackInsights(analyticsData),
      generatedAt: new Date().toISOString(),
      error: "AI insights temporarily unavailable",
    });
  }
}

function buildAnalyticsPrompt(data: AnalyticsContext): string {
  const { summary, revenueTrend, marginByCategory, driverPerformance, lanePerformance, marginDistribution, alerts } = data;

  // Calculate trends
  const revenueGrowth = revenueTrend.length >= 2 
    ? ((revenueTrend[revenueTrend.length - 1].revenue - revenueTrend[0].revenue) / revenueTrend[0].revenue) * 100
    : 0;
  
  const marginTrend = revenueTrend.length >= 2
    ? revenueTrend[revenueTrend.length - 1].marginPercent - revenueTrend[0].marginPercent
    : 0;

  // Find best and worst performers
  const bestDriver = driverPerformance[0];
  const worstDriver = driverPerformance[driverPerformance.length - 1];
  const bestLane = lanePerformance[0];
  const worstLane = lanePerformance[lanePerformance.length - 1];

  return `You are a fleet management analytics AI. Analyze this TMS operational and financial data and provide actionable insights.

**PERIOD:** ${summary.periodLabel}

**FINANCIAL PERFORMANCE:**
- Total Revenue: $${summary.totalRevenue.toLocaleString()}
- Total Cost: $${summary.totalCost.toLocaleString()}
- Margin: ${summary.marginPercent}%
- RPM (Rate Per Mile): $${summary.avgRatePerMile}
- CPM (Cost Per Mile): $${summary.avgCostPerMile}
- Total Miles: ${summary.totalMiles.toLocaleString()}

**TRIP METRICS:**
- Profitable Trips: ${summary.profitableTrips}
- At-Risk Trips: ${summary.atRiskTrips}
- Risk Ratio: ${((summary.atRiskTrips / (summary.profitableTrips + summary.atRiskTrips)) * 100).toFixed(1)}%

**REVENUE TREND (${revenueTrend.length} weeks):**
${revenueTrend.map((w, i) => 
  `- ${w.label}: Revenue $${w.revenue.toLocaleString()}, Cost $${w.cost.toLocaleString()}, Margin ${w.marginPercent}%`
).join('\n')}
- Revenue Growth: ${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%
- Margin Trend: ${marginTrend >= 0 ? '+' : ''}${marginTrend.toFixed(1)} points

**MARGIN BY CATEGORY:**
${marginByCategory.map(c => 
  `- ${c.category}: ${c.marginPercent}% margin, $${c.revenue.toLocaleString()} revenue`
).join('\n')}

**DRIVER PERFORMANCE:**
- Best: ${bestDriver.driverName} (${bestDriver.marginPercent}% margin, ${bestDriver.trips} trips, $${bestDriver.revenue.toLocaleString()})
- Worst: ${worstDriver.driverName} (${worstDriver.marginPercent}% margin, ${worstDriver.trips} trips, $${worstDriver.revenue.toLocaleString()})
- Spread: ${(bestDriver.marginPercent - worstDriver.marginPercent).toFixed(1)} points

**LANE PERFORMANCE:**
- Best: ${bestLane.lane} (${bestLane.marginPercent}% margin, $${bestLane.revenue.toLocaleString()}, ${bestLane.miles.toLocaleString()} mi)
- Worst: ${worstLane.lane} (${worstLane.marginPercent}% margin, $${worstLane.revenue.toLocaleString()}, ${worstLane.miles.toLocaleString()} mi)

**MARGIN DISTRIBUTION:**
${marginDistribution.map(m => `- ${m.band}: ${m.trips} trips`).join('\n')}

**EXISTING ALERTS:**
${alerts.map(a => `- [${a.severity.toUpperCase()}] ${a.title}: ${a.description}`).join('\n')}

Provide comprehensive insights in the following JSON structure:
{
  "executiveSummary": "2-3 sentence overview of overall fleet performance and key takeaways",
  "trendAnalysis": {
    "revenue": "Analysis of revenue trend (growth, stability, decline)",
    "margin": "Margin trend analysis with specific observations",
    "prediction": "Likely outcome for next period based on current trajectory"
  },
  "anomalyDetection": [
    {
      "type": "revenue|margin|cost|performance",
      "severity": "info|warning|critical",
      "finding": "Specific anomaly detected",
      "impact": "Business impact explanation",
      "recommendation": "Specific action to take"
    }
  ],
  "categoryInsights": {
    "strongest": "Which category is performing best and why",
    "weakest": "Which category needs attention and why",
    "opportunity": "Untapped opportunity or optimization potential"
  },
  "driverInsights": {
    "topPerformers": "Why top drivers are succeeding",
    "improvement": "How to bring lower performers up",
    "retention": "Risk of losing top talent and mitigation"
  },
  "laneInsights": {
    "optimize": "Which lanes to optimize and how",
    "expand": "Which lanes to expand on",
    "review": "Which lanes to re-evaluate pricing on"
  },
  "predictions": [
    {
      "metric": "revenue|margin|cost|trips",
      "forecast": "Expected value or trend for next period",
      "confidence": "high|medium|low",
      "reasoning": "Why this prediction makes sense"
    }
  ],
  "strategicRecommendations": [
    {
      "priority": "high|medium|low",
      "action": "Specific actionable recommendation",
      "expectedImpact": "Expected business outcome",
      "timeframe": "Implementation timeframe"
    }
  ],
  "keyMetrics": {
    "healthScore": "Overall fleet health score 0-100",
    "riskLevel": "low|medium|high",
    "efficiency": "Operational efficiency assessment",
    "profitability": "Profitability trend assessment"
  }
}

Respond ONLY with the JSON object, no other text. Be specific with numbers and concrete recommendations.`;
}

function parseInsightsResponse(response: string, context: AnalyticsContext): any {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate structure
      if (parsed.executiveSummary && parsed.trendAnalysis && parsed.predictions) {
        return parsed;
      }
    }
    
    throw new Error("Invalid JSON structure");
  } catch (error) {
    console.error("Failed to parse Claude response:", error);
    return generateFallbackInsights(context);
  }
}

function generateFallbackInsights(data: AnalyticsContext): any {
  const { summary, revenueTrend, marginByCategory, driverPerformance, lanePerformance } = data;
  
  const revenueGrowth = revenueTrend.length >= 2 
    ? ((revenueTrend[revenueTrend.length - 1].revenue - revenueTrend[0].revenue) / revenueTrend[0].revenue) * 100
    : 0;

  const healthScore = Math.min(100, Math.max(0, 
    (summary.marginPercent / 25) * 40 + // Margin contributes 40 points
    ((1 - (summary.atRiskTrips / (summary.profitableTrips + summary.atRiskTrips))) * 30) + // Risk contributes 30 points
    Math.min(30, (revenueGrowth + 10) * 1.5) // Growth contributes 30 points
  ));

  return {
    executiveSummary: `Fleet operating at ${summary.marginPercent}% margin with ${summary.profitableTrips} profitable trips across ${summary.totalMiles.toLocaleString()} miles. ${summary.atRiskTrips} trips require attention. Revenue ${revenueGrowth >= 0 ? 'growing' : 'declining'} at ${Math.abs(revenueGrowth).toFixed(1)}% rate.`,
    trendAnalysis: {
      revenue: revenueGrowth >= 5 ? "Strong revenue growth trajectory" : revenueGrowth >= 0 ? "Stable revenue with modest growth" : "Revenue decline requires immediate attention",
      margin: summary.marginPercent >= 20 ? "Healthy margin performance above industry benchmarks" : summary.marginPercent >= 15 ? "Margin acceptable but with room for optimization" : "Margin below target, cost reduction or pricing adjustment needed",
      prediction: revenueGrowth >= 0 ? "Continued stable performance expected if current trends hold" : "Risk of further margin compression without intervention",
    },
    anomalyDetection: [
      ...(summary.atRiskTrips > summary.profitableTrips * 0.1 ? [{
        type: "performance" as const,
        severity: "warning" as const,
        finding: `${summary.atRiskTrips} trips at risk (${((summary.atRiskTrips / (summary.profitableTrips + summary.atRiskTrips)) * 100).toFixed(1)}% of total)`,
        impact: "Higher than optimal risk ratio indicates pricing or cost control issues",
        recommendation: "Review at-risk trips for common patterns (lanes, drivers, customers)",
      }] : []),
      ...(lanePerformance.some(l => l.marginPercent < 15) ? [{
        type: "margin" as const,
        severity: "warning" as const,
        finding: `${lanePerformance.filter(l => l.marginPercent < 15).length} lanes operating below 15% margin`,
        impact: "Low-margin lanes diluting overall profitability",
        recommendation: "Re-negotiate rates or optimize costs on underperforming lanes",
      }] : []),
    ],
    categoryInsights: {
      strongest: `${marginByCategory[0].category} leading at ${marginByCategory[0].marginPercent}% margin with strong operational efficiency`,
      weakest: `${marginByCategory[marginByCategory.length - 1].category} at ${marginByCategory[marginByCategory.length - 1].marginPercent}% needs pricing review or cost optimization`,
      opportunity: "Focus on replicating best practices from top-performing categories across all operations",
    },
    driverInsights: {
      topPerformers: `${driverPerformance[0].driverName} and top drivers averaging ${driverPerformance.slice(0, 3).reduce((acc, d) => acc + d.marginPercent, 0) / 3}% margin through efficient routing and on-time performance`,
      improvement: "Provide mentoring and training from top performers to bring lower-margin drivers up to standard",
      retention: "Recognize and retain top performers with performance bonuses to prevent talent loss",
    },
    laneInsights: {
      optimize: lanePerformance.length > 0 
        ? `${lanePerformance[lanePerformance.length - 1].lane} and other low-margin lanes need route optimization or accessorial charges review`
        : "Review lane profitability patterns for optimization opportunities",
      expand: lanePerformance.length > 0
        ? `${lanePerformance[0].lane} performing strongly - increase frequency or seek similar lanes`
        : "Identify high-performing lanes for expansion",
      review: lanePerformance.filter(l => l.marginPercent < summary.marginPercent).map(l => l.lane).join(", ") + " require pricing adjustments",
    },
    predictions: [
      {
        metric: "revenue",
        forecast: revenueGrowth >= 0 ? "Continued growth expected" : "Stabilization required before growth resumes",
        confidence: "medium",
        reasoning: `Current ${revenueGrowth.toFixed(1)}% trend suggests ${revenueGrowth >= 0 ? 'momentum will continue' : 'corrective action needed'}`,
      },
      {
        metric: "margin",
        forecast: `Target ${Math.min(25, summary.marginPercent + 2)}% achievable through optimization`,
        confidence: summary.atRiskTrips < 15 ? "high" : "medium",
        reasoning: "Margin improvement possible through at-risk trip reduction and lane optimization",
      },
    ],
    strategicRecommendations: [
      {
        priority: "high",
        action: `Address ${summary.atRiskTrips} at-risk trips through cost analysis and pricing review`,
        expectedImpact: `Potential ${(summary.atRiskTrips * 5000).toLocaleString()} cost savings or revenue recovery`,
        timeframe: "30 days",
      },
      {
        priority: "high",
        action: `Optimize ${lanePerformance.filter(l => l.marginPercent < 18).length} underperforming lanes`,
        expectedImpact: "2-3% overall margin improvement",
        timeframe: "60 days",
      },
      {
        priority: "medium",
        action: "Implement driver performance training program based on top performer practices",
        expectedImpact: "1-2% margin improvement across mid-tier drivers",
        timeframe: "90 days",
      },
    ],
    keyMetrics: {
      healthScore: Math.round(healthScore),
      riskLevel: summary.atRiskTrips > summary.profitableTrips * 0.15 ? "high" : summary.atRiskTrips > summary.profitableTrips * 0.08 ? "medium" : "low",
      efficiency: summary.marginPercent >= 20 ? "High efficiency with strong cost control" : summary.marginPercent >= 15 ? "Moderate efficiency with optimization potential" : "Efficiency improvement required",
      profitability: revenueGrowth >= 5 ? "Strong profitability with healthy growth" : revenueGrowth >= 0 ? "Stable profitability" : "Profitability at risk",
    },
  };
}

// Helper to find best/worst performers
function getBestWorst<T extends { marginPercent?: number; [key: string]: any }>(
  arr: T[]
): { best: T; worst: T } | null {
  if (arr.length === 0) return null;
  return {
    best: arr.reduce((a, b) => (a.marginPercent || 0) > (b.marginPercent || 0) ? a : b),
    worst: arr.reduce((a, b) => (a.marginPercent || 0) < (b.marginPercent || 0) ? a : b),
  };
}
