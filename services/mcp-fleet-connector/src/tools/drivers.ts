const MASTER_DATA_SERVICE = process.env.MASTER_DATA_SERVICE || 'http://localhost:4001';

export const driverTools = {
  list_drivers: {
    name: 'list_drivers',
    description: 'List all available drivers with their status and hours available',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['Ready', 'Booked', 'Off-duty'],
          description: 'Filter drivers by status',
        },
        minHours: {
          type: 'number',
          description: 'Minimum hours available',
        },
      },
    },
    handler: async (params: any) => {
      const response = await fetch(`${MASTER_DATA_SERVICE}/api/master-data/drivers`);
      if (!response.ok) {
        throw new Error(`Failed to fetch drivers: ${response.statusText}`);
      }
      let drivers = await response.json() as any[];

      // Apply filters
      if (params.status) {
        drivers = drivers.filter((d: any) => d.status === params.status);
      }
      if (params.minHours) {
        drivers = drivers.filter((d: any) => d.hoursAvailable >= params.minHours);
      }

      return drivers;
    },
  },

  get_driver_detail: {
    name: 'get_driver_detail',
    description: 'Get detailed information about a specific driver',
    inputSchema: {
      type: 'object',
      properties: {
        driverId: {
          type: 'string',
          description: 'Driver ID (e.g., DRV-101)',
        },
      },
      required: ['driverId'],
    },
    handler: async (params: any) => {
      const response = await fetch(`${MASTER_DATA_SERVICE}/api/master-data/drivers`);
      if (!response.ok) {
        throw new Error(`Failed to fetch drivers: ${response.statusText}`);
      }
      const drivers = await response.json() as any[];
      const driver = drivers.find((d: any) => d.id === params.driverId);
      
      if (!driver) {
        throw new Error(`Driver ${params.driverId} not found`);
      }
      
      return driver;
    },
  },
};
