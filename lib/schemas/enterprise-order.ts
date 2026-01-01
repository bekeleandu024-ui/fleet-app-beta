import { z } from "zod";

// ============================================================================
// ENTERPRISE ORDER CREATION SCHEMA
// Multi-stop, freight items, references, and billing
// ============================================================================

// === STOP SCHEMA ===
export const appointmentTypeSchema = z.enum(["firm", "fcfs", "open"]);
export type AppointmentType = z.infer<typeof appointmentTypeSchema>;

export const stopTypeSchema = z.enum(["pickup", "delivery", "intermediate"]);
export type StopType = z.infer<typeof stopTypeSchema>;

export const orderStopInputSchema = z.object({
  id: z.string().optional(), // Client-side temp ID
  stopSequence: z.number().int().min(0),
  stopType: stopTypeSchema,
  
  // Location
  locationName: z.string().max(255).optional().nullable(),
  streetAddress: z.string().optional().nullable(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().max(50).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(3).default("USA"),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  
  // Appointment
  appointmentType: appointmentTypeSchema.default("fcfs"),
  appointmentStart: z.string().optional().nullable(), // ISO datetime
  appointmentEnd: z.string().optional().nullable(),
  
  // Contact
  contactName: z.string().max(100).optional().nullable(),
  contactPhone: z.string().max(30).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  
  // Instructions
  specialInstructions: z.string().optional().nullable(),
  driverInstructions: z.string().optional().nullable(),
});
export type OrderStopInput = z.infer<typeof orderStopInputSchema>;

// === FREIGHT ITEM SCHEMA ===
export const packagingTypeSchema = z.enum([
  "pallet", "crate", "drum", "bag", "bundle", "roll", "box", "carton", "loose", "container"
]);
export type PackagingType = z.infer<typeof packagingTypeSchema>;

export const freightClassSchema = z.enum([
  "50", "55", "60", "65", "70", "77.5", "85", "92.5", "100", 
  "110", "125", "150", "175", "200", "250", "300", "400", "500"
]);
export type FreightClass = z.infer<typeof freightClassSchema>;

export const freightItemInputSchema = z.object({
  id: z.string().optional(),
  lineNumber: z.number().int().min(1),
  
  // Commodity
  commodity: z.string().min(1, "Commodity is required").max(255),
  description: z.string().optional().nullable(),
  
  // Quantity & Packaging
  quantity: z.number().int().min(1).default(1),
  pieces: z.number().int().min(1).default(1),
  packagingType: packagingTypeSchema.default("pallet"),
  
  // Weight & Dimensions
  weightLbs: z.number().min(0).optional().nullable(),
  lengthIn: z.number().min(0).optional().nullable(),
  widthIn: z.number().min(0).optional().nullable(),
  heightIn: z.number().min(0).optional().nullable(),
  cubicFeet: z.number().min(0).optional().nullable(),
  
  // Classification
  freightClass: freightClassSchema.optional().nullable(),
  nmfcCode: z.string().max(20).optional().nullable(),
  
  // Hazmat
  isHazmat: z.boolean().default(false),
  hazmatClass: z.string().max(20).optional().nullable(),
  hazmatUnNumber: z.string().max(10).optional().nullable(),
  hazmatPackingGroup: z.string().max(5).optional().nullable(),
  hazmatProperName: z.string().max(255).optional().nullable(),
  
  // Handling
  stackable: z.boolean().default(true),
  temperatureControlled: z.boolean().default(false),
  tempMinF: z.number().optional().nullable(),
  tempMaxF: z.number().optional().nullable(),
  
  // Value
  declaredValue: z.number().min(0).optional().nullable(),
  currency: z.string().max(3).default("USD"),
});
export type FreightItemInput = z.infer<typeof freightItemInputSchema>;

// === REFERENCE SCHEMA ===
export const referenceTypeSchema = z.enum([
  "PO", "BOL", "SEAL", "PRO", "QUOTE", "SO", "INV", "REF", 
  "BOOKING", "CONTAINER", "TRAILER", "LOAD", "ASN", "CUSTOMS", "PARS"
]);
export type ReferenceType = z.infer<typeof referenceTypeSchema>;

export const orderReferenceInputSchema = z.object({
  id: z.string().optional(),
  referenceType: referenceTypeSchema,
  referenceValue: z.string().min(1, "Reference value is required").max(255),
  description: z.string().optional().nullable(),
});
export type OrderReferenceInput = z.infer<typeof orderReferenceInputSchema>;

// === BILLING SCHEMA ===
export const billToTypeSchema = z.enum(["customer", "shipper", "consignee", "third_party"]);
export type BillToType = z.infer<typeof billToTypeSchema>;

export const paymentTermsSchema = z.enum([
  "PREPAID", "COD", "NET15", "NET30", "NET45", "NET60"
]);
export type PaymentTerms = z.infer<typeof paymentTermsSchema>;

export const orderBillingInputSchema = z.object({
  billToType: billToTypeSchema.default("customer"),
  billToCustomerId: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().optional().nullable()
  ),
  billToName: z.string().max(255).optional().nullable(),
  billToAddress: z.string().optional().nullable(),
  billToEmail: z.string().email().optional().nullable(),
  paymentTerms: paymentTermsSchema.default("NET30"),
  invoiceMethod: z.enum(["email", "mail", "edi", "portal"]).default("email"),
  requirePod: z.boolean().default(true),
  requireBol: z.boolean().default(true),
});
export type OrderBillingInput = z.infer<typeof orderBillingInputSchema>;

