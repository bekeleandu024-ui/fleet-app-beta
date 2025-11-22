import { addHours } from "date-fns";

type ServiceName = "orders" | "masterData" | "dispatch" | "tracking";

const demoOrders = [
  {
    id: "ord-1001",
    pickup_location: "Dallas, TX",
    dropoff_location: "Atlanta, GA",
    status: "in_transit",
    created_at: "2024-05-05T10:00:00Z",
    pickup_window_start: "2024-05-05T12:00:00Z",
    delivery_window_start: "2024-05-06T14:00:00Z",
    pickup_time: "2024-05-05T12:00:00Z",
    delivery_time: "2024-05-06T18:00:00Z",
    customer_name: "Lone Star Retail",
    estimated_cost: 3200,
    revenue: 4200,
    lane_miles: 820,
    commodity: "Consumer Packaged Goods",
    service_level: "Standard",
    driver_id: "drv-101",
    unit_id: "tr-2045",
    special_instructions: "Call receiver on arrival",
    stops: [
      {
        id: "ord-1001-pu",
        type: "pickup",
        location: "Dallas, TX",
        window_start: "2024-05-05T12:00:00Z",
        window_end: "2024-05-05T16:00:00Z",
      },
      {
        id: "ord-1001-del",
        type: "delivery",
        location: "Atlanta, GA",
        window_start: "2024-05-06T14:00:00Z",
        window_end: "2024-05-06T18:00:00Z",
      },
    ],
  },
  {
    id: "ord-1002",
    pickup_location: "Chicago, IL",
    dropoff_location: "Toronto, ON",
    status: "planning",
    created_at: "2024-05-04T09:00:00Z",
    pickup_window_start: "2024-05-06T08:00:00Z",
    delivery_window_start: "2024-05-07T15:00:00Z",
    pickup_time: "2024-05-06T08:30:00Z",
    delivery_time: "2024-05-07T17:45:00Z",
    customer_name: "Northern Foods",
    estimated_cost: 4100,
    revenue: 5200,
    lane_miles: 720,
    commodity: "Refrigerated",
    service_level: "Premium",
    driver_id: "drv-204",
    unit_id: "tr-3130",
    pickup_instructions: "Temp set to 34F",
  },
  {
    id: "ord-1003",
    pickup_location: "Phoenix, AZ",
    dropoff_location: "Denver, CO",
    status: "delivered",
    created_at: "2024-05-02T15:00:00Z",
    pickup_window_start: "2024-05-03T10:00:00Z",
    delivery_window_start: "2024-05-04T08:00:00Z",
    pickup_time: "2024-05-03T10:15:00Z",
    delivery_time: "2024-05-04T09:10:00Z",
    customer_name: "Mountain Supply Co.",
    estimated_cost: 2600,
    revenue: 3400,
    lane_miles: 585,
    commodity: "Building Materials",
    service_level: "Standard",
    driver_id: "drv-311",
    unit_id: "tr-4120",
  },
  {
    id: "ord-1004",
    pickup_location: "Seattle, WA",
    dropoff_location: "Reno, NV",
    status: "delayed",
    created_at: "2024-05-03T18:00:00Z",
    pickup_window_start: "2024-05-04T09:00:00Z",
    delivery_window_start: "2024-05-05T19:00:00Z",
    pickup_time: "2024-05-04T09:10:00Z",
    delivery_time: "2024-05-05T21:30:00Z",
    customer_name: "Cascade Outfitters",
    estimated_cost: 3000,
    revenue: 3950,
    lane_miles: 700,
    commodity: "Outdoor Gear",
    service_level: "Expedited",
    driver_id: "drv-455",
    unit_id: "tr-5980",
  },
  {
    id: "ord-1005",
    pickup_location: "Miami, FL",
    dropoff_location: "Charleston, SC",
    status: "pending",
    created_at: "2024-05-06T07:00:00Z",
    pickup_window_start: "2024-05-06T11:00:00Z",
    delivery_window_start: "2024-05-07T08:30:00Z",
    pickup_time: "2024-05-06T11:15:00Z",
    delivery_time: "2024-05-07T09:30:00Z",
    customer_name: "Portside Imports",
    estimated_cost: 1800,
    revenue: 2400,
    lane_miles: 520,
    commodity: "Consumer Electronics",
    service_level: "Standard",
    driver_id: "drv-128",
    unit_id: "tr-7101",
    stops: [
      {
        id: "ord-1005-pu",
        type: "pickup",
        location: "Miami, FL",
        window_start: "2024-05-06T11:00:00Z",
        window_end: "2024-05-06T12:00:00Z",
      },
      {
        id: "ord-1005-del",
        type: "delivery",
        location: "Charleston, SC",
        window_start: "2024-05-07T08:30:00Z",
        window_end: "2024-05-07T12:00:00Z",
      },
    ],
  },
];

