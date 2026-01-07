import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import pool from "@/lib/db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// ============================================================================
// TYPES
// ============================================================================

interface TripInsightBarData {
  tripId: string;
  lane: { origin: string; destination: string };
  distance: number;
  revenue: number;
  cost: number;
  profit: number;
  rpm: number;
  cpm: number;
  marginPct: number;
  driver: { 
    name: string | null; 
    type: string | null;
    hosRemaining: number | null;
  };
  documents: { 
    bol: "uploaded" | "pending"; 
    pod: "uploaded" | "pending" | "required";
  };
  timing: { 
    pickup: "on_time" | "late" | "early" | "pending"; 
    delivery: "on_time" | "late" | "early" | "pending";
  };
  status: string;
  customer?: string;
}

interface InsightResponse {
  insights: Array<{
    type: "critical" | "warning" | "opportunity" | "info";
    icon: string;
    title: string;
    description: string;
    actionLabel: string;
    actionType: string;
  }>;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const INSIGHT_BAR_SYSTEM_PROMPT = `You are a fleet management AI assistant. Analyze trip data and return actionable insights as JSON. 

Each insight should have:
- type: "critical" | "warning" | "opportunity" | "info" (use critical for losses/urgent issues, warning for concerns, opportunity for improvements, info for neutral observations)
- icon: A relevant emoji (📉 for losses, ⚠️ for warnings, 💡 for opportunities, ✅ for positive, 📄 for documents, ⏰ for timing, 👤 for driver issues)
- title: Short title (2-5 words, e.g., "Severe Margin Loss", "Document Required", "Driver HOS Alert")
- description: 1-2 sentences with specific numbers highlighted. Be direct and actionable.
- actionLabel: 2-3 words for the action button (e.g., "Review Rate", "Upload POD", "Check HOS")
- actionType: Machine-readable action identifier (e.g., "open_rate_modal", "upload_document", "view_driver_hos", "reroute_trip")

Prioritize insights by urgency:
1. Critical financial issues (negative margins, significant losses)
2. Compliance risks (missing required documents, HOS violations)
3. Timing concerns (late deliveries, delays)
4. Optimization opportunities (better rates, efficiency improvements)
5. Informational items (positive performance notes)

Return 3-5 insights maximum, focusing on the most actionable items. Always include at least one insight.

IMPORTANT: Return ONLY valid JSON with no markdown formatting, no code blocks, just the raw JSON object.`;

// ============================================================================
// API ROUTE
// ============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // Fetch trip data from database - trips table has most data denormalized
    const tripResult = await pool.query(
      `SELECT 
        t.*,
        d.driver_type as driver_type,
        o.customer_name as order_customer_name,
        o.quoted_rate
      FROM trips t
      LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
      LEFT JOIN orders o ON t.order_id = o.id
      WHERE t.id = $1`,
      [id]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const trip = tripResult.rows[0];

    // Calculate financial metrics - use trips table columns directly
    const revenue = Number(trip.revenue) || Number(trip.expected_revenue) || Number(trip.quoted_rate) || 0;
    const totalCost = Number(trip.total_cost) || 0;
    const distance = Number(trip.distance_miles) || Number(trip.planned_miles) || 0;
    const profit = revenue - totalCost;
    const marginPct = revenue > 0 ? ((profit / revenue) * 100) : 0;
    const rpm = distance > 0 ? revenue / distance : 0;
    const cpm = distance > 0 ? totalCost / distance : 0;

    // Build origin/destination strings from trips table
    const origin = trip.pickup_location || "Unknown Origin";
    const destination = trip.dropoff_location || "Unknown Destination";

    // Prepare trip data for Claude
    const tripData: TripInsightBarData = {
      tripId: trip.trip_number || id,
      lane: { origin, destination },
      distance: Math.round(distance),
      revenue: Math.round(revenue * 100) / 100,
      cost: Math.round(totalCost * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      rpm: Math.round(rpm * 100) / 100,
      cpm: Math.round(cpm * 100) / 100,
      marginPct: Math.round(marginPct * 10) / 10,
      driver: {
        name: trip.driver_name || null,
        type: trip.driver_type || null,
        hosRemaining: null, // HOS data not available in current schema
      },
      documents: {
        bol: trip.bol_uploaded ? "uploaded" : "pending",
        pod: trip.pod_url ? "uploaded" : "required",
      },
      timing: {
        pickup: trip.on_time_pickup === true ? "on_time" : 
                trip.on_time_pickup === false ? "late" : "pending",
        delivery: trip.on_time_delivery === true ? "on_time" : 
                  trip.on_time_delivery === false ? "late" : "pending",
      },
      status: trip.status || "Unknown",
      customer: trip.customer_name || undefined,
    };

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: INSIGHT_BAR_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze this trip and provide insights:\n${JSON.stringify(tripData, null, 2)}`,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in Claude response");
    }

    // Parse the JSON response
    let insights: InsightResponse;
    try {
      // Clean up potential markdown formatting
      let jsonStr = textContent.text.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();
      
      insights = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", textContent.text);
      // Return fallback insights based on trip data
      insights = generateFallbackInsights(tripData);
    }

    // Validate insights structure
    if (!insights.insights || !Array.isArray(insights.insights)) {
      insights = generateFallbackInsights(tripData);
    }

    return NextResponse.json({
      tripId: id,
      insights: insights.insights,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Trip insights bar error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate insights" },
      { status: 500 }
    );
  }
}

// ============================================================================
// FALLBACK INSIGHTS GENERATOR
// ============================================================================

function generateFallbackInsights(tripData: TripInsightBarData): InsightResponse {
  const insights: InsightResponse["insights"] = [];

  // Critical: Check for margin issues
  if (tripData.profit < 0) {
    insights.push({
      type: "critical",
      icon: "📉",
      title: "Severe Margin Loss",
      description: `This trip is losing $${Math.abs(tripData.profit).toLocaleString()} (${tripData.marginPct.toFixed(0)}% margin). Revenue of $${tripData.rpm.toFixed(2)}/mi is significantly below fleet average.`,
      actionLabel: "Review Rate",
      actionType: "open_rate_modal",
    });
  } else if (tripData.marginPct < 10) {
    insights.push({
      type: "warning",
      icon: "⚠️",
      title: "Low Margin",
      description: `Trip margin is ${tripData.marginPct.toFixed(1)}%, below the 18% target. Consider rate adjustment for future loads on this lane.`,
      actionLabel: "View Analysis",
      actionType: "open_rate_modal",
    });
  }

  // Warning: Missing documents
  if (tripData.documents.pod === "required") {
    insights.push({
      type: "warning",
      icon: "📄",
      title: "POD Required",
      description: "Proof of Delivery document is required but not yet uploaded. Upload to complete trip billing.",
      actionLabel: "Upload POD",
      actionType: "upload_pod",
    });
  }

  if (tripData.documents.bol === "pending") {
    insights.push({
      type: "info",
      icon: "📄",
      title: "BOL Pending",
      description: "Bill of Lading has not been uploaded. Recommend uploading for documentation compliance.",
      actionLabel: "Upload BOL",
      actionType: "upload_bol",
    });
  }

  // Check driver HOS
  if (tripData.driver.hosRemaining !== null && tripData.driver.hosRemaining < 2) {
    insights.push({
      type: "critical",
      icon: "⏰",
      title: "HOS Critical",
      description: `Driver has only ${tripData.driver.hosRemaining.toFixed(1)} hours remaining. May not complete delivery without rest break.`,
      actionLabel: "Check HOS",
      actionType: "view_driver_hos",
    });
  } else if (tripData.driver.hosRemaining !== null && tripData.driver.hosRemaining < 4) {
    insights.push({
      type: "warning",
      icon: "⏰",
      title: "HOS Limited",
      description: `Driver has ${tripData.driver.hosRemaining.toFixed(1)} hours of drive time remaining. Monitor for delays.`,
      actionLabel: "Check HOS",
      actionType: "view_driver_hos",
    });
  }

  // Timing issues
  if (tripData.timing.delivery === "late") {
    insights.push({
      type: "warning",
      icon: "⚠️",
      title: "Late Delivery",
      description: "Delivery was marked as late. Consider reviewing route or notifying customer about any service credits.",
      actionLabel: "View Details",
      actionType: "view_timing",
    });
  }

  // Opportunity: Good margin
  if (tripData.marginPct >= 25 && insights.length < 3) {
    insights.push({
      type: "opportunity",
      icon: "✅",
      title: "Strong Margin",
      description: `Trip margin of ${tripData.marginPct.toFixed(1)}% exceeds target. Consider this lane for repeat business.`,
      actionLabel: "View Lane",
      actionType: "view_lane_history",
    });
  }

  // Ensure we have at least one insight
  if (insights.length === 0) {
    insights.push({
      type: "info",
      icon: "✅",
      title: "Trip On Track",
      description: `Trip from ${tripData.lane.origin} to ${tripData.lane.destination} is progressing normally.`,
      actionLabel: "View Details",
      actionType: "view_details",
    });
  }

  return { insights: insights.slice(0, 5) };
}
