const MASTER_DATA_SERVICE = process.env.MASTER_DATA_SERVICE || 'http://localhost:4001';

export const driverTools = {
  list_drivers: {
    name: 'list_drivers',
    description: 'List all available drivers with their status, hours available, location, and current assignments. Use this to find drivers for dispatch.',
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
        location: {
          type: 'string',
          description: 'Filter by driver current location or region',
        },
        maxHours: {
          type: 'number',
          description: 'Maximum hours available (to find drivers needing rest)',
        },
      },
    },
    handler: async (params: any) => {
      try {
        const response = await fetch(`${MASTER_DATA_SERVICE}/api/metadata/drivers`);
        if (!response.ok) {
          throw new Error(`Failed to fetch drivers: ${response.statusText}`);
        }
        const data: any = await response.json();
        let drivers = data.drivers || [];

        // Apply filters
        if (params.status) {
          drivers = drivers.filter((d: any) => d.status === params.status);
        }
        if (params.minHours) {
          drivers = drivers.filter((d: any) => (d.hoursAvailable || d.hours_available || 0) >= params.minHours);
        }
        if (params.maxHours) {
          drivers = drivers.filter((d: any) => (d.hoursAvailable || d.hours_available || 11) <= params.maxHours);
        }
        if (params.location) {
          const locLower = params.location.toLowerCase();
          drivers = drivers.filter((d: any) =>
            (d.current_location || d.location || d.region || '')?.toLowerCase().includes(locLower)
          );
        }

        // Transform for better readability
        const transformedDrivers = drivers.map((d: any) => ({
          driverId: d.driver_id || d.id,
          name: d.driver_name || d.name,
          status: d.status,
          hoursAvailable: d.hoursAvailable || d.hours_available,
          location: d.current_location || d.location,
          region: d.region,
          unitAssigned: d.unit_number || d.current_unit_id,
          currentTrip: d.current_trip_id,
          phoneNumber: d.phone_number,
          licenseNumber: d.license_number,
        }));

        return {
          count: transformedDrivers.length,
          filters: params,
          drivers: transformedDrivers,
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch drivers');
      }
    },
  },

  get_driver_detail: {
    name: 'get_driver_detail',
    description: 'Get detailed information about a specific driver including current assignment, performance metrics, and contact information',
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
      try {
        const response = await fetch(`${MASTER_DATA_SERVICE}/api/metadata/drivers`);
        if (!response.ok) {
          throw new Error(`Failed to fetch drivers: ${response.statusText}`);
        }
        const data: any = await response.json();
        const drivers = data.drivers || [];
        const driver = drivers.find((d: any) => 
          d.driver_id === params.driverId || 
          d.id === params.driverId ||
          d.unit_number === params.driverId
        );
        
        if (!driver) {
          throw new Error(`Driver ${params.driverId} not found. Try using list_drivers to find drivers.`);
        }
        
        return {
          driverId: driver.driver_id || driver.id,
          name: driver.driver_name || driver.name,
          status: driver.status,
          hoursAvailable: driver.hoursAvailable || driver.hours_available,
          location: driver.current_location || driver.location,
          region: driver.region,
          contact: {
            phoneNumber: driver.phone_number,
            email: driver.email,
          },
          license: {
            number: driver.license_number,
            state: driver.license_state,
            expirationDate: driver.license_expiry,
          },
          currentAssignment: {
            tripId: driver.current_trip_id,
            orderId: driver.current_order_id,
            unitId: driver.current_unit_id || driver.unit_number,
          },
          performance: {
            onTimeDeliveryRate: driver.on_time_rate,
            totalTrips: driver.total_trips,
            avgRating: driver.rating,
          },
          hireDate: driver.hire_date,
          lastActive: driver.last_active || driver.updated_at,
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch driver detail');
      }
    },
  },
};
