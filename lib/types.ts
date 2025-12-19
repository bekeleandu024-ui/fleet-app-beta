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
  "Closed",
  "Completed",
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderListItemSchema = z.object({
  id: z.string(),
  orderNumber: z.string().optional(),
  reference: z.string(),
  customer: z.string(),
  pickup: z.string(),
  delivery: z.string(),
  window: z.string(),
  status: orderStatusSchema,
  ageHours: z.number(),
  cost: z.number().optional(),
  lane: z.string(),
  serviceLevel: z.string().optional(),
  commodity: z.string().optional(),
  laneMiles: z.number().optional(),
  latestStartTime: z.string().optional(),
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
  orderNumber: z.string().optional(),
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
    recommendedDriverId: z.string().optional(),
    recommendedUnitId: z.string().optional(),
    driverOptions: z.array(bookingDriverSchema),
    unitOptions: z.array(bookingUnitSchema),
    statusOptions: z.array(orderStatusSchema),
    guardrails: z.array(z.string()).optional(),
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
  orderId: z.string().optional(),
  driverId: z.string().optional(),
  unitId: z.string().optional(),
  // Extended fields for Trip Ticket
  customer: z.string().optional(),
  pickupWindow: z.string().optional(),
  distance: z.number().optional(),
  duration: z.number().optional(),
  commodity: z.string().optional(),
  driverType: z.string().optional(),
  totalCost: z.number().optional(),
  totalCpm: z.number().optional(),
  serviceLevel: z.string().optional(),
  completedAt: z.string().optional(),
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
  orderReference: z.string().optional(),
  status: z.string(),
  driver: z.string(),
  unit: z.string(),
  unitNumber: z.string().optional(),
  driverType: z.string().optional(),
  truckWk: z.coerce.number().optional(),
  unitType: z.string().optional(),
  eta: z.string(),
  timeline: z.array(timelineEventSchema),
  exceptions: z.array(tripExceptionSchema),
  telemetry: z.object({
    lastPing: z.string(),
    breadcrumb: z.array(telemetryPointSchema),
  }),
  notes: z.array(z.object({ id: z.string(), author: z.string(), timestamp: z.string(), body: z.string() })),
  attachments: z.array(z.object({ id: z.string(), name: z.string(), size: z.string() })),
  pickup: z.string().optional(),
  delivery: z.string().optional(),
  pickupWindowStart: z.string().optional(),
  pickupWindowEnd: z.string().optional(),
  deliveryWindowStart: z.string().optional(),
  deliveryWindowEnd: z.string().optional(),
  plannedStart: z.string().optional(),
  actualStart: z.string().optional(),
  pickupDeparture: z.string().optional(),
  completedAt: z.string().optional(),
  onTimePickup: z.boolean().optional(),
  onTimeDelivery: z.boolean().optional(),
  metrics: z
    .object({
      distanceMiles: z.coerce.number().optional(),
      estDurationHours: z.coerce.number().optional(),
      linehaul: z.coerce.number().optional(),
      fuel: z.coerce.number().optional(),
      totalCost: z.coerce.number().optional(),
      recommendedRevenue: z.coerce.number().optional(),
      marginPct: z.coerce.number().optional(),
    })
    .optional(),
  currentWeight: z.number().optional(),
  currentCube: z.number().optional(),
  currentLinearFeet: z.number().optional(),
  utilizationPercent: z.number().optional(),
  limitingFactor: z.string().optional(),
  maxWeight: z.number().optional(),
  maxCube: z.number().optional(),
  maxLinearFeet: z.number().optional(),
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
  hoursAvailable: z.number().optional(),
  type: z.string().optional(),
  location: z.string().optional(),
  owner: z.string().optional(),
  severity: z.string().optional(),
  value: z.union([z.string(), z.number()]).optional(),
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

export const driverAdminSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  region: z.string(),
  hoursAvailable: z.number(),
  updated: z.string(),
});
export type DriverAdminRecord = z.infer<typeof driverAdminSchema>;
export type DriverAdminCreate = Omit<DriverAdminRecord, "id" | "updated"> & { id?: string };
export type DriverAdminUpdate = Omit<DriverAdminRecord, "updated">;

