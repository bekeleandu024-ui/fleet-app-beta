import { NextRequest, NextResponse } from "next/server";
import { serviceFetch } from "@/lib/service-client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const event = await serviceFetch("tracking", `/api/trips/${id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error: any) {
    console.error("Error creating trip event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create event" },
      { status: error.status || 500 }
    );
  }
}
