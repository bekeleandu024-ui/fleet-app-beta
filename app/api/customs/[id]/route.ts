import { NextResponse } from "next/server";

const TRACKING_SERVICE_URL =
  process.env.TRACKING_SERVICE_URL || "http://localhost:4004";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(
      `${TRACKING_SERVICE_URL}/api/customs/${params.id}`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "Tracking service detail error:",
        params.id,
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: "Failed to fetch customs clearance detail" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Customs Detail API Error:", error);
    return NextResponse.json(
      { error: "Failed to connect to tracking service" },
      { status: 500 }
    );
  }
}
