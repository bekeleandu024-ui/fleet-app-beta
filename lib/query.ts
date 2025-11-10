export const queryKeys = {
  dashboard: ["dashboard"] as const,
  orders: () => ["orders"] as const,
  order: (id: string) => ["orders", id] as const,
  dispatch: ["dispatch"] as const,
  trips: () => ["trips"] as const,
  trip: (id: string) => ["trips", id] as const,
  costing: ["costing"] as const,
  masterData: {
    drivers: ["master-data", "drivers"] as const,
    units: ["master-data", "units"] as const,
    rules: ["master-data", "rules"] as const,
    events: ["master-data", "events"] as const,
  },
  map: ["map-plan"] as const,
};
