import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id;
    const body = await request.json();

    const {
      actualRevenue,
      accessorialCharges,
      deductions,
      finalCost,
      finalMargin,
      finalMarginPercent,
      documents,
      notes,
      closedAt,
    } = body;

    // In production, this would:
    // 1. Update trip status to "Closed"
    // 2. Store final financial data
    // 3. Archive all documents
    // 4. Generate final invoice
    // 5. Trigger accounting system integration
    // 6. Lock trip from further edits

    const closeoutPayload = {
      tripId,
      status: "Closed",
      actualRevenue,
      accessorialCharges,
      deductions,
      finalRevenue: actualRevenue + accessorialCharges - deductions,
      finalCost,
      finalMargin,
      finalMarginPercent,
      documents,
      notes,
      closedAt,
      closedBy: "System", // In production, would be from auth context
    };

    // Mock response
    const response = {
      success: true,
      tripId,
      closeoutData: closeoutPayload,
      message: "Trip closed successfully",
      invoiceNumber: `INV-${tripId.slice(0, 8).toUpperCase()}`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error closing trip:", error);
    return NextResponse.json(
      { error: "Failed to close trip" },
      { status: 500 }
    );
  }
}
