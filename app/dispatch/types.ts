export type DispatchStatus = 
  | "unassigned"
  | "assigned"
  | "en_route_pickup"
  | "at_pickup"
  | "in_transit"
  | "at_delivery"
  | "completed";

export type DriverType = "company" | "rental" | "owner_operator";
export type DriverStatus = "available" | "on_trip" | "off_duty" | "hos_break";

export interface DispatchOrder {
  id: string;
  customer: string;
  origin: { city: string; state: string };
  destination: { city: string; state: string };
  pickupTime: string;
  deliveryTime: string;
  status: DispatchStatus;
  driver?: {
    id: string;
    name: string;
    initials: string;
  };
  priority: "low" | "medium" | "high";
  aiMatchScore?: number; // 0-100
  miles: number;
  estCost: number;
  revenue: number;
  margin: number;
  // Status-specific fields
  eta?: string;
  distanceRemaining?: number;
  dwellTime?: number; // minutes
  progressPct?: number; // 0-100
  hosRemaining?: number; // hours
}

export interface Driver {
  id: string;
  name: string;
  initials: string;
  type: DriverType;
  status: DriverStatus;
  currentLocation?: string;
  hosRemaining: number;
  assignedUnit?: string;
  currentOrderId?: string;
  nextAvailable?: string;
  aiEfficiencyScore: number; // 0-100
}

export interface AIRecommendation {
  id: string;
  type: "assignment" | "reassignment" | "conflict" | "balance";
  orderId: string;
  driverId: string;
  reason: string;
  costSavings?: number;
  etaImprovement?: number;
  confidence: number; // 0-100
}

export interface DispatchFilters {
  date: string;
  driverTypes: DriverType[];
  region: string;
}
