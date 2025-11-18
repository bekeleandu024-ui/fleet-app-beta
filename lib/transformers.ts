import type {
  OrderListItem,
  OrderStatus,
  DriverAdminRecord,
  UnitAdminRecord,
  RuleAdminRecord,
  EventAdminRecord,
  MasterDataResponse,
  OrderAdminRecord,
  TripListItem,
  TripAdminRecord,
  CustomerAdminRecord,
} from "@/lib/types";

const STATUS_MAP: Record<string, OrderStatus> = {
  pending: "New",
  planning: "Planning",
  confirmed: "Planning",
  assigned: "Planning",
  in_progress: "In Transit",
  in_transit: "In Transit",
  en_route_to_pickup: "Planning",
  at_pickup: "Planning",
  departed_pickup: "In Transit",
  en_route_to_delivery: "In Transit",
  delivered: "Delivered",
  completed: "Delivered",
  closed: "Delivered",
  cancelled: "Exception",
  exception: "Exception",
  delayed: "At Risk",
  at_risk: "At Risk",
};

const REVERSE_STATUS_MAP: Record<OrderStatus, string> = {
  New: "pending",
  Planning: "confirmed",
  "In Transit": "in_progress",
  "At Risk": "delayed",
  Delivered: "completed",
  Exception: "exception",
};

const TRIP_STATUS_LABELS: Record<string, string> = {
  in_transit: "On Time",
  en_route_to_pickup: "Planning",
  at_pickup: "At Pickup",
  loading: "Loading",
  departed_pickup: "On Time",
  en_route_to_delivery: "On Time",
  delayed: "Running Late",
  customs_hold: "Exception",
  at_delivery: "At Delivery",
  unloading: "At Delivery",
  delivered: "Delivered",
  completed: "Delivered",
  planned: "Planning",
  assigned: "Planning",
  cancelled: "Cancelled",
};

const TRIP_STATUS_REVERSE: Record<string, string> = {
  "On Time": "in_transit",
  "Running Late": "delayed",
  Exception: "customs_hold",
  Delivered: "delivered",
  Planning: "planned",
};

const HOUR_IN_MS = 1000 * 60 * 60;

export function mapOrderStatus(status?: string | null): OrderStatus {
  const key = status?.toLowerCase();
  return (key && STATUS_MAP[key]) || "New";
}

export function mapOrderStatusToService(status: string | OrderStatus): string {
  const normalized = String(status);
  const match = (Object.keys(REVERSE_STATUS_MAP) as OrderStatus[]).find(
    (key) => key.toLowerCase() === normalized.toLowerCase()
  );
  return match ? REVERSE_STATUS_MAP[match] : REVERSE_STATUS_MAP["New"];
}

export function buildLane(pickup?: string | null, dropoff?: string | null): string {
  const origin = (pickup ?? "").trim();
  const destination = (dropoff ?? "").trim();
  if (!origin && !destination) {
    return "";
  }
  return destination ? `${origin} → ${destination}` : origin;
}

