export type TripType = "COM" | "GLOBAL" | "EXPEDITE" | "TEAM";
export type UnitClass = "RNR" | "COMPANY" | "OWNER_OP";

export interface BookingOrder {
  id: string;
  customer: string;
  customerLocation: string;
  pickupWindow: {
    start: string; // ISO datetime
    end: string;
  };
  deliveryWindow: {
    start: string;
    end: string;
  };
  dispatcherNotes: string;
  tripContext: string;
  status: "flatbed" | "qualified" | "active_load" | "booked";
  // Booking details
  origin: { city: string; state: string };
  destination: { city: string; state: string };
  miles: number;
  commodity?: string;
  weight?: number;
}

export interface DriverOption {
  id: string;
  name: string;
  homeBase: string;
  homeTerminal: string;
  type: "COMPANY" | "RENTAL" | "OWNER_OP";
  currentLocation?: string;
  hosRemaining: number;
  efficiency?: number; // 0-100
}

export interface UnitOption {
  id: string;
  unitNumber: string;
  class: UnitClass;
  homeTerminal: string;
  availability: "Available" | "In Use" | "Maintenance";
}

export interface RateOption {
  type: TripType;
  zone: string;
  ratePerMile: number;
  marketIndex: string; // e.g., "Market Index 2.05 RPM"
}

export interface BookingRecommendation {
  driver: DriverOption;
  unit: UnitOption;
  rate: RateOption;
  miles: number;
  etaHours: number;
  quotedRateVsMarket: {
    rate: number;
    market: string;
  };
  revenueTargets: {
    revenue: number;
    rpm: number;
    margin: number; // 5%
  };
  routingNotes: string;
}

export interface CrewMember {
  id: string;
  name: string;
  role: "DRIVER" | "KITCHENER" | "WINDSOR";
  homeBase: string;
}

export interface QualifiedOrder {
  id: string;
  customer: string;
  customerLocation: string;
  status: "in_focus" | "qualified";
  flatbedWindow: string;
  crew: CrewMember[];
  units: string[];
}
