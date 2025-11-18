import axios from "axios";
import { z } from "zod";

import {
  AnalyticsResponse,
  CostingDefaults,
  CustomerAdminCreate,
  CustomerAdminRecord,
  CustomerAdminUpdate,
  DashboardResponse,
  GlobalSearchResponse,
  DriverAdminCreate,
  DriverAdminRecord,
  DriverAdminUpdate,
  EventAdminCreate,
  EventAdminRecord,
  EventAdminUpdate,
  LaneAdminCreate,
  LaneAdminRecord,
  LaneAdminUpdate,
  MapPlanResponse,
  MasterDataResponse,
  OrderAdminCreate,
  OrderAdminRecord,
  OrderAdminUpdate,
  OrderDetail,
  OrdersResponse,
  RuleAdminCreate,
  RuleAdminRecord,
  RuleAdminUpdate,
  TripAdminCreate,
  TripAdminRecord,
  TripAdminUpdate,
  TripDetail,
  TripsResponse,
  UnitAdminCreate,
  UnitAdminRecord,
  UnitAdminUpdate,
  DispatchResponse,
  customerAdminSchema,
  dashboardResponseSchema,
  driverAdminSchema,
  eventAdminSchema,
  laneAdminSchema,
  mapPlanResponseSchema,
  masterDataResponseSchema,
  orderAdminSchema,
  orderDetailSchema,
  ordersResponseSchema,
  ruleAdminSchema,
  globalSearchResponseSchema,
  tripAdminSchema,
  tripDetailSchema,
  tripsResponseSchema,
  unitAdminSchema,
  analyticsResponseSchema,
  costingDefaultsSchema,
  dispatchResponseSchema,
} from "@/lib/types";

const api = axios.create({
  baseURL: "/api",
});

async function parseResponse<T>(promise: Promise<{ data: unknown }>, schema: z.ZodSchema<T>): Promise<T> {
  const response = await promise;
  return schema.parse(response.data);
}

function parseDataList<T>(promise: Promise<{ data: unknown }>, itemSchema: z.ZodType<T>): Promise<T[]> {
  return parseResponse(promise, z.object({ data: z.array(itemSchema) })).then((result) => result.data);
}

async function parseDataItem<T>(promise: Promise<{ data: unknown }>, itemSchema: z.ZodType<T>): Promise<T> {
  const result = await parseResponse(promise, z.object({ data: itemSchema }));
  return result.data as T;
}

const successSchema = z.object({ success: z.boolean() });

async function deleteById(url: string, id: string): Promise<void> {
  await parseResponse(api.delete(`${url}/${id}`), successSchema);
}

export function fetchDashboard(): Promise<DashboardResponse> {
  return parseResponse(api.get("/dashboard"), dashboardResponseSchema);
}