function resolveWindow(dateValue?: string | Date | null): string {
  if (!dateValue) {
    return "Scheduled";
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "Scheduled";
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateAgeHours(dateValue?: string | Date | null): number {
  if (!dateValue) {
    return 0;
  }
  const created = new Date(dateValue);
  if (Number.isNaN(created.getTime())) {
    return 0;
  }
  return Math.max(0, Math.floor((Date.now() - created.getTime()) / HOUR_IN_MS));
}

export function mapOrderListRecord(order: any): OrderListItem {
  return {
    id: order.id,
    reference: order.reference ?? order.id,
    customer: order.customer ?? order.customer_id ?? "", 
    pickup: order.pickup ?? order.pickup_location ?? "",
    delivery: order.delivery ?? order.dropoff_location ?? "",
    window: order.window ?? resolveWindow(order.pickup_time),
    status: mapOrderStatus(order.status),
    ageHours: order.ageHours ?? calculateAgeHours(order.created_at),
    cost: typeof order.estimated_cost === "number" ? order.estimated_cost : order.cost,
    lane: order.lane ?? buildLane(order.pickup_location, order.dropoff_location),
    serviceLevel: order.serviceLevel ?? order.service_level ?? "Standard",
    commodity: order.commodity ?? "General Freight",
    laneMiles: order.laneMiles ?? order.planned_miles ?? 0,
  };
}

export function mapDriverRecord(record: any): DriverAdminRecord {
  return {
    id: record.driver_id ?? record.id,
    name: record.driver_name ?? record.name,
    status: record.is_active === false ? "Off Duty" : record.status ?? "Ready",
    region: record.region ?? record.oo_zone ?? "Network",
    hoursAvailable: record.hours_available ?? record.hoursAvailable ?? 8,
    updated: new Date(record.updated_at ?? Date.now()).toISOString(),
  };
}

export function mapUnitRecord(record: any): UnitAdminRecord {
  return {
    id: record.unit_id ?? record.id,
    type: record.unit_type ?? record.type ?? record.unit_number ?? "Unknown",
    status: record.is_active === false ? "Maintenance" : record.status ?? "Available",
    location: record.location ?? record.current_location ?? "Fleet Yard",
    region: record.region ?? "Network",
    updated: new Date(record.updated_at ?? Date.now()).toISOString(),
  };
}

export function mapRuleRecord(record: any): RuleAdminRecord {
  const id = record.rule_id ?? record.id ?? `${record.rule_key}-${record.rule_type}`;
  return {
    id,
    name: record.rule_key ?? record.name ?? "Rule",
    status: record.is_active === false ? "Draft" : record.status ?? "Active",
    region: record.region ?? record.rule_type ?? "Network",
    owner: record.owner ?? "Costing",
    updated: new Date(record.updated_at ?? record.effective_date ?? Date.now()).toISOString(),
  };
}

export function mapEventRecord(record: any): EventAdminRecord {
  return {
    id: record.event_id ?? record.id ?? record.event_code,
    name: record.event_name ?? record.name ?? record.event_code ?? "Event",
    status: record.status ?? (record.is_automatic ? "Automated" : "Manual"),
    region: record.region ?? record.event_code ?? "Network",
    severity: record.severity ?? (record.cost_per_event ? `$${record.cost_per_event}` : "N/A"),
    updated: new Date(record.updated_at ?? Date.now()).toISOString(),
  };
}

export function mapOrderAdminRecord(order: any): OrderAdminRecord {
  const base = mapOrderListRecord(order);
  return {
    ...base,
    serviceLevel: base.serviceLevel ?? "Standard",
    commodity: base.commodity ?? "General Freight",
    laneMiles: base.laneMiles ?? 0,
  };
}

export function mapTripListItem(trip: any, driverName?: string, unitNumber?: string): TripListItem {
  const statusKey = trip.status?.toLowerCase();
  const status = statusKey && TRIP_STATUS_LABELS[statusKey] ? TRIP_STATUS_LABELS[statusKey] : "On Time";
  const lastPing = trip.last_ping ?? trip.updated_at ?? new Date().toISOString();
  return {
    id: trip.id,
    tripNumber: trip.tripNumber ?? trip.id.slice(0, 8).toUpperCase(),
    driver: driverName ?? trip.driver ?? trip.driver_id ?? "Unassigned",
    unit: unitNumber ?? trip.unit ?? trip.unit_id ?? "Pending",
    pickup: trip.pickup ?? trip.pickup_location ?? "",
    delivery: trip.delivery ?? trip.dropoff_location ?? "",
    eta: trip.delivery_window_end?.toISOString?.() ?? trip.delivery_window_end ?? new Date().toISOString(),
    status,
    exceptions: Array.isArray(trip.active_exceptions) ? trip.active_exceptions.length : trip.exceptions ?? 0,
    lastPing: typeof lastPing === "string" ? lastPing : new Date(lastPing).toISOString(),
    orderId: trip.order_id ?? trip.orderId,
    driverId: trip.driver_id ?? trip.driverId,
    unitId: trip.unit_id ?? trip.unitId,
  };
}

export function mapTripAdminRecord(trip: any, driverName?: string, unitNumber?: string): TripAdminRecord {
  const listItem = mapTripListItem(trip, driverName, unitNumber);
  return {
    ...listItem,
    orderId: trip.order_id ?? trip.orderId ?? "",
    driverId: trip.driver_id ?? trip.driverId ?? "",
    unitId: trip.unit_id ?? trip.unitId ?? "",
  };
}

export function mapTripStatusToService(status: string): string {
  return TRIP_STATUS_REVERSE[status] ?? TRIP_STATUS_REVERSE["On Time"];
}

export function mapCustomerRecord(order: any): CustomerAdminRecord {
  return {
    id: order.customer_id ?? order.customer ?? order.id,
    name: order.customer ?? order.customer_id ?? "Customer",
    status: order.customer_status ?? "Active",
    primaryContact: order.primary_contact ?? "Dispatch",
    primaryLane: buildLane(order.pickup_location, order.dropoff_location) || "Lane",
  };
}

export function toMasterDataResponse(records: EventAdminRecord[] | RuleAdminRecord[] | DriverAdminRecord[] | UnitAdminRecord[]): MasterDataResponse {
  const regions = Array.from(new Set(records.map((record) => (record as any).region ?? "Network"))).sort();
  const statuses = Array.from(new Set(records.map((record) => (record as any).status ?? "Active"))).sort();
  const data = records.map((record) => ({
    id: (record as any).id,
    name: (record as any).name,
    status: (record as any).status,
    region: (record as any).region ?? "Network",
    updated: (record as any).updated ?? new Date().toISOString(),
    owner: (record as any).owner,
    severity: (record as any).severity,
    location: (record as any).location,
    type: (record as any).type,
    hoursAvailable: (record as any).hoursAvailable,
  }));
  return {
    filters: {
      regions: ["All", ...regions],
      statuses,
    },
    data,
  };
}
