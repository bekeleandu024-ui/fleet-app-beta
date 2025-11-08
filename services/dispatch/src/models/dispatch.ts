export enum DispatchStatus {
  ASSIGNED = "assigned",
  EN_ROUTE = "en_route",
  PICKED_UP = "picked_up",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export interface Dispatch {
  id: string;
  order_id: string;
  driver_id: string;
  status: DispatchStatus;
  assigned_at: Date;
  picked_up_at?: Date;
  delivered_at?: Date;
  updated_at: Date;
}
