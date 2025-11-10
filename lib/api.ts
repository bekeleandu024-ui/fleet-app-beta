import axios from "axios";
import { z } from "zod";

import {
  CostingDefaults,
  DashboardResponse,
  MapPlanResponse,
  MasterDataResponse,
  OrderDetail,
  OrdersResponse,
  TripDetail,
  TripsResponse,
  DispatchResponse,
  costingDefaultsSchema,
  dashboardResponseSchema,
  mapPlanResponseSchema,
  masterDataResponseSchema,
  orderDetailSchema,
  ordersResponseSchema,
  tripDetailSchema,
  tripsResponseSchema,
  dispatchResponseSchema,
} from "@/lib/types";

const api = axios.create({
  baseURL: "/api",
});

async function parseResponse<T>(promise: Promise<{ data: unknown }>, schema: z.ZodSchema<T>): Promise<T> {
  const response = await promise;
  return schema.parse(response.data);
}

export function fetchDashboard(): Promise<DashboardResponse> {
  return parseResponse(api.get("/dashboard"), dashboardResponseSchema);
}

export function fetchOrders(): Promise<OrdersResponse> {
  return parseResponse(api.get("/orders"), ordersResponseSchema);
}

export function fetchOrderDetail(id: string): Promise<OrderDetail> {
  return parseResponse(api.get(`/orders/${id}`), orderDetailSchema);
}

export function fetchDispatch(): Promise<DispatchResponse> {
  return parseResponse(api.get("/dispatch"), dispatchResponseSchema);
}

export function fetchTrips(): Promise<TripsResponse> {
  return parseResponse(api.get("/trips"), tripsResponseSchema);
}

export function fetchTripDetail(id: string): Promise<TripDetail> {
  return parseResponse(api.get(`/trips/${id}`), tripDetailSchema);
}

export function fetchCostingDefaults(): Promise<CostingDefaults> {
  return parseResponse(api.get("/costing"), costingDefaultsSchema);
}

export function fetchDriversMasterData(): Promise<MasterDataResponse> {
  return parseResponse(api.get("/master-data/drivers"), masterDataResponseSchema);
}

export function fetchUnitsMasterData(): Promise<MasterDataResponse> {
  return parseResponse(api.get("/master-data/units"), masterDataResponseSchema);
}

export function fetchRulesMasterData(): Promise<MasterDataResponse> {
  return parseResponse(api.get("/master-data/rules"), masterDataResponseSchema);
}

export function fetchEventsMasterData(): Promise<MasterDataResponse> {
  return parseResponse(api.get("/master-data/events"), masterDataResponseSchema);
}

export function fetchMapPlan(): Promise<MapPlanResponse> {
  return parseResponse(api.get("/map"), mapPlanResponseSchema);
}
