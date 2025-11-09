export type OrderStatus = "pending" | "assigned" | "in_progress" | "completed" | "canceled";
export type OrderType = "pickup" | "delivery" | "round_trip";
export type ProfitabilityFilter = "all" | "profitable" | "breakeven" | "losing";

export type Location = {
  city: string;
  state: string;
};

export type TimeWindow = {
  start: string; // ISO date string
  end: string;
};

export type Driver = {
  id: string;
  name: string;
  initials: string;
  hosRemaining?: number; // hours
};

export type OrderRow = {
  id: string;
  customer: string;
  type: OrderType;
  origin: Location;
  destination: Location;
  pickupWindow: TimeWindow;
  deliveryWindow: TimeWindow;
  status: OrderStatus;
  driver?: Driver;
  estCostUsd: number;
  revenueUsd: number;
  marginPct: number; // 0..1
  aiRisk: number; // 0..100
  aiRiskReason?: string;
  miles: number;
};

export type CostBreakdown = {
  fixed: number;
  wage: number;
  rolling: number;
  accessorials: number;
  total: number;
};

export type OrderDetail = OrderRow & {
  specialInstructions?: string;
  timeline: {
    created: string;
    assigned?: string;
    pickup?: string;
    delivery?: string;
    completed?: string;
  };
  costBreakdown: CostBreakdown;
  marketRate?: number; // per mile
  unit?: {
    id: string;
    make: string;
    model: string;
  };
  alternateDrivers?: Array<{
    driver: Driver;
    costDelta: number;
    etaDelta: number; // hours
  }>;
  events?: Array<{
    timestamp: string;
    event: string;
    location?: string;
  }>;
  documents?: Array<{
    id: string;
    type: "BOL" | "Rate Confirmation" | "POD" | "Invoice";
    url: string;
    uploadedAt: string;
  }>;
};
