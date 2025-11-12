import { randomUUID } from "crypto";

type DriverStatus = "Ready" | "Booked" | "Off Duty" | "Leave";
type UnitStatus = "Available" | "In-use" | "Maintenance" | "Out of Service";

type RuleStatus = "Active" | "Draft" | "Deprecated";
type EventStatus = "Open" | "Investigating" | "Resolved";
type OrderStatus =
  | "New"
  | "Planning"
  | "In Transit"
  | "At Risk"
  | "Delivered"
  | "Exception";

type TripStatus = "On Time" | "Running Late" | "Exception" | "Delivered";

type DriverRecord = {
  id: string;
  name: string;
  status: DriverStatus;
  region: string;
  hoursAvailable: number;
  updated: string;
};

type UnitRecord = {
  id: string;
  type: string;
  status: UnitStatus;
  location: string;
  region: string;
  updated: string;
};

type RuleRecord = {
  id: string;
  name: string;
  status: RuleStatus;
  region: string;
  owner: string;
  updated: string;
};

type EventRecord = {
  id: string;
  name: string;
  status: EventStatus;
  region: string;
  severity: "Low" | "Medium" | "High";
  updated: string;
};

type LaneRecord = {
  id: string;
  origin: string;
  destination: string;
  miles: number;
  transitDays: number;
};

type OrderRecord = {
  id: string;
  reference: string;
  customer: string;
  pickup: string;
  delivery: string;
  window: string;
  status: OrderStatus;
  ageHours: number;
  cost?: number;
  lane: string;
  serviceLevel: string;
  commodity: string;
  laneMiles: number;
};

type TripRecord = {
  id: string;
  tripNumber: string;
  orderId: string;
  driverId: string;
  unitId: string;
  driver: string;
  unit: string;
  pickup: string;
  delivery: string;
  eta: string;
  status: TripStatus;
  exceptions: number;
  lastPing: string;
};

type CustomerRecord = {
  id: string;
  name: string;
  status: "Active" | "Paused" | "Prospect";
  primaryContact: string;
  primaryLane: string;
};

type Store = {
  drivers: DriverRecord[];
  units: UnitRecord[];
  rules: RuleRecord[];
  events: EventRecord[];
  lanes: LaneRecord[];
  orders: OrderRecord[];
  trips: TripRecord[];
  customers: CustomerRecord[];
};

const now = () => new Date().toISOString();

function withUpdated<T extends { updated?: string }>(record: T): T {
  return { ...record, updated: now() };
}

