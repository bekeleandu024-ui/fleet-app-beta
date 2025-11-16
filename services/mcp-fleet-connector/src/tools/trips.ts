const TRACKING_SERVICE = process.env.TRACKING_SERVICE || 'http://localhost:4004';

export const tripTools = {
  list_trips: {
    name: 'list_trips',
    description: 'List all trips with their current status',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter trips by status',
        },
      },
    },
    handler: async (params: any) => {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);

      const response = await fetch(`${TRACKING_SERVICE}/api/trips?${queryParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch trips: ${response.statusText}`);
      }
      return await response.json();
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
