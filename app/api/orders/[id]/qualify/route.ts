import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { notes } = await request.json();
    const orderId = params.id;

    // Update order status to "Qualified"
    const response = await fetch(`${process.env.ORDERS_SERVICE_URL || 'http://localhost:4002'}/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Qualified',
        qualification_notes: notes,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to qualify order');
    }

    const order = await response.json();

    return NextResponse.json({ 
      success: true, 
      order,
      message: 'Order qualified successfully' 
    });
  } catch (error) {
    console.error('Error qualifying order:', error);
    return NextResponse.json(
      { error: 'Failed to qualify order' },
      { status: 500 }
    );
  }
}
