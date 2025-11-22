const MASTER_DATA_SERVICE = process.env.MASTER_DATA_SERVICE || 'http://localhost:4001';

export const costingTools = {
  get_costing_rules: {
    name: 'get_costing_rules',
    description: 'Get all costing rules and rates from the costing engine',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category (e.g., base-rate, fuel, accessorial)',
        },
      },
    },
    handler: async (params: any) => {
      const response = await fetch(`${MASTER_DATA_SERVICE}/api/metadata/rules`);
      if (!response.ok) {
        throw new Error(`Failed to fetch costing rules: ${response.statusText}`);
      }
      const data = await response.json() as any;
      let rules = data.rules || [];
      
      if (params.category) {
        rules = rules.filter((r: any) => r.rule_type === params.category);
      }
      
      return { count: rules.length, rules };
    },
  },

  calculate_cost: {
    name: 'calculate_cost',
    description: 'Calculate the cost for a load based on miles, commodity, and unit type',
    inputSchema: {
      type: 'object',
      properties: {
        miles: {
          type: 'number',
          description: 'Total miles',
        },
        unitType: {
          type: 'string',
          description: 'Unit type (e.g., "53\' Dry Van", "53\' Reefer")',
        },
        commodity: {
          type: 'string',
          description: 'Commodity type',
        },
        serviceLevel: {
          type: 'string',
          enum: ['Standard', 'Premium', 'Expedited'],
          description: 'Service level',
        },
      },
      required: ['miles'],
    },
    handler: async (params: any) => {
      // Fetch costing rules
      const rulesResponse = await fetch(`${MASTER_DATA_SERVICE}/api/metadata/rules`);
      if (!rulesResponse.ok) {
        throw new Error(`Failed to fetch costing rules: ${rulesResponse.statusText}`);
      }
      const rulesData = await rulesResponse.json() as any;
      const rules = rulesData.rules || [];

      // Simple cost calculation logic
      const baseRateRule = rules.find((r: any) => r.name === 'Base Rate per Mile');
      const fuelSurchargeRule = rules.find((r: any) => r.name === 'Fuel Surcharge');
      
      const baseRate = baseRateRule ? parseFloat(baseRateRule.value) : 2.50;
      const fuelRate = fuelSurchargeRule ? parseFloat(fuelSurchargeRule.value) : 0.45;
      
      let linehaul = params.miles * baseRate;
      let fuel = params.miles * fuelRate;
      
      // Adjust for service level
      if (params.serviceLevel === 'Premium') {
        linehaul *= 1.15;
      } else if (params.serviceLevel === 'Expedited') {
        linehaul *= 1.30;
      }
      
      // Reefer surcharge
      if (params.unitType?.includes('Reefer')) {
        linehaul += 250;
      }
      
      const total = linehaul + fuel;
      const margin = 0.18;
      const revenue = total / (1 - margin);
      
      return {
        linehaul: Math.round(linehaul),
        fuel: Math.round(fuel),
        total: Math.round(total),
        recommendedRevenue: Math.round(revenue),
        margin: `${(margin * 100).toFixed(0)}%`,
      };
    },
  },

  get_units: {
    name: 'get_units',
    description: 'Get list of available units/trucks',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['Available', 'In-use', 'Maintenance'],
          description: 'Filter by unit status',
        },
        type: {
          type: 'string',
          description: 'Filter by unit type',
        },
      },
    },
    handler: async (params: any) => {
      const response = await fetch(`${MASTER_DATA_SERVICE}/api/metadata/units`);
      if (!response.ok) {
        throw new Error(`Failed to fetch units: ${response.statusText}`);
      }
      const data = await response.json() as any;
      let units = data.units || [];
      
      if (params.status) {
        units = units.filter((u: any) => u.is_active === (params.status === 'Available'));
      }
      if (params.type) {
        units = units.filter((u: any) => u.driver_type?.includes(params.type));
      }
      
      return { count: units.length, units };
    },
  },
};

