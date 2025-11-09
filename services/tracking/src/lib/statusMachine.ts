import { TripStatus } from "../models/tracking";

const statusOrder: TripStatus[] = [
  TripStatus.PLANNED,
  TripStatus.ASSIGNED,
  TripStatus.EN_ROUTE_TO_PICKUP,
  TripStatus.AT_PICKUP,
  TripStatus.LOADING,
  TripStatus.DEPARTED_PICKUP,
  TripStatus.IN_TRANSIT,
  TripStatus.EN_ROUTE_TO_DELIVERY,
  TripStatus.AT_DELIVERY,
  TripStatus.UNLOADING,
  TripStatus.DELIVERED,
  TripStatus.COMPLETED,
  TripStatus.CLOSED,
];

const allowedTransitions: Record<TripStatus, TripStatus[]> = {
  [TripStatus.PLANNED]: [TripStatus.ASSIGNED, TripStatus.CANCELLED],
  [TripStatus.ASSIGNED]: [TripStatus.EN_ROUTE_TO_PICKUP, TripStatus.CANCELLED],
  [TripStatus.EN_ROUTE_TO_PICKUP]: [TripStatus.AT_PICKUP, TripStatus.DELAYED],
  [TripStatus.AT_PICKUP]: [TripStatus.LOADING, TripStatus.DELAYED],
  [TripStatus.LOADING]: [TripStatus.DEPARTED_PICKUP, TripStatus.DELAYED],
  [TripStatus.DEPARTED_PICKUP]: [TripStatus.IN_TRANSIT, TripStatus.EN_ROUTE_TO_DELIVERY],
  [TripStatus.IN_TRANSIT]: [TripStatus.EN_ROUTE_TO_DELIVERY, TripStatus.DELAYED],
  [TripStatus.EN_ROUTE_TO_DELIVERY]: [TripStatus.AT_DELIVERY, TripStatus.DELAYED],
  [TripStatus.AT_DELIVERY]: [TripStatus.UNLOADING, TripStatus.DELAYED],
  [TripStatus.UNLOADING]: [TripStatus.DELIVERED, TripStatus.DELAYED],
  [TripStatus.DELIVERED]: [TripStatus.COMPLETED],
  [TripStatus.COMPLETED]: [TripStatus.CLOSED],
  [TripStatus.CLOSED]: [],
  [TripStatus.DELAYED]: [
    TripStatus.EN_ROUTE_TO_PICKUP,
    TripStatus.AT_PICKUP,
    TripStatus.LOADING,
    TripStatus.DEPARTED_PICKUP,
    TripStatus.IN_TRANSIT,
    TripStatus.EN_ROUTE_TO_DELIVERY,
    TripStatus.AT_DELIVERY,
    TripStatus.UNLOADING,
    TripStatus.DELIVERED,
    TripStatus.COMPLETED,
  ],
  [TripStatus.CANCELLED]: [],
};

export function canTransition(
  current: TripStatus,
  next: TripStatus
): boolean {
  if (current === next) {
    return true;
  }

  const allowed = allowedTransitions[current] || [];
  return allowed.includes(next);
}

export function compareStatusOrder(a: TripStatus, b: TripStatus): number {
  return statusOrder.indexOf(a) - statusOrder.indexOf(b);
}
