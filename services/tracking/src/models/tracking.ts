// Trip lifecycle statuses
export enum TripStatus {
  // Pre-trip
  PLANNED = "planned",                    // Trip created, not started
  ASSIGNED = "assigned",                  // Driver/unit assigned
  
  // Pickup phase
  EN_ROUTE_TO_PICKUP = "en_route_to_pickup",    // Heading to shipper
  AT_PICKUP = "at_pickup",                      // Arrived at pickup location
  LOADING = "loading",                          // Loading freight
  DEPARTED_PICKUP = "departed_pickup",          // Left pickup location
  
  // In transit
  IN_TRANSIT = "in_transit",              // Between pickup and delivery
  CUSTOMS_HOLD = "customs_hold",          // Border documentation hold
  
  // Delivery phase
  EN_ROUTE_TO_DELIVERY = "en_route_to_delivery",  // Heading to consignee
  AT_DELIVERY = "at_delivery",                    // Arrived at delivery
  UNLOADING = "unloading",                        // Unloading freight
  DELIVERED = "delivered",                        // POD captured
  
  // Post-delivery
  COMPLETED = "completed",                // Trip finished
  CLOSED = "closed",                      // Paperwork complete, invoiced
  
  // Exceptions
  DELAYED = "delayed",                    // Behind schedule
  CANCELLED = "cancelled",                // Trip cancelled
}

// Exception types
export enum ExceptionType {
  LATE_TO_PICKUP = "late_to_pickup",
  LATE_TO_DELIVERY = "late_to_delivery",
  EXCESSIVE_DWELL = "excessive_dwell",
  OFF_ROUTE = "off_route",
  HOS_VIOLATION = "hos_violation",
  BORDER_DELAY = "border_delay",
}

// Trip with full metrics
export interface Trip {
  id: string;
  dispatch_id: string;
  order_id: string;
  driver_id: string;
  unit_id?: string;
  status: TripStatus;
  
  // Locations
  pickup_location: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_location: string;
  dropoff_lat?: number;
  dropoff_lng?: number;
  
  // Time windows
  pickup_window_start?: Date;
  pickup_window_end?: Date;
  delivery_window_start?: Date;
  delivery_window_end?: Date;
  
  // Current position
  current_lat?: number;
  current_lng?: number;
  last_ping?: Date;
  
  // Timestamps
  planned_start?: Date;
  actual_start?: Date;
  pickup_arrival?: Date;
  pickup_departure?: Date;
  delivery_arrival?: Date;
  delivery_departure?: Date;
  completed_at?: Date;
  closed_at?: Date;
  
  // Metrics
  planned_miles?: number;
  actual_miles?: number;
  estimated_fuel_gallons?: number;
  actual_fuel_gallons?: number;
  
  // Dwell times (minutes)
  pickup_dwell_minutes?: number;
  delivery_dwell_minutes?: number;
  
  // Performance
  on_time_pickup: boolean;
  on_time_delivery: boolean;
  
  // Route history (JSONB)
  route_history?: LocationPoint[];
  
  // Metadata
  notes?: string;
  pod_url?: string;          // Proof of delivery
  created_at: Date;
  updated_at: Date;
}

export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  source?: string;  // 'telematics' | 'driver_app' | 'manual'
}

export interface TripEvent {
  id: string;
  trip_id: string;
  event_type: string;        // 'status_change' | 'location_update' | 'note_added' | 'exception'
  event_data: any;           // JSON payload
  triggered_by?: string;     // 'driver' | 'dispatch' | 'system'
  timestamp: Date;
}

export interface TripException {
  id: string;
  trip_id: string;
  exception_type: ExceptionType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  resolved: boolean;
  resolved_at?: Date;
  created_at: Date;
}

export interface LocationUpdate {
  trip_id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  odometer?: number;
  fuel_level?: number;
  source: string;
  timestamp?: string;
}

// View models for different stakeholders
export interface DispatchView extends Trip {
  driver_name?: string;
  unit_number?: string;
  customer_name?: string;
  active_exceptions: TripException[];
  eta_to_delivery?: string;
  risk_level?: 'green' | 'yellow' | 'red';
}

export interface DriverView {
  trip_id: string;
  status: TripStatus;
  pickup_location: string;
  pickup_window_start?: Date;
  pickup_window_end?: Date;
  dropoff_location: string;
  delivery_window_start?: Date;
  delivery_window_end?: Date;
  special_instructions?: string;
  stops: TripStop[];
  current_stop_index: number;
}

export interface CustomerView {
  order_id: string;
  status: string;              // Simplified: "Scheduled" | "Picked Up" | "In Transit" | "Delivered"
  pickup_eta?: string;
  delivery_eta?: string;
  last_known_location?: string;
  delivered_at?: Date;
  tracking_url?: string;
}

export interface TripStop {
  location: string;
  type: 'pickup' | 'delivery';
  sequence: number;
  lat?: number;
  lng?: number;
  window_start?: Date;
  window_end?: Date;
  arrived_at?: Date;
  departed_at?: Date;
  notes?: string;
}