export const unitAdminSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.string(),
  location: z.string(),
  region: z.string(),
  updated: z.string(),
});
export type UnitAdminRecord = z.infer<typeof unitAdminSchema>;
export type UnitAdminCreate = Omit<UnitAdminRecord, "id" | "updated"> & { id?: string };
export type UnitAdminUpdate = Omit<UnitAdminRecord, "updated">;

export const ruleAdminSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  region: z.string(),
  owner: z.string(),
  updated: z.string(),
});
export type RuleAdminRecord = z.infer<typeof ruleAdminSchema>;
export type RuleAdminCreate = Omit<RuleAdminRecord, "id" | "updated"> & { id?: string };
export type RuleAdminUpdate = Omit<RuleAdminRecord, "updated">;

export const eventAdminSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  region: z.string(),
  severity: z.string(),
  updated: z.string(),
});
export type EventAdminRecord = z.infer<typeof eventAdminSchema>;
export type EventAdminCreate = Omit<EventAdminRecord, "id" | "updated"> & { id?: string };
export type EventAdminUpdate = Omit<EventAdminRecord, "updated">;

export const laneAdminSchema = z.object({
  id: z.string(),
  origin: z.string(),
  destination: z.string(),
  miles: z.number(),
  transitDays: z.number(),
});
export type LaneAdminRecord = z.infer<typeof laneAdminSchema>;
export type LaneAdminCreate = Omit<LaneAdminRecord, "id"> & { id?: string };
export type LaneAdminUpdate = LaneAdminRecord;

export const customsStatusSchema = z.enum([
  "PENDING_DOCS",
  "DOCS_SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CLEARED",
]);
export type CustomsStatus = z.infer<typeof customsStatusSchema>;

export const customsPrioritySchema = z.enum(["URGENT", "HIGH", "NORMAL", "LOW"]);
export type CustomsPriority = z.infer<typeof customsPrioritySchema>;

export const customsDocumentTypeSchema = z.enum([
  "COMMERCIAL_INVOICE",
  "BILL_OF_LADING",
  "PAPS",
  "ACE_MANIFEST",
  "PACKING_LIST",
  "CERTIFICATE_OF_ORIGIN",
  "CUSTOMS_DECLARATION",
  "CARRIER_BOND",
  "OTHER",
]);
export type CustomsDocumentType = z.infer<typeof customsDocumentTypeSchema>;

export const customsClearanceListItemSchema = z.object({
  id: z.string(),
  tripNumber: z.string(),
  driverName: z.string(),
  unitNumber: z.string(),
  status: customsStatusSchema,
  priority: customsPrioritySchema,
  borderCrossingPoint: z.string(),
  crossingDirection: z.string(),
  estimatedCrossingTime: z.string(),
  assignedAgent: z.string().optional(),
  flaggedAt: z.string(),
  docsSubmittedAt: z.string().optional(),
  requiredDocsCount: z.number(),
  submittedDocsCount: z.number(),
});
export type CustomsClearanceListItem = z.infer<typeof customsClearanceListItemSchema>;

export const customsDocumentSchema = z.object({
  id: z.string(),
  documentType: customsDocumentTypeSchema,
  documentName: z.string(),
  fileUrl: z.string().optional(),
  fileSizeKb: z.number().optional(),
  fileType: z.string().optional(),
  status: z.enum(["UPLOADED", "VERIFIED", "REJECTED", "EXPIRED"]),
  verificationNotes: z.string().optional(),
  uploadedBy: z.string(),
  uploadedAt: z.string(),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().optional(),
});
export type CustomsDocument = z.infer<typeof customsDocumentSchema>;

export const customsActivitySchema = z.object({
  id: z.string(),
  action: z.string(),
  actor: z.string(),
  actorType: z.enum(["DRIVER", "AGENT", "SYSTEM"]),
  details: z.record(z.any()).optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
});
export type CustomsActivity = z.infer<typeof customsActivitySchema>;

