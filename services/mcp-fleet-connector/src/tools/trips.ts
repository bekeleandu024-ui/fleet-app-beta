const TRACKING_SERVICE = process.env.TRACKING_SERVICE || 'http://localhost:4004';

export const tripTools = {
  list_trips: {
    name: 'list_trips',
    description: 'List all trips with their current status, driver, unit, and location information. Use this to monitor active deliveries and trip progress.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['planned', 'assigned', 'in_transit', 'delivered', 'completed', 'cancelled'],
          description: 'Filter trips by status',
        },
        driverId: {
          type: 'string',
          description: 'Filter trips by driver ID (e.g., DRV-101)',
        },
        orderId: {
          type: 'string',
          description: 'Filter trips by order ID',
        },
        dateFrom: {
          type: 'string',
          description: 'Filter trips created after this date (ISO format)',
        },
        dateTo: {
          type: 'string',
          description: 'Filter trips created before this date (ISO format)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of trips to return (default: 50)',
        },
      },
    },
    handler: async (params: any) => {
      try {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append('status', params.status);
        if (params.orderId) queryParams.append('orderId', params.orderId);

        const response = await fetch(`${TRACKING_SERVICE}/api/trips?${queryParams}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch trips: ${response.statusText}`);
        }
        const data: any = await response.json();
        let trips = Array.isArray(data) ? data : (data.value || []);

        // Apply additional filters
        if (params.driverId) {
          trips = trips.filter((t: any) => t.driver_id === params.driverId);
        }
        if (params.dateFrom) {
          const fromDate = new Date(params.dateFrom);
          trips = trips.filter((t: any) => new Date(t.created_at) >= fromDate);
        }
        if (params.dateTo) {
          const toDate = new Date(params.dateTo);
          trips = trips.filter((t: any) => new Date(t.created_at) <= toDate);
        }

        // Apply limit
        const limit = params.limit || 50;
        const limitedTrips = trips.slice(0, limit);

        return {
          count: limitedTrips.length,
          total: trips.length,
          showing: limitedTrips.length < trips.length ? `Showing ${limitedTrips.length} of ${trips.length}` : 'All trips',
          trips: limitedTrips.map((t: any) => ({
            id: t.id,
            orderId: t.order_id,
            driverId: t.driver_id,
            unitId: t.unit_id,
            status: t.status,
            pickup: t.pickup_location,
            delivery: t.dropoff_location,
            plannedStart: t.planned_start,
            actualStart: t.actual_start,
            completedAt: t.completed_at,
            onTimePickup: t.on_time_pickup,
            onTimeDelivery: t.on_time_delivery,
            createdAt: t.created_at,
          })),
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch trips');
      }
    },
  },

  get_trip_detail: {
    name: 'get_trip_detail',
    description: 'Get detailed information about a specific trip including timeline, telemetry, and exceptions',
    inputSchema: {
      type: 'object',
      properties: {
        tripId: {
          type: 'string',
          description: 'Trip ID (e.g., TRP-9001)',
        },
      },
      required: ['tripId'],
    },
    handler: async (params: any) => {
      const response = await fetch(`${TRACKING_SERVICE}/api/trips/${params.tripId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch trip detail: ${response.statusText}`);
      }
      return await response.json();
    },
  },

  update_trip_status: {
    name: 'update_trip_status',
    description: 'Update the status of a trip',
    inputSchema: {
      type: 'object',
      properties: {
        tripId: {
          type: 'string',
          description: 'Trip ID',
        },
        status: {
          type: 'string',
          description: 'New status',
        },
        notes: {
          type: 'string',
          description: 'Optional notes',
        },
      },
      required: ['tripId', 'status'],
    },
    handler: async (params: any) => {
      const response = await fetch(`${TRACKING_SERVICE}/api/trips/${params.tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: params.status,
          notes: params.notes,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to update trip: ${response.statusText}`);
      }
      return await response.json();
    },
  },
};

