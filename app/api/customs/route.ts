import { NextResponse } from "next/server";

const TRACKING_SERVICE_URL = process.env.TRACKING_SERVICE_URL || "http://localhost:4004";

export async function GET() {
  try {
    const response = await fetch(`${TRACKING_SERVICE_URL}/api/customs`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Tracking service error:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: "Failed to fetch customs clearances" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Customs API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to connect to tracking service",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