export const customsClearanceDetailSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  orderId: z.string(),
  tripNumber: z.string(),
  driverName: z.string(),
  unitNumber: z.string(),
  status: customsStatusSchema,
  priority: customsPrioritySchema,
  borderCrossingPoint: z.string(),
  crossingDirection: z.string(),
  estimatedCrossingTime: z.string(),
  actualCrossingTime: z.string().optional(),
  requiredDocuments: z.array(customsDocumentTypeSchema),
  submittedDocuments: z.array(customsDocumentSchema),
  assignedAgent: z.string().optional(),
  agentName: z.string().optional(),
  reviewStartedAt: z.string().optional(),
  reviewCompletedAt: z.string().optional(),
  reviewNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  activityLog: z.array(customsActivitySchema),
  flaggedAt: z.string(),
  docsSubmittedAt: z.string().optional(),
  approvedAt: z.string().optional(),
  clearedAt: z.string().optional(),
});
export type CustomsClearanceDetail = z.infer<typeof customsClearanceDetailSchema>;

export const customsResponseSchema = z.object({
  stats: z.object({
    pendingDocs: z.number(),
    underReview: z.number(),
    approved: z.number(),
    urgent: z.number(),
  }),
  filters: z.object({
    statuses: z.array(customsStatusSchema),
    priorities: z.array(z.string()),
    crossingPoints: z.array(z.string()),
    agents: z.array(z.string()),
  }),
  data: z.array(customsClearanceListItemSchema),
});
export type CustomsResponse = z.infer<typeof customsResponseSchema>;

export const customsAgentSchema = z.object({
  id: z.string(),
  agentName: z.string(),
  company: z.enum(["BUCKLAND", "LIVINGSTON"]),
  email: z.string().optional(),
  specialization: z.string().optional(),
  currentWorkload: z.number(),
  maxConcurrentReviews: z.number(),
});
export type CustomsAgent = z.infer<typeof customsAgentSchema>;

export const orderAdminSchema = z.object({
  id: z.string(),
  reference: z.string(),
  customer: z.string(),
  pickup: z.string(),
  delivery: z.string(),
  window: z.string(),
  status: z.string(),
  ageHours: z.number(),
  cost: z.number().optional(),
  lane: z.string(),
  serviceLevel: z.string(),
  commodity: z.string(),
  laneMiles: z.number(),
  totalWeight: z.number().optional(),
  totalPallets: z.number().optional(),
  palletDimensions: z.any().optional(),
  stackable: z.boolean().optional(),
  cubicFeet: z.number().optional(),
  linearFeetRequired: z.number().optional(),
});
export type OrderAdminRecord = z.infer<typeof orderAdminSchema>;
export type OrderAdminCreate = Omit<OrderAdminRecord, "id"> & { id?: string };
export type OrderAdminUpdate = OrderAdminRecord;

export const tripAdminSchema = z.object({
  id: z.string(),
  tripNumber: z.string(),
  orderId: z.string(),
  driverId: z.string(),
  unitId: z.string(),
  driver: z.string(),
  unit: z.string(),
  pickup: z.string(),
  delivery: z.string(),
  eta: z.string(),
  status: z.string(),
  exceptions: z.number(),
  lastPing: z.string(),
});
export type TripAdminRecord = z.infer<typeof tripAdminSchema>;
export type TripAdminCreate = Omit<TripAdminRecord, "id" | "tripNumber"> & { id?: string; tripNumber?: string };
export type TripAdminUpdate = TripAdminRecord;

export const customerAdminSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  primaryContact: z.string(),
  primaryLane: z.string(),
});
export type CustomerAdminRecord = z.infer<typeof customerAdminSchema>;
export type CustomerAdminCreate = Omit<CustomerAdminRecord, "id"> & { id?: string };
export type CustomerAdminUpdate = CustomerAdminRecord;

const searchMetaSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const globalSearchTypeSchema = z.enum(["order", "trip", "driver", "unit", "customer"]);

