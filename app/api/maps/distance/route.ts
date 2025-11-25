import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Origin and destination are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      origin
    )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}&units=imperial`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(data.error_message || "Failed to fetch distance");
    }

    const element = data.rows[0]?.elements[0];
    if (!element || element.status !== "OK") {
      return NextResponse.json(
        { error: "Could not calculate distance for these locations" },
        { status: 404 }
      );
    }

    // Convert meters to miles (1 meter = 0.000621371 miles)
    const distanceMiles = (element.distance.value * 0.000621371).toFixed(1);
    // Duration is in seconds
    const durationHours = (element.duration.value / 3600).toFixed(1);

    return NextResponse.json({
      distance: parseFloat(distanceMiles),
      duration: parseFloat(durationHours),
      distanceText: element.distance.text,
      durationText: element.duration.text,
    });
  } catch (error: any) {
    console.error("Distance Matrix API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