const demoOrderCost: Record<string, Record<string, any>> = {
  "ord-1001": { total_cost: 3200, revenue: 4200, linehaul_cost: 2400, fuel_cost: 550, accessorial_cost: 250, margin_analysis: { target_margin: 0.18 } },
  "ord-1002": { total_cost: 4100, revenue: 5200, linehaul_cost: 3000, fuel_cost: 800, accessorial_cost: 300, margin_analysis: { target_margin: 0.2 } },
  "ord-1003": { total_cost: 2600, revenue: 3400, linehaul_cost: 2000, fuel_cost: 400, accessorial_cost: 200, margin_analysis: { target_margin: 0.17 } },
  "ord-1004": { total_cost: 3000, revenue: 3950, linehaul_cost: 2200, fuel_cost: 550, accessorial_cost: 250, margin_analysis: { target_margin: 0.16 } },
  "ord-1005": { total_cost: 1800, revenue: 2400, linehaul_cost: 1350, fuel_cost: 300, accessorial_cost: 150, margin_analysis: { target_margin: 0.18 } },
};

const demoCustomerView: Record<string, Record<string, any>> = demoOrders.reduce(
  (acc, order) => {
    const pickupTime = order.pickup_time ? new Date(order.pickup_time) : new Date(order.created_at ?? Date.now());
    const deliveryTime = order.delivery_time ? new Date(order.delivery_time) : addHours(pickupTime, 24);

    acc[order.id] = {
      notes: order.special_instructions ?? order.pickup_instructions,
      distance_miles: order.lane_miles,
      stops:
        order.stops?.map((stop: any) => ({
          id: stop.id,
          type: stop.type,
          location: stop.location,
          window_start: stop.window_start,
          window_end: stop.window_end,
        })) ?? [
          {
            id: `${order.id}-view-pu`,
            type: "pickup",
            location: order.pickup_location,
            window_start: pickupTime.toISOString(),
            window_end: addHours(pickupTime, 4).toISOString(),
          },
          {
            id: `${order.id}-view-del`,
            type: "delivery",
            location: order.dropoff_location,
            window_start: deliveryTime.toISOString(),
            window_end: addHours(deliveryTime, 4).toISOString(),
          },
        ],
    };
    return acc;
  },
  {} as Record<string, Record<string, any>>
);

const demoDrivers = [
  { id: "drv-101", driver_name: "S. Redding", status: "Ready", hours_available: 8, region: "TX" },
  { id: "drv-204", driver_name: "J. McCall", status: "Booked", hours_available: 4, region: "IL" },
  { id: "drv-311", driver_name: "N. Torres", status: "Ready", hours_available: 10, region: "AZ" },
  { id: "drv-455", driver_name: "A. Kim", status: "Ready", hours_available: 6, region: "WA" },
  { id: "drv-128", driver_name: "P. Hooper", status: "Ready", hours_available: 12, region: "FL" },
];