export function fetchAnalytics(): Promise<AnalyticsResponse> {
  return parseResponse(api.get("/analytics"), analyticsResponseSchema);
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

export function fetchGlobalSearch(query: string): Promise<GlobalSearchResponse> {
  return parseResponse(
    api.get("/search", { params: { q: query } }),
    globalSearchResponseSchema
  );
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

export function fetchAdminDrivers(): Promise<DriverAdminRecord[]> {
  return parseDataList(api.get("/admin/drivers"), driverAdminSchema);
}

export function createAdminDriver(payload: DriverAdminCreate): Promise<DriverAdminRecord> {
  return parseDataItem(api.post("/admin/drivers", payload), driverAdminSchema);
}

export function updateAdminDriver(payload: DriverAdminUpdate): Promise<DriverAdminRecord> {
  return parseDataItem(api.put("/admin/drivers", payload), driverAdminSchema);
}

export function deleteAdminDriver(id: string): Promise<void> {
  return deleteById("/admin/drivers", id);
}

export function fetchAdminUnits(): Promise<UnitAdminRecord[]> {
  return parseDataList(api.get("/admin/units"), unitAdminSchema);
}

export function createAdminUnit(payload: UnitAdminCreate): Promise<UnitAdminRecord> {
  return parseDataItem(api.post("/admin/units", payload), unitAdminSchema);
}

export function updateAdminUnit(payload: UnitAdminUpdate): Promise<UnitAdminRecord> {
  return parseDataItem(api.put("/admin/units", payload), unitAdminSchema);
}

export function deleteAdminUnit(id: string): Promise<void> {
  return deleteById("/admin/units", id);
}

export function fetchAdminRules(): Promise<RuleAdminRecord[]> {
  return parseDataList(api.get("/admin/rules"), ruleAdminSchema);
}

export function createAdminRule(payload: RuleAdminCreate): Promise<RuleAdminRecord> {
  return parseDataItem(api.post("/admin/rules", payload), ruleAdminSchema);
}

export function updateAdminRule(payload: RuleAdminUpdate): Promise<RuleAdminRecord> {
  return parseDataItem(api.put("/admin/rules", payload), ruleAdminSchema);
}

export function deleteAdminRule(id: string): Promise<void> {
  return deleteById("/admin/rules", id);
}

export function fetchAdminEvents(): Promise<EventAdminRecord[]> {
  return parseDataList(api.get("/admin/events"), eventAdminSchema);
}

export function createAdminEvent(payload: EventAdminCreate): Promise<EventAdminRecord> {
  return parseDataItem(api.post("/admin/events", payload), eventAdminSchema);
}

export function updateAdminEvent(payload: EventAdminUpdate): Promise<EventAdminRecord> {
  return parseDataItem(api.put("/admin/events", payload), eventAdminSchema);
}

export function deleteAdminEvent(id: string): Promise<void> {
  return deleteById("/admin/events", id);
}

export function fetchAdminLanes(): Promise<LaneAdminRecord[]> {
  return parseDataList(api.get("/admin/lanes"), laneAdminSchema);
}

export function createAdminLane(payload: LaneAdminCreate): Promise<LaneAdminRecord> {
  return parseDataItem(api.post("/admin/lanes", payload), laneAdminSchema);
}

export function updateAdminLane(payload: LaneAdminUpdate): Promise<LaneAdminRecord> {
  return parseDataItem(api.put("/admin/lanes", payload), laneAdminSchema);
}

export function deleteAdminLane(id: string): Promise<void> {
  return deleteById("/admin/lanes", id);
}

export function fetchAdminOrders(): Promise<OrderAdminRecord[]> {
  return parseDataList(api.get("/admin/orders"), orderAdminSchema);
}

export function createAdminOrder(payload: OrderAdminCreate): Promise<OrderAdminRecord> {
  return parseDataItem(api.post("/admin/orders", payload), orderAdminSchema);
}

export function updateAdminOrder(payload: OrderAdminUpdate): Promise<OrderAdminRecord> {
  return parseDataItem(api.put("/admin/orders", payload), orderAdminSchema);
}

export function deleteAdminOrder(id: string): Promise<void> {
  return deleteById("/admin/orders", id);
}

export function fetchAdminTrips(): Promise<TripAdminRecord[]> {
  return parseDataList(api.get("/admin/trips"), tripAdminSchema);
}

export function createAdminTrip(payload: TripAdminCreate): Promise<TripAdminRecord> {
  return parseDataItem(api.post("/admin/trips", payload), tripAdminSchema);
}

export function updateAdminTrip(payload: TripAdminUpdate): Promise<TripAdminRecord> {
  return parseDataItem(api.put("/admin/trips", payload), tripAdminSchema);
}

export function deleteAdminTrip(id: string): Promise<void> {
  return deleteById("/admin/trips", id);
}

export function fetchAdminCustomers(): Promise<CustomerAdminRecord[]> {
  return parseDataList(api.get("/admin/customers"), customerAdminSchema);
}

export function createAdminCustomer(payload: CustomerAdminCreate): Promise<CustomerAdminRecord> {
  return parseDataItem(api.post("/admin/customers", payload), customerAdminSchema);
}

export function updateAdminCustomer(payload: CustomerAdminUpdate): Promise<CustomerAdminRecord> {
  return parseDataItem(api.put("/admin/customers", payload), customerAdminSchema);
}

export function deleteAdminCustomer(id: string): Promise<void> {
  return deleteById("/admin/customers", id);
}

export interface EventType {
  event_id: string;
  event_code: string;
  event_name: string;
  cost_per_event: number;
  is_automatic: boolean;
  created_at: string;
}

export interface EventLogPayload {
  note: string;
  triggeredBy?: string;
  eventType?: string;
  location?: string;
}

export async function fetchEventTypes(): Promise<EventType[]> {
  const response = await api.get("/master-data/events");
  const data = response.data;
  return data.event_types?.types || [];
}

export async function createTripEvent(tripId: string, payload: EventLogPayload): Promise<any> {
  const response = await api.post(`/trips/${tripId}/events`, payload);
  return response.data;
}
