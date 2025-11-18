const MASTER_DATA_SERVICE = process.env.MASTER_DATA_SERVICE || 'http://localhost:4001';

export const unitTools = {
  list_units: {
    name: 'list_units',
    description: 'List all trucks/units with their status, location, and availability. Use this to find available trucks for dispatch or check unit status.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['Available', 'In Use', 'Maintenance', 'Out of Service'],
          description: 'Filter units by status',
        },
        region: {
          type: 'string',
          description: 'Filter units by region (e.g., East, West, Midwest)',
        },
        type: {
          type: 'string',
          description: 'Filter units by type (e.g., Dry Van, Reefer, Flatbed)',
        },
        location: {
          type: 'string',
          description: 'Filter units by current location',
        },
      },
    },
    handler: async (params: any) => {
      try {
        const response = await fetch(`${MASTER_DATA_SERVICE}/api/metadata/units`);
        if (!response.ok) {
          throw new Error(`Failed to fetch units: ${response.statusText}`);
        }
        const data: any = await response.json();
        let units = data.units || [];

        // Apply filters
        if (params.status) {
          units = units.filter((u: any) => {
            const unitStatus = u.is_active === false ? 'Maintenance' : 'Available';
            return unitStatus.toLowerCase() === params.status.toLowerCase();
          });
        }
        if (params.region) {
          const regionLower = params.region.toLowerCase();
          units = units.filter((u: any) =>
            u.region?.toLowerCase().includes(regionLower)
          );
        }
        if (params.type) {
          const typeLower = params.type.toLowerCase();
          units = units.filter((u: any) =>
            (u.unit_type || u.type)?.toLowerCase().includes(typeLower)
          );
        }
        if (params.location) {
          const locLower = params.location.toLowerCase();
          units = units.filter((u: any) =>
            (u.current_location || u.location)?.toLowerCase().includes(locLower)
          );
        }

        // Transform units for better readability
        const transformedUnits = units.map((u: any) => ({
          id: u.unit_id || u.id,
          unitNumber: u.unit_number || u.name,
          type: u.unit_type || u.type || 'Unknown',
          status: u.is_active === false ? 'Maintenance' : 'Available',
          region: u.region || 'Unknown',
          location: u.current_location || u.location || 'Fleet Yard',
          lastUpdated: u.updated || u.updated_at,
        }));

        return {
          count: transformedUnits.length,
          units: transformedUnits,
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch units');
      }
    },
  },

  get_unit_detail: {
    name: 'get_unit_detail',
    description: 'Get detailed information about a specific truck/unit including maintenance history, current assignment, and specifications',
    inputSchema: {
      type: 'object',
      properties: {
        unitId: {
          type: 'string',
          description: 'Unit ID or unit number (e.g., UNIT-101, TRK-5523)',
        },
      },
      required: ['unitId'],
    },
    handler: async (params: any) => {
      try {
        const response = await fetch(`${MASTER_DATA_SERVICE}/api/metadata/units`);
        if (!response.ok) {
          throw new Error(`Failed to fetch units: ${response.statusText}`);
        }
        const data: any = await response.json();
        const units = data.units || [];
        
        // Find unit by ID or unit number
        const unit = units.find((u: any) =>
          u.unit_id === params.unitId ||
          u.id === params.unitId ||
          u.unit_number === params.unitId ||
          u.name === params.unitId
        );

        if (!unit) {
          throw new Error(`Unit ${params.unitId} not found. Try using list_units to find units.`);
        }

        // Return detailed unit info
        return {
          id: unit.unit_id || unit.id,
          unitNumber: unit.unit_number || unit.name,
          type: unit.unit_type || unit.type || 'Unknown',
          status: unit.is_active === false ? 'Maintenance' : 'Available',
          region: unit.region || 'Unknown',
          location: unit.current_location || unit.location || 'Fleet Yard',
          lastUpdated: unit.updated || unit.updated_at,
          specifications: {
            make: unit.make,
            model: unit.model,
            year: unit.year,
            vin: unit.vin,
            capacity: unit.capacity,
          },
          maintenance: {
            lastService: unit.last_service_date,
            nextService: unit.next_service_date,
            mileage: unit.mileage,
          },
          currentAssignment: {
            tripId: unit.current_trip_id,
            driverId: unit.current_driver_id,
            orderId: unit.current_order_id,
          },
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch unit detail');
      }
    },
  },

  get_available_units: {
    name: 'get_available_units',
    description: 'Get all available units ready for dispatch in a specific location or region. Useful when assigning orders to drivers.',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Location or region to search for available units',
        },
        unitType: {
          type: 'string',
          description: 'Required unit type (e.g., Dry Van, Reefer, Flatbed)',
        },
      },
    },
    handler: async (params: any) => {
      try {
        const response = await fetch(`${MASTER_DATA_SERVICE}/api/metadata/units`);
        if (!response.ok) {
          throw new Error(`Failed to fetch units: ${response.statusText}`);
        }
        const data: any = await response.json();
        let units = data.units || [];

        // Filter for available units only
        units = units.filter((u: any) => u.is_active !== false);

        // Apply location filter
        if (params.location) {
          const locLower = params.location.toLowerCase();
          units = units.filter((u: any) =>
            (u.current_location || u.location || u.region)?.toLowerCase().includes(locLower)
          );
        }

        // Apply unit type filter
        if (params.unitType) {
          const typeLower = params.unitType.toLowerCase();
          units = units.filter((u: any) =>
            (u.unit_type || u.type)?.toLowerCase().includes(typeLower)
          );
        }

        const availableUnits = units.map((u: any) => ({
          unitId: u.unit_id || u.id,
          unitNumber: u.unit_number || u.name,
          type: u.unit_type || u.type,
          location: u.current_location || u.location,
          region: u.region,
        }));

        return {
          count: availableUnits.length,
          location: params.location || 'All locations',
          unitType: params.unitType || 'All types',
          units: availableUnits,
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch available units');
      }
    },
  },
};