const demoUnits = [
  { id: "tr-2045", unit_number: "TR-2045", unit_type: "53' Dry Van", status: "Available", current_location: "Dallas, TX" },
  { id: "tr-3130", unit_number: "TR-3130", unit_type: "53' Reefer", status: "Available", current_location: "Chicago, IL" },
  { id: "tr-4120", unit_number: "TR-4120", unit_type: "48' Flat", status: "Maintenance", current_location: "Phoenix, AZ" },
  { id: "tr-5980", unit_number: "TR-5980", unit_type: "53' Dry Van", status: "Available", current_location: "Seattle, WA" },
  { id: "tr-7101", unit_number: "TR-7101", unit_type: "53' Dry Van", status: "Available", current_location: "Miami, FL" },
];

const demoRules = [
  { id: "rule-1", name: "Food Safety", description: "FSMA compliance required", status: "Active" },
  { id: "rule-2", name: "High Value Escort", description: "Two driver teams for high value loads", status: "Active" },
];

const demoBusinessRules = [
  {
    id: "br-1",
    rule_key: "min_margin_threshold",
    scope: "trip",
    rule_value: "8.00",
    unit: "%",
    severity: "critical",
    description: "Minimum acceptable margin percentage",
    is_active: true,
  },
  {
    id: "br-2",
    rule_key: "target_margin",
    scope: "booking",
    rule_value: "15.00",
    unit: "%",
    severity: "warning",
    description: "Target margin for profitability",
    is_active: true,
  },
  {
    id: "br-3",
    rule_key: "max_cost_per_mile",
    scope: "trip",
    rule_value: "2.50",
    unit: "$",
    severity: "warning",
    description: "Maximum cost per mile threshold",
    is_active: true,
  },
  {
    id: "br-4",
    rule_key: "max_detention_minutes",
    scope: "trip",
    rule_value: "120",
    unit: "minutes",
    severity: "warning",
    description: "Maximum detention before charges apply",
    is_active: true,
  },
  {
    id: "br-5",
    rule_key: "border_crossing_fee",
    scope: "booking",
    rule_value: "150.00",
    unit: "$",
    severity: "info",
    description: "Standard border crossing fee",
    is_active: true,
  },
];

const demoEvents = [
  { id: "event-1", name: "Border Crossing", description: "Customs paperwork review", category: "Compliance" },
  { id: "event-2", name: "Trailer Washout", description: "Washout before pickup", category: "Maintenance" },
];

