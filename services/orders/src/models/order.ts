export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum OrderType {
  PICKUP = "pickup",
  DELIVERY = "delivery",
  ROUND_TRIP = "round_trip",
}

export interface Order {
  id: string;
  customer_id: string;
  order_type: OrderType;
  status: OrderStatus;
  pickup_location: string;
  dropoff_location: string;
  pickup_time?: Date;
  dropoff_time?: Date;
  special_instructions?: string;
  estimated_cost?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrderRequest {
  customer_id: string;
  order_type: OrderType;
  pickup_location: string;
  dropoff_location: string;
  pickup_time?: string;
  special_instructions?: string;
}
