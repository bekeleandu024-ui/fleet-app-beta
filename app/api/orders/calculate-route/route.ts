import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper to geocode a location string
async function geocode(location: string) {
  try {
    // Add a small delay to respect Nominatim's rate limit if multiple requests happen
    // But for a single request pair it's fine.
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'FleetApp/1.0'
        }
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        display_name: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Helper to calculate route using OSRM
async function getOsrmRoute(start: {lat: number, lng: number}, end: {lat: number, lng: number}) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=false`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const route = data.routes[0];
      return {
        distance_miles: (route.distance / 1609.34),
        duration_hours: (route.duration / 3600)
      };
    }
    return null;
  } catch (error) {
    console.error('OSRM error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pickup, delivery } = await request.json();

    if (!pickup || !delivery) {
      return NextResponse.json(
        { error: "Pickup and delivery locations are required" },
        { status: 400 }
      );
    }

    // 1. Try to calculate real distance using OSRM
    try {
      console.log(`Attempting real distance calculation for: ${pickup} -> ${delivery}`);
      const [pickupCoords, deliveryCoords] = await Promise.all([
        geocode(pickup),
        geocode(delivery)
      ]);

      if (pickupCoords && deliveryCoords) {
        const osrmRoute = await getOsrmRoute(pickupCoords, deliveryCoords);
        
        if (osrmRoute) {
          console.log('Successfully calculated real distance:', osrmRoute);
          return NextResponse.json({
            distance: Math.round(osrmRoute.distance_miles),
            duration: Math.round(osrmRoute.duration_hours * 10) / 10,
            notes: "Real-time route calculation via OSRM",
            isRealDistance: true
          });
        }
      }
    } catch (realDistanceError) {
      console.warn("Failed to calculate real distance, falling back to AI:", realDistanceError);
      // Continue to AI fallback
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
      isRealDistance: false
    });
  } catch (error) {
    console.error("Error calculating route:", error);
    return NextResponse.json(
      { error: "Failed to calculate route" },
      { status: 500 }
    );
  }
}