const demoTrips = [
  {
    id: "TRP-9001",
    dispatch_id: "disp-1",
    order_id: "ord-1001",
    driver_id: "drv-101",
    unit_id: "tr-2045",
    status: "in_transit",
    pickup_location: "Dallas, TX",
    dropoff_location: "Atlanta, GA",
    pickup_lat: 32.7767,
    pickup_lng: -96.7970,
    dropoff_lat: 33.7490,
    dropoff_lng: -84.3880,
    distance_miles: 781,
    duration_hours: 11.5,
    planned_start: "2024-05-05T12:00:00Z",
    actual_start: "2024-05-05T12:05:00Z",
    updated_at: "2024-05-06T10:00:00Z",
    on_time_delivery: true,
    linehaul_cost: 1200,
    fuel_cost: 450,
    total_cost: 1650,
    recommended_revenue: 2100,
    margin_pct: 21.4,
    telemetry: [
      { id: "t1", timestamp: "2024-05-06T09:30:00Z", speed: 57, location: "Birmingham, AL" },
      { id: "t2", timestamp: "2024-05-06T10:00:00Z", speed: 55, location: "Anniston, AL" },
    ],
  },
  {
    id: "TRP-9002",
    dispatch_id: "disp-2",
    order_id: "ord-1002",
    driver_id: "drv-204",
    unit_id: "tr-3130",
    status: "delayed",
    pickup_location: "Chicago, IL",
    dropoff_location: "Toronto, ON",
    pickup_lat: 41.8781,
    pickup_lng: -87.6298,
    dropoff_lat: 43.6532,
    dropoff_lng: -79.3832,
    distance_miles: 520,
    duration_hours: 8.5,
    planned_start: "2024-05-06T08:30:00Z",
    actual_start: "2024-05-06T09:00:00Z",
    updated_at: "2024-05-06T12:30:00Z",
    on_time_delivery: false,
    linehaul_cost: 850,
    fuel_cost: 320,
    total_cost: 1170,
    recommended_revenue: 1500,
    margin_pct: 22.0,
  },
  {
    id: "TRP-9003",
    dispatch_id: "disp-3",
    order_id: "ord-1003",
    driver_id: "drv-311",
    unit_id: "tr-4120",
    status: "completed",
    pickup_location: "Phoenix, AZ",
    dropoff_location: "Denver, CO",
    pickup_lat: 33.4484,
    pickup_lng: -112.0740,
    dropoff_lat: 39.7392,
    dropoff_lng: -104.9903,
    distance_miles: 602,
    duration_hours: 9.0,
    planned_start: "2024-05-03T10:15:00Z",
    actual_start: "2024-05-03T10:10:00Z",
    completed_at: "2024-05-04T09:10:00Z",
    updated_at: "2024-05-04T09:10:00Z",
    on_time_delivery: true,
    linehaul_cost: 980,
    fuel_cost: 380,
    total_cost: 1360,
    recommended_revenue: 1750,
    margin_pct: 22.3,
  },
  // Keep legacy IDs for backward compatibility
  {
    id: "trip-5001",
    dispatch_id: "disp-1",
    order_id: "ord-1001",
    driver_id: "drv-101",
    unit_id: "tr-2045",
    status: "in_transit",
    pickup_location: "Dallas, TX",
    dropoff_location: "Atlanta, GA",
    planned_start: "2024-05-05T12:00:00Z",
    actual_start: "2024-05-05T12:05:00Z",
    updated_at: "2024-05-06T10:00:00Z",
    on_time_delivery: true,
    telemetry: [
      { id: "t1", timestamp: "2024-05-06T09:30:00Z", speed: 57, location: "Birmingham, AL" },
      { id: "t2", timestamp: "2024-05-06T10:00:00Z", speed: 55, location: "Anniston, AL" },
    ],
  },
  {
    id: "trip-5002",
    dispatch_id: "disp-2",
    order_id: "ord-1002",
    driver_id: "drv-204",
    unit_id: "tr-3130",
    status: "delayed",
    pickup_location: "Chicago, IL",
    dropoff_location: "Toronto, ON",
    planned_start: "2024-05-06T08:30:00Z",
    actual_start: "2024-05-06T09:00:00Z",
    updated_at: "2024-05-06T12:30:00Z",
    on_time_delivery: false,
  },
  {
    id: "trip-5003",
    dispatch_id: "disp-3",
    order_id: "ord-1003",
    driver_id: "drv-311",
    unit_id: "tr-4120",
    status: "completed",
    pickup_location: "Phoenix, AZ",
    dropoff_location: "Denver, CO",
    planned_start: "2024-05-03T10:15:00Z",
    actual_start: "2024-05-03T10:10:00Z",
    completed_at: "2024-05-04T09:10:00Z",
    updated_at: "2024-05-04T09:10:00Z",
    on_time_delivery: true,
  },
];

const demoTripEvents: Record<string, Array<Record<string, any>>> = {
  "TRP-9001": [
    { id: "ev-1", timestamp: "2024-05-05T12:10:00Z", summary: "Departed pickup", location: "Dallas, TX", status: "Recorded" },
    { id: "ev-2", timestamp: "2024-05-06T09:25:00Z", summary: "Fuel stop", location: "Birmingham, AL", status: "Recorded" },
  ],
  "TRP-9002": [
    { id: "ev-3", timestamp: "2024-05-06T09:05:00Z", summary: "Departed pickup", location: "Chicago, IL", status: "Recorded" },
  ],
  "trip-5001": [
    { id: "ev-1", timestamp: "2024-05-05T12:10:00Z", summary: "Departed pickup", location: "Dallas, TX", status: "Recorded" },
    { id: "ev-2", timestamp: "2024-05-06T09:25:00Z", summary: "Fuel stop", location: "Birmingham, AL", status: "Recorded" },
  ],
  "trip-5002": [
    { id: "ev-3", timestamp: "2024-05-06T09:05:00Z", summary: "Departed pickup", location: "Chicago, IL", status: "Recorded" },
  ],
};

