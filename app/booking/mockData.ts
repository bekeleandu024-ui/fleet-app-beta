import {
  BookingOrder,
  DriverOption,
  UnitOption,
  BookingRecommendation,
  QualifiedOrder,
  CrewMember,
} from "./types";

export const MOCK_BOOKING_ORDER: BookingOrder = {
  id: "ORD-2024-1031",
  customer: "The Center",
  customerLocation: "Guelph, ON → Dearborn, MI",
  pickupWindow: {
    start: "2024-10-31T20:49:00",
    end: "2024-10-31T08:49:00",
  },
  deliveryWindow: {
    start: "2024-10-31T22:50:00",
    end: "2024-10-31T23:00:00",
  },
  dispatcherNotes:
    "5 steel coils, 42,000 lb. PRE required at shipper. Cross at Ambassador Bridge. Appointment required on delivery.",
  tripContext:
    "Validate guardrails before booking. AI recommendations factor live rates, driver scorecards, and swell risk.",
  status: "flatbed",
  origin: { city: "Guelph", state: "ON" },
  destination: { city: "Dearborn", state: "MI" },
  miles: 202.94,
  commodity: "Steel Coils",
  weight: 42000,
};

export const MOCK_DRIVER_OPTIONS: DriverOption[] = [
  {
    id: "DRV-001",
    name: "Jeff Churchill",
    homeBase: "GUELPH",
    homeTerminal: "Home base GUELPH",
    type: "COMPANY",
    currentLocation: "Windsor, ON",
    hosRemaining: 9.5,
    efficiency: 94,
  },
  {
    id: "DRV-002",
    name: "Mike Anderson",
    homeBase: "KITCHENER",
    homeTerminal: "Home KITCHENER",
    type: "RENTAL",
    currentLocation: "London, ON",
    hosRemaining: 7.2,
    efficiency: 88,
  },
  {
    id: "DRV-003",
    name: "Sarah Thompson",
    homeBase: "WINDSOR",
    homeTerminal: "Home WINDSOR",
    type: "OWNER_OP",
    currentLocation: "Detroit, MI",
    hosRemaining: 10.5,
    efficiency: 96,
  },
];

export const MOCK_UNIT_OPTIONS: UnitOption[] = [
  {
    id: "UNIT-001",
    unitNumber: "257467",
    class: "RNR",
    homeTerminal: "Home BRAMPTON",
    availability: "Available",
  },
  {
    id: "UNIT-002",
    unitNumber: "258912",
    class: "COMPANY",
    homeTerminal: "Home GUELPH",
    availability: "Available",
  },
  {
    id: "UNIT-003",
    unitNumber: "259445",
    class: "OWNER_OP",
    homeTerminal: "Home KITCHENER",
    availability: "In Use",
  },
];

export const MOCK_BOOKING_RECOMMENDATION: BookingRecommendation = {
  driver: MOCK_DRIVER_OPTIONS[0],
  unit: MOCK_UNIT_OPTIONS[0],
  rate: {
    type: "COM",
    zone: "GLOBAL",
    ratePerMile: 1.57,
    marketIndex: "Market Index 2.05 RPM",
  },
  miles: 203,
  etaHours: 4.1,
  quotedRateVsMarket: {
    rate: 2.2,
    market: "Market Index 2.05 RPM",
  },
  revenueTargets: {
    revenue: 335.39,
    rpm: 1.653,
    margin: 5,
  },
  routingNotes:
    "Routing adds approximately 24 min vs a 55 mph baseline.",
};

export const MOCK_QUALIFIED_ORDERS: QualifiedOrder[] = [
  {
    id: "ORD-2024-1031",
    customer: "The Center",
    customerLocation: "Guelph, ON → Dearborn, MI",
    status: "in_focus",
    flatbedWindow: "Flatbed - PU Oct 31, 08:49 p.m. → Oct 31, 08:49 p.m.",
    crew: [
      {
        id: "DRV-001",
        name: "Jeff Churchill",
        role: "DRIVER",
        homeBase: "Jeff Churchill Home base GUELPH",
      },
      {
        id: "DRV-004",
        name: "Denise Starr",
        role: "KITCHENER",
        homeBase: "Home KITCHENER",
      },
      {
        id: "DRV-005",
        name: "Gurdip Dhaliwal",
        role: "WINDSOR",
        homeBase: "Home WINDSOR",
      },
    ],
    units: ["Unit 257467", "Unit 258912"],
  },
  {
    id: "ORD-2024-1029",
    customer: "AutoParts Inc",
    customerLocation: "Toronto, ON → Chicago, IL",
    status: "qualified",
    flatbedWindow: "Flatbed - PU Oct 29, 06:00 a.m. → Oct 29, 08:00 p.m.",
    crew: [
      {
        id: "DRV-006",
        name: "Tom Wilson",
        role: "DRIVER",
        homeBase: "Tom Wilson Home base TORONTO",
      },
    ],
    units: ["Unit 259001"],
  },
  {
    id: "ORD-2024-1030",
    customer: "Manufacturing Co",
    customerLocation: "London, ON → Detroit, MI",
    status: "qualified",
    flatbedWindow: "Flatbed - PU Oct 30, 10:00 a.m. → Oct 30, 02:00 p.m.",
    crew: [
      {
        id: "DRV-007",
        name: "Lisa Chen",
        role: "DRIVER",
        homeBase: "Lisa Chen Home base LONDON",
      },
    ],
    units: ["Unit 259223"],
  },
];