function generateId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 5).toUpperCase()}`;
}

const store: Store = {
  drivers: [
    withUpdated({ id: "DRV-101", name: "S. Redding", status: "Ready", region: "South", hoursAvailable: 9 }),
    withUpdated({ id: "DRV-204", name: "J. McCall", status: "Ready", region: "West", hoursAvailable: 7.5 }),
    withUpdated({ id: "DRV-311", name: "N. Torres", status: "Booked", region: "Central", hoursAvailable: 3 }),
    withUpdated({ id: "DRV-128", name: "P. Hooper", status: "Off Duty", region: "South", hoursAvailable: 0 }),
  ],
  units: [
    withUpdated({
      id: "TRK-48",
      type: "53' Reefer",
      status: "Available",
      location: "Dallas, TX",
      region: "South",
    }),
    withUpdated({
      id: "TRK-67",
      type: "53' Dry Van",
      status: "Available",
      location: "Ontario, CA",
      region: "West",
    }),
    withUpdated({
      id: "TRK-09",
      type: "53' Reefer",
      status: "Maintenance",
      location: "Dallas, TX",
      region: "South",
    }),
    withUpdated({
      id: "TRK-33",
      type: "53' Dry Van",
      status: "In-use",
      location: "Chicago, IL",
      region: "Midwest",
    }),
  ],
  rules: [
    withUpdated({
      id: "RL-001",
      name: "Temperature Compliance",
      status: "Active",
      region: "Network",
      owner: "Quality",
    }),
    withUpdated({
      id: "RL-014",
      name: "Team Required > 900mi",
      status: "Active",
      region: "Network",
      owner: "Safety",
    }),
    withUpdated({
      id: "RL-022",
      name: "Hazmat Corridor Restrictions",
      status: "Draft",
      region: "Southeast",
      owner: "Compliance",
    }),
    withUpdated({
      id: "RL-037",
      name: "Customer Dwell SLA",
      status: "Active",
      region: "Midwest",
      owner: "Operations",
    }),
  ],
  events: [
    withUpdated({
      id: "EV-9001",
      name: "Driver Safety Incident",
      status: "Open",
      region: "South",
      severity: "High",
    }),
    withUpdated({
      id: "EV-9002",
      name: "Customer SLA Breach",
      status: "Investigating",
      region: "West",
      severity: "Medium",
    }),
    withUpdated({
      id: "EV-9003",
      name: "Asset Breakdown",
      status: "Resolved",
      region: "Midwest",
      severity: "Medium",
    }),
    withUpdated({
      id: "EV-9004",
      name: "Carrier Compliance Audit",
      status: "Open",
      region: "Network",
      severity: "Low",
    }),
  ],
  lanes: [
    { id: "LAN-1001", origin: "Dallas, TX", destination: "Atlanta, GA", miles: 781, transitDays: 2 },
    { id: "LAN-1002", origin: "Ontario, CA", destination: "Denver, CO", miles: 1004, transitDays: 3 },
    { id: "LAN-1003", origin: "Chicago, IL", destination: "Kansas City, MO", miles: 512, transitDays: 1 },
    { id: "LAN-1004", origin: "Seattle, WA", destination: "Reno, NV", miles: 704, transitDays: 2 },
  ],
  orders: [
    {
      id: "ORD-10452",
      reference: "XPO-4452",
      customer: "Apex Manufacturing",
      pickup: "Dallas, TX",
      delivery: "Atlanta, GA",
      window: "05:00-09:00",
      status: "In Transit",
      ageHours: 18,
      cost: 1825,
      lane: "DAL → ATL",
      serviceLevel: "Premium",
      commodity: "Electronics",
      laneMiles: 781,
    },
    {
      id: "ORD-10453",
      reference: "BN-2140",
      customer: "Brightline Retail",
      pickup: "Ontario, CA",
      delivery: "Denver, CO",
      window: "07:00-11:00",
      status: "At Risk",
      ageHours: 27,
      cost: 2410,
      lane: "ONT → DEN",
      serviceLevel: "Standard",
      commodity: "Retail Fixtures",
      laneMiles: 1004,
    },
    {
      id: "ORD-10454",
      reference: "NW-8821",
      customer: "Northwind",
      pickup: "Chicago, IL",
      delivery: "Kansas City, MO",
      window: "12:00-16:00",
      status: "Planning",
      ageHours: 5,
      lane: "ORD → MCI",
      serviceLevel: "Standard",
      commodity: "Industrial Components",
      laneMiles: 512,
    },
    {
      id: "ORD-10455",
      reference: "ST-2219",
      customer: "Summit Tech",
      pickup: "Seattle, WA",
      delivery: "Reno, NV",
      window: "06:00-12:00",
      status: "In Transit",
      ageHours: 31,
      cost: 2655,
      lane: "SEA → RNO",
      serviceLevel: "Express",
      commodity: "Electronics",
      laneMiles: 704,
    },
    {
      id: "ORD-10456",
      reference: "ACM-9902",
      customer: "Acme Components",
      pickup: "Memphis, TN",
      delivery: "Charlotte, NC",
      window: "08:00-14:00",
      status: "New",
      ageHours: 3,
      lane: "MEM → CLT",
      serviceLevel: "Standard",
      commodity: "Machinery",
      laneMiles: 512,
    },
    {
      id: "ORD-10457",
      reference: "BR-1129",
      customer: "Brightline Retail",
      pickup: "Phoenix, AZ",
      delivery: "Las Vegas, NV",
      window: "04:00-08:00",
      status: "Exception",
      ageHours: 42,
      cost: 1310,
      lane: "PHX → LAS",
      serviceLevel: "Priority",
      commodity: "Retail Fixtures",
      laneMiles: 300,
    },
    {
      id: "ORD-10458",
      reference: "NW-8890",
      customer: "Northwind",
      pickup: "Columbus, OH",
      delivery: "Detroit, MI",
      window: "09:00-13:00",
      status: "Delivered",
      ageHours: 6,
      cost: 970,
      lane: "CMH → DTW",
      serviceLevel: "Standard",
      commodity: "Industrial Components",
      laneMiles: 204,
    },
    {
      id: "ORD-10459",
      reference: "APX-6712",
      customer: "Apex Manufacturing",
      pickup: "Houston, TX",
      delivery: "Charlotte, NC",
      window: "02:00-06:00",
      status: "In Transit",
      ageHours: 21,
      cost: 2050,
      lane: "HOU → CLT",
      serviceLevel: "Premium",
      commodity: "Electronics",
      laneMiles: 1042,
    },
  ],
  trips: [
    {
      id: "TRP-9001",
      tripNumber: "TRP-9001",
      orderId: "ORD-10452",
      driverId: "DRV-101",
      unitId: "TRK-48",
      driver: "S. Redding",
      unit: "TRK-48",
      pickup: "Dallas, TX",
      delivery: "Atlanta, GA",
      eta: "2024-05-09T18:30:00Z",
      status: "On Time",
      exceptions: 0,
      lastPing: "2024-05-08T22:10:00Z",
    },
    {
      id: "TRP-9002",
      tripNumber: "TRP-9002",
      orderId: "ORD-10453",
      driverId: "DRV-204",
      unitId: "TRK-67",
      driver: "J. McCall",
      unit: "TRK-67",
      pickup: "Ontario, CA",
      delivery: "Denver, CO",
      eta: "2024-05-10T14:00:00Z",
      status: "Running Late",
      exceptions: 2,
      lastPing: "2024-05-08T21:55:00Z",
    },
    {
      id: "TRP-9003",
      tripNumber: "TRP-9003",
      orderId: "ORD-10454",
      driverId: "DRV-311",
      unitId: "TRK-33",
      driver: "N. Torres",
      unit: "TRK-33",
      pickup: "Chicago, IL",
      delivery: "Kansas City, MO",
      eta: "2024-05-09T04:30:00Z",
      status: "On Time",
      exceptions: 0,
      lastPing: "2024-05-08T23:05:00Z",
    },
    {
      id: "TRP-9004",
      tripNumber: "TRP-9004",
      orderId: "ORD-10455",
      driverId: "DRV-128",
      unitId: "TRK-09",
      driver: "P. Hooper",
      unit: "TRK-09",
      pickup: "Seattle, WA",
      delivery: "Reno, NV",
      eta: "2024-05-10T02:45:00Z",
      status: "Exception",
      exceptions: 1,
      lastPing: "2024-05-08T20:40:00Z",
    },
  ],
  customers: [
    {
      id: "CUST-1001",
      name: "Apex Manufacturing",
      status: "Active",
      primaryContact: "ops@apexmfg.com",
      primaryLane: "DAL → ATL",
    },
    {
      id: "CUST-1002",
      name: "Brightline Retail",
      status: "Active",
      primaryContact: "supply@brightline.com",
      primaryLane: "ONT → DEN",
    },
    {
      id: "CUST-1003",
      name: "Northwind",
      status: "Paused",
      primaryContact: "logistics@northwind.com",
      primaryLane: "CMH → DTW",
    },
    {
      id: "CUST-1004",
      name: "Summit Tech",
      status: "Prospect",
      primaryContact: "dispatch@summittech.io",
      primaryLane: "SEA → RNO",
    },
  ],
};

function ensureUniqueId<T extends { id: string }>(collection: T[], prefix: string, providedId?: string) {
  if (providedId) {
    const exists = collection.some((item) => item.id === providedId);
    if (exists) {
      throw new Error(`ID ${providedId} already exists`);
    }
    return providedId;
  }
  let id = generateId(prefix);
  while (collection.some((item) => item.id === id)) {
    id = generateId(prefix);
  }
  return id;
}

function upsertRecord<T extends { id: string }>(collection: T[], record: T): T {
  const index = collection.findIndex((item) => item.id === record.id);
  if (index === -1) {
    collection.push(record);
  } else {
    collection[index] = record;
  }
  return record;
}

function deleteRecord<T extends { id: string }>(collection: T[], id: string): void {
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error("Record not found");
  }
  collection.splice(index, 1);
}

export function listDrivers(): DriverRecord[] {
  return [...store.drivers];
}

export function createDriver(input: Omit<DriverRecord, "id" | "updated"> & { id?: string }): DriverRecord {
  const id = ensureUniqueId(store.drivers, "DRV", input.id);
  const record = withUpdated({ ...input, id });
  return upsertRecord(store.drivers, record);
}

export function updateDriver(id: string, input: Partial<Omit<DriverRecord, "id">>): DriverRecord {
  const existing = store.drivers.find((driver) => driver.id === id);
  if (!existing) {
    throw new Error("Driver not found");
  }
  const record = withUpdated({ ...existing, ...input, id });
  return upsertRecord(store.drivers, record);
}

export function removeDriver(id: string): void {
  deleteRecord(store.drivers, id);
}

export function listUnits(): UnitRecord[] {
  return [...store.units];
}

export function createUnit(input: Omit<UnitRecord, "id" | "updated"> & { id?: string }): UnitRecord {
  const id = ensureUniqueId(store.units, "TRK", input.id);
  const record = withUpdated({ ...input, id });
  return upsertRecord(store.units, record);
}

export function updateUnit(id: string, input: Partial<Omit<UnitRecord, "id">>): UnitRecord {
  const existing = store.units.find((unit) => unit.id === id);
  if (!existing) {
    throw new Error("Unit not found");
  }
  const record = withUpdated({ ...existing, ...input, id });
  return upsertRecord(store.units, record);
}

export function removeUnit(id: string): void {
  deleteRecord(store.units, id);
}

export function listRules(): RuleRecord[] {
  return [...store.rules];
}

export function createRule(input: Omit<RuleRecord, "id" | "updated"> & { id?: string }): RuleRecord {
  const id = ensureUniqueId(store.rules, "RL", input.id);
  const record = withUpdated({ ...input, id });
  return upsertRecord(store.rules, record);
}

export function updateRule(id: string, input: Partial<Omit<RuleRecord, "id">>): RuleRecord {
  const existing = store.rules.find((rule) => rule.id === id);
  if (!existing) {
    throw new Error("Rule not found");
  }
  const record = withUpdated({ ...existing, ...input, id });
  return upsertRecord(store.rules, record);
}

export function removeRule(id: string): void {
  deleteRecord(store.rules, id);
}

export function listEvents(): EventRecord[] {
  return [...store.events];
}

export function createEvent(input: Omit<EventRecord, "id" | "updated"> & { id?: string }): EventRecord {
  const id = ensureUniqueId(store.events, "EV", input.id);
  const record = withUpdated({ ...input, id });
  return upsertRecord(store.events, record);
}

export function updateEvent(id: string, input: Partial<Omit<EventRecord, "id">>): EventRecord {
  const existing = store.events.find((event) => event.id === id);
  if (!existing) {
    throw new Error("Event not found");
  }
  const record = withUpdated({ ...existing, ...input, id });
  return upsertRecord(store.events, record);
}

export function removeEvent(id: string): void {
  deleteRecord(store.events, id);
}

export function listLanes(): LaneRecord[] {
  return [...store.lanes];
}

export function createLane(input: Omit<LaneRecord, "id"> & { id?: string }): LaneRecord {
  const id = ensureUniqueId(store.lanes, "LAN", input.id);
  const record = { ...input, id };
  return upsertRecord(store.lanes, record);
}

export function updateLane(id: string, input: Partial<Omit<LaneRecord, "id">>): LaneRecord {
  const existing = store.lanes.find((lane) => lane.id === id);
  if (!existing) {
    throw new Error("Lane not found");
  }
  const record = { ...existing, ...input, id };
  return upsertRecord(store.lanes, record);
}

export function removeLane(id: string): void {
  deleteRecord(store.lanes, id);
}

export function listOrders(): OrderRecord[] {
  return [...store.orders];
}

export function createOrder(input: Omit<OrderRecord, "id"> & { id?: string }): OrderRecord {
  const id = ensureUniqueId(store.orders, "ORD", input.id);
  const record = { ...input, id };
  return upsertRecord(store.orders, record);
}

export function updateOrder(id: string, input: Partial<Omit<OrderRecord, "id">>): OrderRecord {
  const existing = store.orders.find((order) => order.id === id);
  if (!existing) {
    throw new Error("Order not found");
  }
  const record = { ...existing, ...input, id };
  return upsertRecord(store.orders, record);
}

export function removeOrder(id: string): void {
  deleteRecord(store.orders, id);
}

export function listTrips(): TripRecord[] {
  return [...store.trips];
}

export function createTrip(input: Omit<TripRecord, "id" | "tripNumber"> & { id?: string; tripNumber?: string }): TripRecord {
  const id = ensureUniqueId(store.trips, "TRP", input.id);
  const tripNumber = input.tripNumber ?? id;
  const record = { ...input, id, tripNumber };
  return upsertRecord(store.trips, record);
}

export function updateTrip(id: string, input: Partial<Omit<TripRecord, "id">>): TripRecord {
  const existing = store.trips.find((trip) => trip.id === id);
  if (!existing) {
    throw new Error("Trip not found");
  }
  const record = { ...existing, ...input, id, tripNumber: input.tripNumber ?? existing.tripNumber };
  return upsertRecord(store.trips, record);
}

export function removeTrip(id: string): void {
  deleteRecord(store.trips, id);
}

export function listCustomers(): CustomerRecord[] {
  return [...store.customers];
}

export function createCustomer(input: Omit<CustomerRecord, "id"> & { id?: string }): CustomerRecord {
  const id = ensureUniqueId(store.customers, "CUST", input.id);
  const record = { ...input, id };
  return upsertRecord(store.customers, record);
}

export function updateCustomer(id: string, input: Partial<Omit<CustomerRecord, "id">>): CustomerRecord {
  const existing = store.customers.find((customer) => customer.id === id);
  if (!existing) {
    throw new Error("Customer not found");
  }
  const record = { ...existing, ...input, id };
  return upsertRecord(store.customers, record);
}

export function removeCustomer(id: string): void {
  deleteRecord(store.customers, id);
}

export type {
  DriverRecord,
  UnitRecord,
  RuleRecord,
  EventRecord,
  LaneRecord,
  OrderRecord,
  TripRecord,
  CustomerRecord,
  DriverStatus,
  UnitStatus,
  RuleStatus,
  EventStatus,
  OrderStatus,
  TripStatus,
};
