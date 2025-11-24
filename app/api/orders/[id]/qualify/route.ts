import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { notes } = await request.json();
    const orderId = params.id;

    // Update order status to "Qualified" using the correct endpoint
    const ordersServiceUrl = process.env.ORDERS_SERVICE || 'http://localhost:4002';
    const response = await fetch(`${ordersServiceUrl}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CONFIRMED', // Use backend's CONFIRMED status
        notes: notes, // Store qualification notes
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Orders service error:', errorData);
      throw new Error(errorData.error || 'Failed to qualify order');
    }

    const order = await response.json();

    return NextResponse.json({ 
      success: true, 
      order,
      message: 'Order qualified successfully' 
    });
  } catch (error: any) {
    console.error('Error qualifying order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to qualify order' },
      { status: 500 }
    );
  }
}
