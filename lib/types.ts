import { z } from "zod";

export const healthStatusSchema = z.enum(["ok", "warn", "alert"]);
export type HealthStatus = z.infer<typeof healthStatusSchema>;

export const serviceHealthSchema = z.object({
  name: z.string(),
  status: healthStatusSchema,
  message: z.string().optional(),
});

export const dashboardMetricsSchema = z.object({
  activeOrders: z.number(),
  inTransit: z.number(),
  onTimePercent: z.number(),
  exceptions: z.number(),
});

export const topLaneSchema = z.object({
  lane: z.string(),
  orders: z.number(),
  onTimePercent: z.number(),
});

export const dashboardResponseSchema = z.object({
  metrics: dashboardMetricsSchema,
  serviceHealth: z.array(serviceHealthSchema),
  liveNetwork: z.object({
    filterOptions: z.object({
      dateRanges: z.array(z.string()),
      customers: z.array(z.string()),
      lanes: z.array(z.string()),
    }),
    mapSummary: z.object({
      hotspots: z.number(),
      dwellAlerts: z.number(),
    }),
  }),
  glance: z.object({
    topLanes: z.array(topLaneSchema),
    drivers: z.object({
      available: z.number(),
      booked: z.number(),
    }),
    units: z.object({
      available: z.number(),
      down: z.number(),
    }),
  }),
});
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;

export const orderStatusSchema = z.enum([
  "New",
  "Planning",
  "In Transit",
  "At Risk",
  "Delivered",
  "Exception",
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderListItemSchema = z.object({
  id: z.string(),
  reference: z.string(),
  customer: z.string(),
  pickup: z.string(),
  delivery: z.string(),
  window: z.string(),
  status: orderStatusSchema,
  ageHours: z.number(),
  cost: z.number().optional(),
  lane: z.string(),
});
export type OrderListItem = z.infer<typeof orderListItemSchema>;

export const ordersResponseSchema = z.object({
  stats: z.object({
    total: z.number(),
    new: z.number(),
    inProgress: z.number(),
    delayed: z.number(),
  }),
  filters: z.object({
    customers: z.array(z.string()),
    statuses: z.array(orderStatusSchema),
    lanes: z.array(z.string()),
    dateRanges: z.array(z.string()),
  }),
  data: z.array(orderListItemSchema),
});
export type OrdersResponse = z.infer<typeof ordersResponseSchema>;

export const orderStopSchema = z.object({
  id: z.string(),
  type: z.enum(["Pickup", "Delivery", "Drop"]),
  location: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
  instructions: z.string().optional(),
});

const keyValueSchema = z.object({
  label: z.string(),
  value: z.string(),
  helper: z.string().optional(),
});

export const bookingDriverSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  hoursAvailable: z.number(),
});

export const bookingUnitSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.string(),
  location: z.string(),
});

export const orderDetailSchema = z.object({
  id: z.string(),
  reference: z.string(),
  status: orderStatusSchema,
  customer: z.string(),
  lane: z.string(),
  laneMiles: z.number(),
  ageHours: z.number(),
  serviceLevel: z.string(),
  snapshot: z.object({
    commodity: z.string(),
    stops: z.array(orderStopSchema),
    windows: z.array(keyValueSchema.pick({ label: true, value: true })),
    notes: z.string().optional(),
  }),
  pricing: z.object({
    items: z.array(keyValueSchema),
    totals: keyValueSchema.extend({ helper: z.string().optional() }),
  }),
  booking: z.object({
    guardrails: z.array(z.string()),
    recommendedDriverId: z.string().optional(),
    recommendedUnitId: z.string().optional(),
    driverOptions: z.array(bookingDriverSchema),
    unitOptions: z.array(bookingUnitSchema),
    statusOptions: z.array(orderStatusSchema),
  }),
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;

export const dispatchOrderSchema = z.object({
  id: z.string(),
  reference: z.string(),
  customer: z.string(),
  lane: z.string(),
  pickupWindow: z.string(),
  deliveryWindow: z.string(),
  miles: z.number(),
  status: orderStatusSchema,
  priority: z.string(),
});

export const dispatchResponseSchema = z.object({
  qualifiedOrders: z.array(dispatchOrderSchema),
  recommendation: z.object({
    title: z.string(),
    description: z.string(),
    bullets: z.array(z.string()),
  }),
  filters: z.object({
    lanes: z.array(z.string()),
    priorities: z.array(z.string()),
  }),
  tripForm: z.object({
    tripTypes: z.array(z.string()),
    rateUnits: z.array(z.string()),
  }),
  crew: z.object({
    drivers: z.array(bookingDriverSchema),
    units: z.array(bookingUnitSchema),
  }),
});
export type DispatchResponse = z.infer<typeof dispatchResponseSchema>;

export const tripListItemSchema = z.object({
  id: z.string(),
  tripNumber: z.string(),
  driver: z.string(),
  unit: z.string(),
  pickup: z.string(),
  delivery: z.string(),
  eta: z.string(),
  status: z.string(),
  exceptions: z.number(),
  lastPing: z.string(),
});
export type TripListItem = z.infer<typeof tripListItemSchema>;

export const tripsResponseSchema = z.object({
  stats: z.object({
    active: z.number(),
    late: z.number(),
    exception: z.number(),
  }),
  filters: z.object({
    statuses: z.array(z.string()),
    exceptions: z.array(z.string()),
    dateRanges: z.array(z.string()),
  }),
  data: z.array(tripListItemSchema),
});
export type TripsResponse = z.infer<typeof tripsResponseSchema>;

export const timelineEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  summary: z.string(),
  location: z.string(),
  status: z.string(),
});

