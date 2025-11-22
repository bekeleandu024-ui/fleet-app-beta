const ORDERS_SERVICE = process.env.ORDERS_SERVICE || 'http://localhost:4002';
const FRONTEND_API = 'http://localhost:3000';

export const orderTools = {
  search_orders: {
    name: 'search_orders',
    description: 'Search and filter orders by customer, status, location, date range, or lane. Returns orders from both the database and the frontend system. Use this to find orders when you only know the customer name or route.',
    inputSchema: {
      type: 'object',
      properties: {
        customer: {
          type: 'string',
          description: 'Customer ID or customer name to filter by (e.g., cust-123, Brightline Retail)',
        },
        status: {
          type: 'string',
          enum: ['pending', 'in_transit', 'delivered', 'cancelled', 'at_risk'],
          description: 'Order status to filter by',
        },
        location: {
          type: 'string',
          description: 'Search in pickup or dropoff location (e.g., Chicago, Toronto, Buffalo)',
        },
        lane: {
          type: 'string',
          description: 'Search by lane/route (e.g., "Chicago → Toronto")',
        },
        dateFrom: {
          type: 'string',
          description: 'Filter orders created after this date (ISO format: YYYY-MM-DD)',
        },
        dateTo: {
          type: 'string',
          description: 'Filter orders created before this date (ISO format: YYYY-MM-DD)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of orders to return (default: 50)',
        },
      },
    },
    handler: async (params: any) => {
      try {
        // Fetch from both sources
        const [dbResponse, frontendResponse] = await Promise.allSettled([
          fetch(`${ORDERS_SERVICE}/api/orders`),
          fetch(`${FRONTEND_API}/api/orders`),
        ]);

        let allOrders: any[] = [];

        // Get database orders
        if (dbResponse.status === 'fulfilled' && dbResponse.value.ok) {
          const dbData = await dbResponse.value.json() as any;
          const dbOrders = dbData.data || dbData.value || (Array.isArray(dbData) ? dbData : []);
          allOrders.push(...dbOrders.map((o: any) => ({
            id: o.id,
            displayId: o.id.substring(0, 8), // First 8 chars of UUID
            customer: o.customer_id || o.customer,
            order_type: o.order_type,
            status: o.status,
            route: o.lane || `${o.pickup_location} → ${o.dropoff_location}`,
            pickup_location: o.pickup_location || o.pickup,
            dropoff_location: o.dropoff_location || o.delivery,
            created_at: o.created_at || o.created,
            source: 'database',
          })));
        }

        // Get frontend orders (mock data)
        if (frontendResponse.status === 'fulfilled' && frontendResponse.value.ok) {
          const frontendData: any = await frontendResponse.value.json();
          const frontendOrders = frontendData.data || [];
          allOrders.push(...frontendOrders.map((o: any) => ({
            id: o.id,
            displayId: o.id,
            customer: o.customer,
            status: o.status,
            route: o.lane,
            age: o.ageHours,
            miles: o.laneMiles,
            cost: o.cost,
            revenue: o.revenue,
            created_at: o.created,
            source: 'frontend',
          })));
        }

        // Apply filters
        if (params.customer) {
          const customerLower = params.customer.toLowerCase();
          allOrders = allOrders.filter((o: any) =>
            o.customer?.toLowerCase().includes(customerLower)
          );
        }
        if (params.status) {
          allOrders = allOrders.filter((o: any) => 
            o.status?.toLowerCase() === params.status.toLowerCase()
          );
        }
        if (params.location) {
          const loc = params.location.toLowerCase();
          allOrders = allOrders.filter((o: any) =>
            o.route?.toLowerCase().includes(loc) ||
            o.pickup_location?.toLowerCase().includes(loc) ||
            o.dropoff_location?.toLowerCase().includes(loc)
          );
        }
        if (params.lane) {
          const laneLower = params.lane.toLowerCase();
          allOrders = allOrders.filter((o: any) =>
            o.route?.toLowerCase().includes(laneLower) ||
            o.lane?.toLowerCase().includes(laneLower)
          );
        }
        if (params.dateFrom) {
          const fromDate = new Date(params.dateFrom);
          allOrders = allOrders.filter((o: any) => {
            const orderDate = new Date(o.created_at || o.created);
            return orderDate >= fromDate;
          });
        }
        if (params.dateTo) {
          const toDate = new Date(params.dateTo);
          allOrders = allOrders.filter((o: any) => {
            const orderDate = new Date(o.created_at || o.created);
            return orderDate <= toDate;
          });
        }

        // Apply limit
        const limit = params.limit || 50;
        const limitedOrders = allOrders.slice(0, limit);

        return {
          count: limitedOrders.length,
          total: allOrders.length,
          showing: limitedOrders.length < allOrders.length ? `Showing ${limitedOrders.length} of ${allOrders.length}` : 'All orders',
          sources: {
            database: allOrders.filter(o => o.source === 'database').length,
            frontend: allOrders.filter(o => o.source === 'frontend').length,
          },
          orders: limitedOrders,
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to search orders');
      }
    },
  },

  get_order_detail: {
    name: 'get_order_detail',
    description: 'Get detailed information about a specific order. Accepts both UUID format (database) and ORD-XXXXX format (frontend). Try both sources if one fails.',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'The order ID - can be UUID (e.g., 93bddb8f-9365...) or order number (e.g., ORD-10452)',
        },
      },
      required: ['orderId'],
    },
    handler: async (params: any) => {
      try {
        // Try frontend API first (handles ORD-XXXXX format)
        const frontendResponse = await fetch(`${FRONTEND_API}/api/orders/${params.orderId}`);
        if (frontendResponse.ok) {
          const data: any = await frontendResponse.json();
          return { ...data, source: 'frontend' };
        }

        // Try database API (handles UUID format)
        const dbResponse = await fetch(`${ORDERS_SERVICE}/api/orders/${params.orderId}`);
        if (dbResponse.ok) {
          const data: any = await dbResponse.json();
          return { ...data, source: 'database' };
        }

        // Neither worked
        throw new Error(`Order ${params.orderId} not found in either system. Try using search_orders to find orders by customer or location.`);
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
      
      // Handle different response formats
      const orders = data.data || data.value || (Array.isArray(data) ? data : []);
      const stats = data.stats || {};
      const total = stats.total || orders.length || 0;
      
      // Count by status
      const statusCounts: Record<string, number> = {};
      orders.forEach((order: any) => {
        const status = order.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      return {
        total,
        byStatus: statusCounts,
        stats: stats, // Include original stats if available
        orders: orders.slice(0, 10).map((o: any) => ({
          id: o.id,
          status: o.status,
          customer: o.customer_id || o.customer,
          pickup: o.pickup_location || o.pickup,
          dropoff: o.dropoff_location || o.delivery,
          lane: o.lane,
        })),
      };
    },
  },
};