// === ACCESSORIAL SCHEMA ===
export const accessorialCodeSchema = z.enum([
  "LIFTGATE_PU", "LIFTGATE_DEL", "INSIDE_PU", "INSIDE_DEL", "RESIDENTIAL",
  "LIMITED_ACCESS", "APPOINTMENT", "DETENTION_PU", "DETENTION_DEL", "LAYOVER",
  "TARP", "TEAM", "HAZMAT", "REEFER_PROTECTION", "TEMP_CONTROLLED",
  "SORT_SEGREGATE", "SCALE_TICKET", "EXTRA_STOP", "BORDER_CROSSING", "BLIND_SHIPMENT"
]);
export type AccessorialCode = z.infer<typeof accessorialCodeSchema>;

export const orderAccessorialInputSchema = z.object({
  id: z.string().optional(),
  accessorialCode: accessorialCodeSchema,
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type OrderAccessorialInput = z.infer<typeof orderAccessorialInputSchema>;

// === EQUIPMENT SCHEMA ===
export const equipmentTypeSchema = z.enum([
  "Dry Van", "Flatbed", "Reefer", "Step Deck", "Box Truck", 
  "Tanker", "Lowboy", "Double Drop", "Conestoga", "Power Only"
]);
export type EquipmentType = z.infer<typeof equipmentTypeSchema>;

// === MAIN ORDER INPUT SCHEMA ===
export const enterpriseOrderInputSchema = z.object({
  // Core Info
  customerId: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().optional().nullable()
  ),
  customerName: z.string().min(1, "Customer is required").max(255),
  
  // Equipment
  equipmentType: equipmentTypeSchema.default("Dry Van"),
  equipmentLength: z.number().int().min(1).max(100).default(53),
  temperatureSetting: z.string().optional().nullable(),
  
  // Multi-Stop Route (minimum 2: pickup + delivery)
  stops: z.array(orderStopInputSchema)
    .min(2, "At least one pickup and one delivery stop required")
    .refine(
      (stops) => stops.some(s => s.stopType === "pickup") && stops.some(s => s.stopType === "delivery"),
      "Must have at least one pickup and one delivery stop"
    ),
  
  // Freight Items
  freightItems: z.array(freightItemInputSchema)
    .min(1, "At least one freight item is required"),
  
  // References
  references: z.array(orderReferenceInputSchema).default([]),
  
  // Billing
  billing: orderBillingInputSchema.default({
    billToType: "customer",
    paymentTerms: "NET30",
    invoiceMethod: "email",
    requirePod: true,
    requireBol: true,
  }),
  
  // Accessorials
  accessorials: z.array(orderAccessorialInputSchema).default([]),
  
  // Totals (computed or manual override)
  totalWeightLbs: z.number().min(0).optional().nullable(),
  totalPieces: z.number().int().min(0).optional().nullable(),
  totalPallets: z.number().int().min(0).optional().nullable(),
  totalCubicFeet: z.number().min(0).optional().nullable(),
  totalLinearFeet: z.number().min(0).optional().nullable(),
  
  // Flags
  isHazmat: z.boolean().default(false),
  isHighValue: z.boolean().default(false),
  declaredValue: z.number().min(0).optional().nullable(),
  
  // Instructions
  specialInstructions: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  
  // Metadata
  priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  sourceChannel: z.enum(["manual", "email", "phone", "portal", "edi", "api"]).default("manual"),
  status: z.enum(["New", "Qualifying", "Qualified", "Ready to Book"]).default("New"),
});
export type EnterpriseOrderInput = z.infer<typeof enterpriseOrderInputSchema>;

// ============================================================================
// AI OCR EXTRACTION SCHEMA
// Used by Claude to parse unstructured text/images into structured order data
// ============================================================================
export const aiOrderExtractionSchema = z.object({
  // Customer
  customerName: z.string().optional().nullable(),
  
  // Equipment
  equipmentType: equipmentTypeSchema.optional().nullable(),
  temperatureSetting: z.string().optional().nullable(),
  
  // Stops (AI should extract all stops it finds)
  stops: z.array(z.object({
    stopType: stopTypeSchema,
    locationName: z.string().optional().nullable(),
    streetAddress: z.string().optional().nullable(),
    city: z.string(),
    state: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    country: z.string().default("USA"),
    appointmentType: appointmentTypeSchema.optional().nullable(),
    appointmentStart: z.string().optional().nullable(),
    appointmentEnd: z.string().optional().nullable(),
    contactName: z.string().optional().nullable(),
    contactPhone: z.string().optional().nullable(),
    specialInstructions: z.string().optional().nullable(),
  })).optional().default([]),
  
  // Freight Items
  freightItems: z.array(z.object({
    commodity: z.string(),
    description: z.string().optional().nullable(),
    quantity: z.number().optional().nullable(),
    pieces: z.number().optional().nullable(),
    packagingType: packagingTypeSchema.optional().nullable(),
    weightLbs: z.number().optional().nullable(),
    lengthIn: z.number().optional().nullable(),
    widthIn: z.number().optional().nullable(),
    heightIn: z.number().optional().nullable(),
    freightClass: z.string().optional().nullable(),
    isHazmat: z.boolean().optional().nullable(),
    hazmatClass: z.string().optional().nullable(),
    hazmatUnNumber: z.string().optional().nullable(),
    stackable: z.boolean().optional().nullable(),
    temperatureControlled: z.boolean().optional().nullable(),
    tempMinF: z.number().optional().nullable(),
    tempMaxF: z.number().optional().nullable(),
  })).optional().default([]),
  
  // References (AI extracts key-value pairs)
  references: z.array(z.object({
    referenceType: z.string(), // AI might not know exact enum, we'll map it
    referenceValue: z.string(),
  })).optional().default([]),
  
  // Billing
  billToName: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  
  // Accessorials (AI might detect mentions of services)
  accessorials: z.array(z.string()).optional().default([]),
  
  // Totals
  totalWeightLbs: z.number().optional().nullable(),
  totalPieces: z.number().optional().nullable(),
  totalPallets: z.number().optional().nullable(),
  
  // Notes
  specialInstructions: z.string().optional().nullable(),
  
  // AI Confidence & Warnings
  confidence: z.object({
    customer: z.number().min(0).max(100).optional(),
    stops: z.number().min(0).max(100).optional(),
    freightItems: z.number().min(0).max(100).optional(),
    references: z.number().min(0).max(100).optional(),
    dates: z.number().min(0).max(100).optional(),
    overall: z.number().min(0).max(100).optional(),
  }).optional().default({}),
  
  warnings: z.array(z.string()).optional().default([]),
});
export type AIOrderExtraction = z.infer<typeof aiOrderExtractionSchema>;

// ============================================================================
// FORM DEFAULT VALUES FACTORY
// Creates properly typed default values for React Hook Form
// ============================================================================
export function createDefaultOrderInput(): EnterpriseOrderInput {
  return {
    customerId: null,
    customerName: "",
    equipmentType: "Dry Van",
    equipmentLength: 53,
    temperatureSetting: null,
    stops: [
      {
        id: `stop-${Date.now()}-1`,
        stopSequence: 0,
        stopType: "pickup",
        locationName: null,
        streetAddress: null,
        city: "",
        state: null,
        postalCode: null,
        country: "USA",
        appointmentType: "fcfs",
        appointmentStart: null,
        appointmentEnd: null,
        contactName: null,
        contactPhone: null,
        contactEmail: null,
        specialInstructions: null,
        driverInstructions: null,
      },
      {
        id: `stop-${Date.now()}-2`,
        stopSequence: 1,
        stopType: "delivery",
        locationName: null,
        streetAddress: null,
        city: "",
        state: null,
        postalCode: null,
        country: "USA",
        appointmentType: "fcfs",
        appointmentStart: null,
        appointmentEnd: null,
        contactName: null,
        contactPhone: null,
        contactEmail: null,
        specialInstructions: null,
        driverInstructions: null,
      },
    ],
    freightItems: [
      {
        id: `item-${Date.now()}-1`,
        lineNumber: 1,
        commodity: "",
        description: null,
        quantity: 1,
        pieces: 1,
        packagingType: "pallet",
        weightLbs: null,
        lengthIn: null,
        widthIn: null,
        heightIn: null,
        cubicFeet: null,
        freightClass: null,
        nmfcCode: null,
        isHazmat: false,
        hazmatClass: null,
        hazmatUnNumber: null,
        hazmatPackingGroup: null,
        hazmatProperName: null,
        stackable: true,
        temperatureControlled: false,
        tempMinF: null,
        tempMaxF: null,
        declaredValue: null,
        currency: "USD",
      },
    ],
    references: [],
    billing: {
      billToType: "customer",
      billToCustomerId: null,
      billToName: null,
      billToAddress: null,
      billToEmail: null,
      paymentTerms: "NET30",
      invoiceMethod: "email",
      requirePod: true,
      requireBol: true,
    },
    accessorials: [],
    totalWeightLbs: null,
    totalPieces: null,
    totalPallets: null,
    totalCubicFeet: null,
    totalLinearFeet: null,
    isHazmat: false,
    isHighValue: false,
    declaredValue: null,
    specialInstructions: null,
    internalNotes: null,
    priority: "normal",
    sourceChannel: "manual",
    status: "New",
  };
}

// ============================================================================
// UTILITY: Map AI extraction to form input
// ============================================================================
export function mapAIExtractionToFormInput(
  extraction: AIOrderExtraction,
  existing?: Partial<EnterpriseOrderInput>
): Partial<EnterpriseOrderInput> {
  const result: Partial<EnterpriseOrderInput> = { ...existing };
  
  // Customer
  if (extraction.customerName) {
    result.customerName = extraction.customerName;
  }
  
  // Equipment
  if (extraction.equipmentType) {
    result.equipmentType = extraction.equipmentType;
  }
  if (extraction.temperatureSetting) {
    result.temperatureSetting = extraction.temperatureSetting;
  }
  
  // Stops - map to full schema
  if (extraction.stops && extraction.stops.length > 0) {
    result.stops = extraction.stops.map((stop, idx) => ({
      id: `stop-ai-${Date.now()}-${idx}`,
      stopSequence: idx,
      stopType: stop.stopType,
      locationName: stop.locationName || null,
      streetAddress: stop.streetAddress || null,
      city: stop.city,
      state: stop.state || null,
      postalCode: stop.postalCode || null,
      country: stop.country || "USA",
      latitude: null,
      longitude: null,
      appointmentType: stop.appointmentType || "fcfs",
      appointmentStart: stop.appointmentStart || null,
      appointmentEnd: stop.appointmentEnd || null,
      contactName: stop.contactName || null,
      contactPhone: stop.contactPhone || null,
      contactEmail: null,
      specialInstructions: stop.specialInstructions || null,
      driverInstructions: null,
    }));
  }
  
  // Freight Items
  if (extraction.freightItems && extraction.freightItems.length > 0) {
    result.freightItems = extraction.freightItems.map((item, idx) => ({
      id: `item-ai-${Date.now()}-${idx}`,
      lineNumber: idx + 1,
      commodity: item.commodity,
      description: item.description || null,
      quantity: item.quantity || 1,
      pieces: item.pieces || 1,
      packagingType: item.packagingType || "pallet",
      weightLbs: item.weightLbs || null,
      lengthIn: item.lengthIn || null,
      widthIn: item.widthIn || null,
      heightIn: item.heightIn || null,
      cubicFeet: null,
      freightClass: item.freightClass as FreightClass || null,
      nmfcCode: null,
      isHazmat: item.isHazmat || false,
      hazmatClass: item.hazmatClass || null,
      hazmatUnNumber: item.hazmatUnNumber || null,
      hazmatPackingGroup: null,
      hazmatProperName: null,
      stackable: item.stackable ?? true,
      temperatureControlled: item.temperatureControlled || false,
      tempMinF: item.tempMinF || null,
      tempMaxF: item.tempMaxF || null,
      declaredValue: null,
      currency: "USD",
    }));
  }
  
  // References - map string types to enum
  if (extraction.references && extraction.references.length > 0) {
    const referenceTypeMap: Record<string, ReferenceType> = {
      'po': 'PO', 'purchase order': 'PO', 'p.o.': 'PO',
      'bol': 'BOL', 'bill of lading': 'BOL', 'b/l': 'BOL',
      'seal': 'SEAL', 'seal #': 'SEAL', 'seal number': 'SEAL',
      'pro': 'PRO', 'pro #': 'PRO', 'tracking': 'PRO',
      'quote': 'QUOTE', 'quote #': 'QUOTE',
      'so': 'SO', 'sales order': 'SO',
      'invoice': 'INV', 'inv': 'INV',
      'reference': 'REF', 'ref': 'REF', 'ref #': 'REF',
      'booking': 'BOOKING', 'booking #': 'BOOKING',
      'container': 'CONTAINER', 'container #': 'CONTAINER',
      'trailer': 'TRAILER', 'trailer #': 'TRAILER',
      'load': 'LOAD', 'load #': 'LOAD',
      'asn': 'ASN',
      'customs': 'CUSTOMS', 'customs #': 'CUSTOMS',
      'pars': 'PARS', 'pars #': 'PARS',
    };
    
    result.references = extraction.references.map((ref, idx) => {
      const normalizedType = ref.referenceType.toLowerCase();
      const mappedType = referenceTypeMap[normalizedType] || 'REF';
      return {
        id: `ref-ai-${Date.now()}-${idx}`,
        referenceType: mappedType,
        referenceValue: ref.referenceValue,
        description: null,
      };
    });
  }
  
  // Billing
  if (extraction.billToName) {
    result.billing = {
      ...result.billing,
      billToType: "customer",
      billToName: extraction.billToName,
      paymentTerms: (extraction.paymentTerms as PaymentTerms) || "NET30",
      invoiceMethod: "email",
      requirePod: true,
      requireBol: true,
    };
  }
  
  // Accessorials - map string mentions to codes
  if (extraction.accessorials && extraction.accessorials.length > 0) {
    const accessorialMap: Record<string, AccessorialCode> = {
      'liftgate': 'LIFTGATE_DEL',
      'liftgate pickup': 'LIFTGATE_PU',
      'liftgate delivery': 'LIFTGATE_DEL',
      'inside pickup': 'INSIDE_PU',
      'inside delivery': 'INSIDE_DEL',
      'residential': 'RESIDENTIAL',
      'limited access': 'LIMITED_ACCESS',
      'appointment': 'APPOINTMENT',
      'detention': 'DETENTION_DEL',
      'layover': 'LAYOVER',
      'tarp': 'TARP',
      'team': 'TEAM',
      'hazmat': 'HAZMAT',
      'protect from freeze': 'REEFER_PROTECTION',
      'temperature controlled': 'TEMP_CONTROLLED',
      'sort and segregate': 'SORT_SEGREGATE',
      'scale': 'SCALE_TICKET',
      'extra stop': 'EXTRA_STOP',
      'border': 'BORDER_CROSSING',
      'blind': 'BLIND_SHIPMENT',
    };
    
    result.accessorials = extraction.accessorials
      .map((acc, idx) => {
        const normalized = acc.toLowerCase();
        const code = Object.entries(accessorialMap).find(([key]) => 
          normalized.includes(key)
        )?.[1];
        
        if (code) {
          return {
            id: `acc-ai-${Date.now()}-${idx}`,
            accessorialCode: code,
            quantity: 1,
            unitPrice: null,
            notes: null,
          };
        }
        return null;
      })
      .filter((acc): acc is OrderAccessorialInput => acc !== null);
  }
  
  // Totals
  if (extraction.totalWeightLbs) result.totalWeightLbs = extraction.totalWeightLbs;
  if (extraction.totalPieces) result.totalPieces = extraction.totalPieces;
  if (extraction.totalPallets) result.totalPallets = extraction.totalPallets;
  
  // Notes
  if (extraction.specialInstructions) {
    result.specialInstructions = extraction.specialInstructions;
  }
  
  // Check for hazmat
  if (extraction.freightItems?.some(item => item.isHazmat)) {
    result.isHazmat = true;
  }
  
  return result;
}
