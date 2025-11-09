export type TripStatus = "on-time" | "at-risk" | "delayed";

export interface TripEvent {
  time: string;
  label: string;
  detail?: string;
  type?: "alert" | "info" | "success";
}

export interface TripTrailPoint {
  x: number;
  y: number;
}

export interface TripRouteSummary {
  origin: string;
  destination: string;
  milesRemaining: number;
  percentageComplete: number;
}

export interface TripContact {
  driverPhone: string;
  dispatchChannel: string;
}

export interface ActiveTrip {
  id: string;
  orderId: string;
  driverName: string;
  driverType: "Company" | "Owner Operator" | "Rental";
  vehicleId: string;
  status: TripStatus;
  locationSummary: string;
  speedMph: number;
  eta: string;
  etaConfidence: number;
  stopsRemaining: number;
  nextStop: string;
  exceptionAlerts: string[];
  timeline: TripEvent[];
  aiPrediction: string;
  route: TripRouteSummary;
  position: TripTrailPoint;
  trail: TripTrailPoint[];
  contact: TripContact;
}

export interface NetworkPrediction {
  expectedCompletion: string;
  confidence: number;
  narrative: string;
  trendingRisk: string;
}

export interface AiFeature {
  id: string;
  emoji: string;
  label: string;
  description: string;
}
