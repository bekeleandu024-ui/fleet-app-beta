import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const body = await request.json();

    const { newTotalCost, newMargin, breakdown, adjustments } = body;

    // In production, this would update the trip cost in the database
    // and log the cost adjustment history
    const updatePayload = {
      totalCost: newTotalCost,
      margin: newMargin,
      costBreakdown: breakdown,
      adjustments: adjustments,
      recalculatedAt: new Date().toISOString(),
    };

    // Mock response - in production, would call backend service
    const response = {
      success: true,
      tripId,
      updatedCosts: updatePayload,
      message: "Trip costs recalculated successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error recalculating trip costs:", error);
    return NextResponse.json(
      { error: "Failed to recalculate trip costs" },
      { status: 500 }
    );
  }
}