export const globalSearchResultSchema = z.object({
  id: z.string(),
  type: globalSearchTypeSchema,
  title: z.string(),
  description: z.string(),
  href: z.string(),
  meta: z.array(searchMetaSchema),
});

export const globalSearchResponseSchema = z.object({
  query: z.string(),
  results: z.array(globalSearchResultSchema),
});

export type GlobalSearchResult = z.infer<typeof globalSearchResultSchema>;
export type GlobalSearchResponse = z.infer<typeof globalSearchResponseSchema>;

const analyticsSummarySchema = z.object({
  periodLabel: z.string(),
  totalRevenue: z.number(),
  totalCost: z.number(),
  marginPercent: z.number(),
  avgRatePerMile: z.number(),
  avgCostPerMile: z.number(),
  totalMiles: z.number(),
  profitableTrips: z.number(),
  atRiskTrips: z.number(),
});

const analyticsTrendPointSchema = z.object({
  label: z.string(),
  revenue: z.number(),
  cost: z.number(),
  marginPercent: z.number(),
  miles: z.number(),
});

const analyticsCategorySchema = z.object({
  category: z.string(),
  revenue: z.number(),
  marginPercent: z.number(),
});

const analyticsDriverSchema = z.object({
  driverId: z.string(),
  driverName: z.string(),
  trips: z.number(),
  marginPercent: z.number(),
  revenue: z.number(),
});

const analyticsLaneSchema = z.object({
  lane: z.string(),
  revenue: z.number(),
  marginPercent: z.number(),
  miles: z.number(),
});

const analyticsDistributionSchema = z.object({
  band: z.string(),
  trips: z.number(),
});

const analyticsAlertSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(["info", "warn", "alert"]),
});

export const analyticsResponseSchema = z.object({
  summary: analyticsSummarySchema,
  revenueTrend: z.array(analyticsTrendPointSchema),
  marginByCategory: z.array(analyticsCategorySchema),
  driverPerformance: z.array(analyticsDriverSchema),
  lanePerformance: z.array(analyticsLaneSchema),
  marginDistribution: z.array(analyticsDistributionSchema),
  alerts: z.array(analyticsAlertSchema),
  updatedAt: z.string(),
});

export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;

export interface BookingInsights {
  recommendedDriverType: "RNR" | "COM" | "OO_Z1" | "OO_Z2" | "OO_Z3";
  reasoning: string;
  costOptimization: {
    potentialSavings: string;
    suggestion: string;
  };
  operationalInsights: string[];
  riskFactors: string[];
  specificDriverRecommendation?: {
    driverId: string;
    driverName: string;
    reason: string;
  };
  specificUnitRecommendation?: {
    unitId: string;
    unitCode: string;
    reason: string;
  };
  marginAnalysis: {
    targetMargin: string;
    recommendedRevenue: string;
    reasoning: string;
  };
}

export const fleetLocationSchema = z.object({
  id: z.string(),
  driverId: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
  status: z.string(),
  location: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  deliveryLocation: z.string().nullable().optional(),
  deliveryLat: z.number().nullable().optional(),
  deliveryLng: z.number().nullable().optional(),
  lastUpdate: z.string().nullable().optional(),
  driverName: z.string().nullable().optional(),
  unitNumber: z.string().nullable().optional(),
  speed: z.number().optional(),
  region: z.string().optional(),
  currentWeight: z.number().optional(),
  maxWeight: z.number().optional(),
  utilizationPercent: z.number().optional(),
  limitingFactor: z.string().nullable().optional(),
  customs: z.object({
    status: z.string().nullable().optional(),
    crossingPoint: z.string().nullable().optional(),
    requiredDocs: z.array(z.string()).optional(),
    submittedDocs: z.array(z.string()).optional(),
    isApproved: z.boolean().optional(),
  }).nullable().optional(),
});

export type FleetLocation = z.infer<typeof fleetLocationSchema>;

export const fleetResponseSchema = z.object({
  fleet: z.array(fleetLocationSchema),
});

export type FleetResponse = z.infer<typeof fleetResponseSchema>;