const demoTripExceptions: Record<string, Array<Record<string, any>>> = {
  "TRP-9002": [
    {
      id: "ex-1",
      type: "Weather",
      severity: "warn",
      opened: "2024-05-06T11:00:00Z",
      owner: "Network Ops",
      notes: "Lake effect snow slowing border crossing",
    },
  ],
  "trip-5002": [
    {
      id: "ex-1",
      type: "Weather",
      severity: "warn",
      opened: "2024-05-06T11:00:00Z",
      owner: "Network Ops",
      notes: "Lake effect snow slowing border crossing",
    },
  ],
};

const demoDispatchOrders = demoOrders.map((order) => ({
  ...order,
  priority: order.status === "delayed" ? "Critical" : "Standard",
}));

export function resolveDemoResponse(service: ServiceName, path: string): unknown | undefined {
  const url = new URL(path, "http://demo.local");
  const { pathname, searchParams } = url;

  if (service === "orders") {
    if (pathname === "/api/orders") {
      return demoOrders;
    }
    if (pathname.startsWith("/api/orders/") && pathname.endsWith("/cost-breakdown")) {
      const id = pathname.split("/")[3];
      return demoOrderCost[id];
    }
    if (pathname.startsWith("/api/orders/")) {
      const id = pathname.split("/")[3];
      return demoOrders.find((order) => String(order.id) === id);
    }
    if (pathname.startsWith("/api/views/customer/")) {
      const id = pathname.split("/").pop() ?? "";
      return demoCustomerView[id];
    }
  }

  if (service === "tracking") {
    if (pathname === "/api/trips") {
      const orderId = searchParams.get("orderId");
      const filtered = orderId ? demoTrips.filter((trip) => trip.order_id === orderId) : demoTrips;
      return { value: filtered, Count: filtered.length };
    }
    if (pathname.startsWith("/api/views/customer/")) {
      const id = pathname.split("/").pop() ?? "";
      return demoCustomerView[id];
    }
    if (pathname.startsWith("/api/trips/") && pathname.endsWith("/events")) {
      const id = pathname.split("/")[3];
      return demoTripEvents[id] ?? [];
    }
    if (pathname.startsWith("/api/trips/") && pathname.endsWith("/exceptions")) {
      const id = pathname.split("/")[3];
      return demoTripExceptions[id] ?? [];
    }
    if (pathname.startsWith("/api/trips/")) {
      const id = pathname.split("/")[3];
      return demoTrips.find((trip) => trip.id === id);
    }
  }

  if (service === "masterData") {
    if (pathname.endsWith("/drivers")) {
      return { drivers: demoDrivers };
    }
    if (pathname.endsWith("/units")) {
      return { units: demoUnits };
    }
    if (pathname.endsWith("/rules")) {
      return { rules: demoRules };
    }
    if (pathname.endsWith("/events")) {
      return { events: demoEvents };
    }
    if (pathname === "/query") {
      // Handle SQL query for business rules
      return { rows: demoBusinessRules };
    }
  }

  if (service === "dispatch" && pathname === "/api/dispatch/qualified-orders") {
    return { orders: demoDispatchOrders };
  }

  return undefined;
}

export const demoServiceHealth = [
  { name: "Orders", status: "ok", message: "Demo data" },
  { name: "Master Data", status: "ok", message: "Demo data" },
  { name: "Dispatch", status: "ok", message: "Demo data" },
  { name: "Tracking", status: "ok", message: "Demo data" },
];
