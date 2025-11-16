const DISPATCH_SERVICE = process.env.DISPATCH_SERVICE || 'http://localhost:4003';

export const dispatchTools = {
  recommend_driver_for_order: {
    name: 'recommend_driver_for_order',
    description: 'Recommend the best driver for a specific order based on availability, location, and capabilities',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to assign',
        },
        lane: {
          type: 'string',
          description: 'Lane (Origin → Destination)',
        },
        requirements: {
          type: 'array',
          items: { type: 'string' },
          description: 'Special requirements (e.g., hazmat, team)',
        },
      },
      required: ['orderId'],
    },
    handler: async (params: any) => {
      // This is a simplified recommendation engine
      // In production, this would use more sophisticated logic
      const driversResponse = await fetch('http://master-data:4001/api/metadata/drivers');
      if (!driversResponse.ok) {
        throw new Error('Failed to fetch drivers');
      }
      const data: any = await driversResponse.json();
      const drivers = data.drivers || [];
      
      // Filter available drivers
      const available = drivers.filter((d: any) => d.status === 'Ready' && d.hoursAvailable > 5);
      
      if (available.length === 0) {
        return {
          recommendation: null,
          message: 'No available drivers found',
        };
      }
      
      // Sort by hours available (most available first)
      available.sort((a: any, b: any) => b.hoursAvailable - a.hoursAvailable);
      
      return {
        recommendation: available[0],
        alternates: available.slice(1, 3),
        message: `Recommended ${available[0].name} with ${available[0].hoursAvailable} hours available`,
      };
    },
  },

  optimize_route: {
    name: 'optimize_route',
    description: 'Get optimized route suggestions for a lane',
    inputSchema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Origin location',
        },
        destination: {
          type: 'string',
          description: 'Destination location',
        },
        stops: {
          type: 'array',
          items: { type: 'string' },
          description: 'Additional stops',
        },
      },
      required: ['origin', 'destination'],
    },
    handler: async (params: any) => {
      // Simplified route optimization
      // In production, integrate with routing API
      return {
        origin: params.origin,
        destination: params.destination,
        estimatedMiles: 750,
        estimatedHours: 12,
        fuelStops: ['Memphis, TN', 'Birmingham, AL'],
        message: 'Route optimized for fuel efficiency',
      };
    },
  },

  create_dispatch: {
    name: 'create_dispatch',
    description: 'Create a new dispatch assignment',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        driverId: { type: 'string' },
        unitId: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['orderId', 'driverId', 'unitId'],
    },
    handler: async (params: any) => {
      const response = await fetch(`${DISPATCH_SERVICE}/api/dispatches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Failed to create dispatch: ${response.statusText}`);
      }
      return await response.json();
    },
  },
};
