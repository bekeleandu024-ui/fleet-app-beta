import { NextResponse } from "next/server";

const TRACKING_SERVICE_URL = process.env.TRACKING_SERVICE_URL || "http://localhost:4004";

export async function GET() {
  try {
    const response = await fetch(`${TRACKING_SERVICE_URL}/api/customs`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
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
      { error: "Failed to connect to tracking service" },
      { status: 500 }
    );
  }
}
