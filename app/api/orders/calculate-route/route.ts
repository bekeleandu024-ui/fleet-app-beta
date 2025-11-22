import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { pickup, delivery } = await request.json();

    if (!pickup || !delivery) {
      return NextResponse.json(
        { error: "Pickup and delivery locations are required" },
        { status: 400 }
      );
    }

    const prompt = `You are a logistics routing expert. Calculate the driving distance and estimated transit time between these two locations:

Origin: ${pickup}
Destination: ${delivery}

Provide your response in this exact JSON format (no markdown, no explanation):
{
  "distance_miles": <number>,
  "duration_hours": <number>,
  "route_notes": "<brief note about the route, e.g., 'I-5 corridor' or 'cross-country haul'>"
}

Use your knowledge of North American geography and highway systems. Consider:
- Major interstate highways and typical routing
- Realistic truck driving speeds (average 50-55 mph including rest stops)
- Typical commercial vehicle routes

Return ONLY the JSON object, nothing else.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    
    // Parse the JSON response
    const routeData = JSON.parse(responseText.trim());

    return NextResponse.json({
      distance: Math.round(routeData.distance_miles),
      duration: Math.round(routeData.duration_hours * 10) / 10, // Round to 1 decimal
      notes: routeData.route_notes,
    });
  } catch (error) {
    console.error("Error calculating route:", error);
    return NextResponse.json(
      { error: "Failed to calculate route" },
      { status: 500 }
    );
  }
}