export const tripExceptionSchema = z.object({
  id: z.string(),
  type: z.string(),
  severity: z.enum(["info", "warn", "alert"]),
  opened: z.string(),
  owner: z.string(),
  notes: z.string(),
});

export const telemetryPointSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  speed: z.number(),
  location: z.string(),
});

export const tripDetailSchema = z.object({
  id: z.string(),
  tripNumber: z.string(),
  status: z.string(),
  driver: z.string(),
  unit: z.string(),
  eta: z.string(),
  timeline: z.array(timelineEventSchema),
  exceptions: z.array(tripExceptionSchema),
  telemetry: z.object({
    lastPing: z.string(),
    breadcrumb: z.array(telemetryPointSchema),
  }),
  notes: z.array(z.object({ id: z.string(), author: z.string(), timestamp: z.string(), body: z.string() })),
  attachments: z.array(z.object({ id: z.string(), name: z.string(), size: z.string() })),
});
export type TripDetail = z.infer<typeof tripDetailSchema>;

export const costingDefaultsSchema = z.object({
  form: z.object({
    miles: z.number(),
    revenue: z.number().optional(),
    origin: z.string(),
    destination: z.string(),
    orderType: z.string(),
    roundTrip: z.boolean(),
    borderCrossings: z.number(),
    deadheadMiles: z.number(),
    pickups: z.number(),
    deliveries: z.number(),
    driver: z.string(),
    unit: z.string(),
  }),
  breakdown: z.object({
    sections: z.array(z.object({
      title: z.string(),
      items: z.array(keyValueSchema),
    })),
    totalLabel: z.string(),
    totalValue: z.string(),
  }),
  targets: z.object({
    recommendedRPM: z.string(),
    revenue: z.string(),
    breakEven: z.string(),
  }),
  drivers: z.array(z.string()),
  units: z.array(z.string()),
  orderTypes: z.array(z.string()),
});
export type CostingDefaults = z.infer<typeof costingDefaultsSchema>;

export const masterDataRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  region: z.string(),
  updated: z.string(),
});

export const masterDataResponseSchema = z.object({
  filters: z.object({
    regions: z.array(z.string()),
    statuses: z.array(z.string()),
  }),
  data: z.array(masterDataRowSchema),
});
export type MasterDataResponse = z.infer<typeof masterDataResponseSchema>;

export const mapStepSchema = z.object({
  id: z.string(),
  sequence: z.number(),
  action: z.string(),
  location: z.string(),
  eta: z.string(),
});

export const mapPlanResponseSchema = z.object({
  options: z.object({
    vehicleProfiles: z.array(z.string()),
    avoidances: z.array(z.string()),
  }),
  steps: z.array(mapStepSchema),
  summary: z.object({
    distance: z.string(),
    eta: z.string(),
    costBand: z.string(),
  }),
});
export type MapPlanResponse = z.infer<typeof mapPlanResponseSchema>;
