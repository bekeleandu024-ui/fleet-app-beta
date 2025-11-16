const ORDERS_SERVICE = process.env.ORDERS_SERVICE || 'http://localhost:4002';

export const orderTools = {
  search_orders: {
    name: 'search_orders',
    description: 'Search and filter orders by customer, status, or location. Returns all orders with their UUID identifiers. Use this to find orders when you only know the customer name or route.',
    inputSchema: {
      type: 'object',
      properties: {
        customer: {
          type: 'string',
          description: 'Customer ID to filter by (e.g., cust-123, cust-789, cust-demo)',
        },
        status: {
          type: 'string',
          enum: ['pending', 'in_transit', 'delivered', 'cancelled'],
          description: 'Order status to filter by',
        },
        location: {
          type: 'string',
          description: 'Search in pickup or dropoff location (e.g., Chicago, Toronto, Buffalo)',
        },
      },
    },
    handler: async (params: any) => {
      try {
        const response = await fetch(`${ORDERS_SERVICE}/api/orders`);
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }
        let orders = await response.json() as any[];

        // Apply filters
        if (params.customer) {
          orders = orders.filter((o: any) =>
            o.customer_id?.toLowerCase().includes(params.customer.toLowerCase())
          );
        }
        if (params.status) {
          orders = orders.filter((o: any) => o.status === params.status);
        }
        if (params.location) {
          const loc = params.location.toLowerCase();
          orders = orders.filter((o: any) =>
            o.pickup_location?.toLowerCase().includes(loc) ||
            o.dropoff_location?.toLowerCase().includes(loc)
          );
        }

        return {
          count: orders.length,
          orders: orders.map((o: any) => ({
            id: o.id,
            customer_id: o.customer_id,
            order_type: o.order_type,
            status: o.status,
            route: `${o.pickup_location} → ${o.dropoff_location}`,
            pickup_location: o.pickup_location,
            dropoff_location: o.dropoff_location,
            created_at: o.created_at,
          })),
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to search orders');
      }
    },
  },

  get_order_detail: {
    name: 'get_order_detail',
    description: 'Get detailed information about a specific order. Note: The system uses UUID identifiers, not order numbers like ORD-10452. If searching by order number fails, use search_orders instead to find orders by customer or location.',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'The order UUID (e.g., 93bddb8f-9365-45d1-a68e-252b29f33ca8)',
        },
      },
      required: ['orderId'],
    },
    handler: async (params: any) => {
      try {
        const response = await fetch(`${ORDERS_SERVICE}/api/orders/${params.orderId}`);
        if (!response.ok) {
          if (response.status === 404 || response.status === 500) {
            // Try to provide helpful error message
            throw new Error(`Order ${params.orderId} not found. The system uses UUID identifiers. Try using search_orders to find orders by customer or location instead.`);
          }
          throw new Error(`Failed to fetch order detail: ${response.statusText}`);
        }
        return await response.json();
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch order detail');
      }
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
