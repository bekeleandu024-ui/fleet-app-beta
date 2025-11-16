import { NextResponse } from "next/server";

const ORDERS_SERVICE = process.env.ORDERS_SERVICE || 'http://localhost:4002';

export async function GET() {
  try {
    const response = await fetch(`${ORDERS_SERVICE}/api/orders`);
    if (!response.ok) {
      throw new Error('Failed to fetch orders from backend');
    }
    
    const dbOrders = await response.json();
    
    // Transform database orders to frontend format
    const orders = dbOrders.map((order: any) => {
      const ageMs = new Date().getTime() - new Date(order.created_at).getTime();
      const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
      
      // Map database status to frontend status
      const statusMap: Record<string, string> = {
        'pending': 'New',
        'planning': 'Planning',
        'in_transit': 'In Transit',
        'at_risk': 'At Risk',
        'delivered': 'Delivered',
        'exception': 'Exception',
        'cancelled': 'Exception',
      };
      
      return {
        id: order.id,
        reference: order.id.substring(0, 8),
        customer: order.customer_id,
        status: statusMap[order.status] || 'New',
        pickup: order.pickup_location,
        delivery: order.dropoff_location,
        window: order.pickup_time ? new Date(order.pickup_time).toLocaleDateString() : 'TBD',
        lane: `${order.pickup_location} → ${order.dropoff_location}`,
        laneMiles: 0, // Will be calculated
        ageHours,
        created: order.created_at,
        cost: order.estimated_cost || 0,
        revenue: (order.estimated_cost || 0) * 1.15, // 15% markup
      };
    });

    const stats = {
      total: orders.length,
      new: orders.filter((o: any) => o.status === "New").length,
      inProgress: orders.filter((o: any) => ["Planning", "In Transit"].includes(o.status)).length,
      delayed: orders.filter((o: any) => ["At Risk", "Exception"].includes(o.status)).length,
    };

    const customers = Array.from(new Set(orders.map((o: any) => o.customer))).sort();
    const statuses = Array.from(new Set(orders.map((o: any) => o.status))).sort();
    const lanes = Array.from(new Set(orders.map((o: any) => o.lane))).sort();

    return NextResponse.json({
      stats,
      filters: {
        customers: ["All", ...customers],
        statuses,
        lanes,
        dateRanges: ["Today", "48 Hours", "7 Days"],
      },
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}
