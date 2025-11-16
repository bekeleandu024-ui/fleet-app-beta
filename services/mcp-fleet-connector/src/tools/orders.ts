const ORDERS_SERVICE = process.env.ORDERS_SERVICE || 'http://localhost:4002';

export const orderTools = {
  search_orders: {
    name: 'search_orders',
    description: 'Search and filter orders by customer, status, lane, or date range',
    inputSchema: {
      type: 'object',
      properties: {
        customer: {
          type: 'string',
          description: 'Customer name to filter by',
        },
        status: {
          type: 'string',
          enum: ['New', 'Planning', 'In Transit', 'At Risk', 'Delivered', 'Exception'],
          description: 'Order status to filter by',
        },
        lane: {
          type: 'string',
          description: 'Lane (Origin → Destination) to filter by',
        },
      },
    },
    handler: async (params: any) => {
      const queryParams = new URLSearchParams();
      if (params.customer) queryParams.append('customer', params.customer);
      if (params.status) queryParams.append('status', params.status);
      if (params.lane) queryParams.append('lane', params.lane);

      const response = await fetch(`${ORDERS_SERVICE}/api/orders?${queryParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }
      return await response.json();
    },
  },

  get_order_detail: {
    name: 'get_order_detail',
    description: 'Get detailed information about a specific order including pricing, stops, and booking details',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'The order ID (e.g., ORD-10452)',
        },
      },
      required: ['orderId'],
    },
    handler: async (params: any) => {
      const response = await fetch(`${ORDERS_SERVICE}/api/orders/${params.orderId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch order detail: ${response.statusText}`);
      }
      return await response.json();
    },
  },

  create_order: {
    name: 'create_order',
    description: 'Create a new order with customer, lane, and service details',
    inputSchema: {
      type: 'object',
      properties: {
        customer: { type: 'string', description: 'Customer name' },
        pickup: { type: 'string', description: 'Pickup location' },
        delivery: { type: 'string', description: 'Delivery location' },
        commodity: { type: 'string', description: 'Commodity/cargo type' },
        serviceLevel: {
          type: 'string',
          enum: ['Standard', 'Premium', 'Expedited'],
          description: 'Service level',
        },
      },
      required: ['customer', 'pickup', 'delivery'],
    },
    handler: async (params: any) => {
      const response = await fetch(`${ORDERS_SERVICE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Failed to create order: ${response.statusText}`);
      }
      return await response.json();
    },
  },

  get_order_stats: {
    name: 'get_order_stats',
    description: 'Get order statistics and counts by status',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const response = await fetch(`${ORDERS_SERVICE}/api/orders`);
      if (!response.ok) {
        throw new Error(`Failed to fetch order stats: ${response.statusText}`);
      }
      const data = await response.json() as any;
      const orders = data.value || data || [];
      const total = data.Count || orders.length || 0;
      
      // Count by status
      const statusCounts: Record<string, number> = {};
      orders.forEach((order: any) => {
        const status = order.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      return {
        total,
        byStatus: statusCounts,
        orders: orders.map((o: any) => ({
          id: o.id,
          status: o.status,
          customer: o.customer_id,
          pickup: o.pickup_location,
          dropoff: o.dropoff_location,
        })),
      };
    },
  },
};
