// AI Order Extraction Tool Schema and Configuration
// Uses Claude Haiku with tool_use for fast, structured extraction

import type { ExtractedOrder } from "../types/extraction";

/**
 * Haiku model - fastest, optimal for structured extraction
 */
export const EXTRACTION_MODEL = "claude-haiku-4-5-20251001";

/**
 * Minimal token count for structured output
 */
export const MAX_TOKENS = 2048; // Increased for multi-stop orders

/**
 * Stop schema - reusable for single and multi-stop
 */
const STOP_SCHEMA = {
  type: "object",
  properties: {
    stopType: {
      type: "string",
      enum: ["pickup", "delivery"],
      description: "Type of stop - pickup or delivery",
    },
    facilityName: { type: "string", description: "Facility/warehouse name" },
    streetAddress: { type: "string", description: "Full street address (e.g., '300 Franklin Blvd')" },
    city: { type: "string", description: "City name" },
    state: { type: "string", description: "2-letter state/province code (e.g., ON, IL, OH)" },
    zip: { type: "string", description: "ZIP/postal code" },
    country: { type: "string", enum: ["USA", "Canada", "Mexico"], description: "Country" },
    appointmentDate: { type: "string", description: "Date in YYYY-MM-DD format" },
    appointmentTimeStart: { type: "string", description: "Start time HH:MM 24-hour format" },
    appointmentTimeEnd: { type: "string", description: "End time HH:MM 24-hour format" },
    timezone: { type: "string", enum: ["ET", "CT", "MT", "PT", "AT"] },
    contactName: { type: "string", description: "Contact person name" },
    contactPhone: { type: "string", description: "Contact phone number" },
    specialInstructions: { type: "string" },
  },
};

/**
 * Tool definition for structured order extraction
 * Using tool_use forces Claude to output valid structured data
 * Much faster than asking for JSON in prose
 */
export const ORDER_EXTRACTION_TOOL: {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
} = {
  name: "fill_order_form",
  description: "Extract and fill order form fields from the provided text or image. Supports multi-pick and multi-drop orders.",
  input_schema: {
    type: "object",
    properties: {
      // Customer & Equipment
      customer: {
        type: "string",
        description: "Customer or company name (shipper)",
      },
      equipment: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["Dry Van", "Reefer", "Flatbed", "Step Deck", "Tanker", "Box Truck", "Lowboy", "Double Drop", "Conestoga", "Power Only"],
            description: "Equipment/trailer type",
          },
          size: {
            type: "string",
            enum: ["53'", "48'", "26'"],
            description: "Trailer length",
          },
        },
      },

      // MULTI-STOP SUPPORT: Array of all stops in sequence
      stops: {
        type: "array",
        description: "All stops in sequence for multi-pick or multi-drop orders. Include ALL pickups first, then deliveries.",
        items: STOP_SCHEMA,
      },

      // Legacy single pickup (for simple orders - AI can use either stops[] or pickup/delivery)
      pickup: {
        ...STOP_SCHEMA,
        description: "Single pickup location (for simple orders). For multi-pick, use 'stops' array instead.",
      },

      // Legacy single delivery
      delivery: {
        ...STOP_SCHEMA,
        description: "Single delivery location (for simple orders). For multi-drop, use 'stops' array instead.",
      },

      // Freight Details
      freight: {
        type: "object",
        properties: {
          commodity: { type: "string", description: "Description of goods" },
          weight: { type: "number", description: "Total weight" },
          weightUnit: { type: "string", enum: ["lb", "kg"], default: "lb" },
          pallets: { type: "number", description: "Number of pallets" },
          pieces: { type: "number", description: "Number of pieces/units" },
          hazmat: { type: "boolean", default: false },
          highValue: { type: "boolean", default: false },
          temperature: {
            type: "number",
            description: "Required temp for reefer loads",
          },
          temperatureUnit: { type: "string", enum: ["F", "C"] },
          lengthIn: { type: "number", description: "Length in inches" },
          widthIn: { type: "number", description: "Width in inches" },
          heightIn: { type: "number", description: "Height in inches" },
          freightClass: { type: "string", description: "Freight class (50-500)" },
        },
      },

      // Reference Numbers
      references: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["PO", "BOL", "PRO", "SEAL", "REF", "SO", "QUOTE", "LOAD"],
              description: "Reference type",
            },
            value: { type: "string", description: "Reference value/number" },
          },
          required: ["type", "value"],
        },
      },

      // Pricing
      quotedRate: { type: "number", description: "Quoted rate in dollars" },
      rateType: { type: "string", enum: ["flat", "per_mile"] },

      // Service
      serviceType: {
        type: "string",
        enum: ["Standard", "Direct", "Expedited"],
      },
      source: {
        type: "string",
        description: "Order source (Portal, Email, EDI, Phone, etc.)",
      },

      // Accessorials
      accessorials: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "Liftgate Pickup",
            "Liftgate Delivery",
            "Residential Pickup",
            "Residential Delivery",
            "Inside Pickup",
            "Inside Delivery",
            "Appointment Required",
            "Driver Assist",
            "Hazmat",
            "Team Required",
            "Tarping",
            "Tracking Updates",
            "Detention",
            "Layover",
          ],
        },
      },

      // Special Instructions
      specialInstructions: {
        type: "string",
        description: "Any special requirements, notes, or instructions",
      },
    },
    required: [] as string[],  // No required fields - extract what's available
  },
};

/**
 * System prompt - concise but with key parsing rules
 */
export const EXTRACTION_SYSTEM_PROMPT = `Extract ALL order details from the text. Use the fill_order_form tool.

IMPORTANT RULES:
- Today is ${new Date().toISOString().split("T")[0]}
- Parse dates to YYYY-MM-DD format (e.g., "Jan 6, 2026" → "2026-01-06")
- Parse times to HH:MM 24-hour format (e.g., "7:30 AM" → "07:30", "4:00 PM" → "16:00")
- Extract FULL street addresses (e.g., "300 Franklin Blvd", "2800 Commerce Drive")
- Convert weights: "34,600 lb" → 34600, "40k" → 40000
- Detect country from postal codes: Canadian (N1R 8E2) → "Canada", US ZIP (43615) → "USA"
- Extract ALL reference numbers (PO#, BOL#, etc.)
- Extract quoted rate as number (e.g., "$1,040.00" → 1040)

MULTI-STOP ORDERS:
- If order has multiple pickups OR multiple deliveries, use the "stops" array
- Add each stop with stopType: "pickup" or "delivery"
- Keep stops in SEQUENCE order (first pickup, second pickup, then delivery, etc.)
- For simple 1-pickup 1-delivery orders, you can use either stops[] or pickup/delivery fields`;


/**
 * Parse completed fields from partial JSON stream
 * Used for progressive field population during streaming
 */
export function parseCompletedFields(partialJson: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  // Match: "key": "string value" (completed strings)
  const stringPattern = /"([a-zA-Z_]+)":\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  let match;

  while ((match = stringPattern.exec(partialJson)) !== null) {
    fields[match[1]] = match[2];
  }

  // Match: "key": number (completed numbers)
  const numberPattern = /"([a-zA-Z_]+)":\s*(-?\d+(?:\.\d+)?)\s*[,}\]]/g;
  while ((match = numberPattern.exec(partialJson)) !== null) {
    fields[match[1]] = parseFloat(match[2]);
  }

  // Match: "key": true/false (completed booleans)
  const boolPattern = /"([a-zA-Z_]+)":\s*(true|false)\s*[,}\]]/g;
  while ((match = boolPattern.exec(partialJson)) !== null) {
    fields[match[1]] = match[2] === "true";
  }

  return fields;
}

/**
 * Check if text looks like an order request
 * Used to auto-trigger extraction on paste
 */
export function looksLikeOrderRequest(text: string): boolean {
  const orderIndicators = [
    /pick\s*up/i,
    /deliver/i,
    /freight/i,
    /pallet/i,
    /lb|lbs|pound/i,
    /dry\s*van|reefer|flatbed/i,
    /PO[-\s]|BOL|PRO/i,
    /appointment/i,
    /quoted?\s*rate/i,
    /shipper|consignee/i,
    /origin|destination/i,
  ];

  const matchCount = orderIndicators.filter((pattern) =>
    pattern.test(text)
  ).length;
  return matchCount >= 3;
}

/**
 * Map extracted order data to form input structure
 */
export function mapExtractedToFormData(
  extracted: ExtractedOrder,
  currentData: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...currentData };

  // Customer
  if (extracted.customer) {
    result.customerName = extracted.customer;
  }

  // Equipment
  if (extracted.equipment?.type) {
    result.equipmentType = extracted.equipment.type;
  }
  if (extracted.equipment?.size) {
    const sizeMatch = extracted.equipment.size.match(/(\d+)/);
    if (sizeMatch) {
      result.equipmentLength = parseInt(sizeMatch[1], 10);
    }
  }

  // Temperature setting for reefer
  if (extracted.freight?.temperature != null) {
    const unit = extracted.freight.temperatureUnit || "F";
    result.temperatureSetting = `${extracted.freight.temperature}°${unit}`;
  }

  // Build stops array - prioritize multi-stop "stops" array over legacy pickup/delivery
  const formStops: Array<Record<string, unknown>> = [];
  
  if (extracted.stops && extracted.stops.length > 0) {
    // Multi-stop order - use the stops array
    extracted.stops.forEach((stop, idx) => {
      formStops.push({
        id: `stop-${Date.now()}-${idx}`,
        stopSequence: idx,
        stopType: stop.stopType || (idx === extracted.stops!.length - 1 ? "delivery" : "pickup"),
        locationName: stop.facilityName || null,
        streetAddress: stop.streetAddress || null,
        city: stop.city || "",
        state: stop.state || null,
        postalCode: stop.zip || null,
        country: normalizeCountryCode(stop.country),
        contactName: stop.contactName || null,
        contactPhone: stop.contactPhone || null,
        contactEmail: null,
        specialInstructions: stop.specialInstructions || null,
        driverInstructions: null,
        appointmentType: "fcfs",
        appointmentStart: formatAppointment(stop.appointmentDate, stop.appointmentTimeStart),
        appointmentEnd: formatAppointment(stop.appointmentDate, stop.appointmentTimeEnd),
        latitude: null,
        longitude: null,
      });
    });
  } else {
    // Legacy single pickup/delivery
    if (extracted.pickup) {
      const p = extracted.pickup;
      formStops.push({
        id: `stop-${Date.now()}-0`,
        stopSequence: 0,
        stopType: "pickup",
        locationName: p.facilityName || null,
        streetAddress: p.streetAddress || null,
        city: p.city || "",
        state: p.state || null,
        postalCode: p.zip || null,
        country: normalizeCountryCode(p.country),
        contactName: p.contactName || null,
        contactPhone: p.contactPhone || null,
        contactEmail: null,
        specialInstructions: p.specialInstructions || null,
        driverInstructions: null,
        appointmentType: "fcfs",
        appointmentStart: formatAppointment(p.appointmentDate, p.appointmentTimeStart),
        appointmentEnd: formatAppointment(p.appointmentDate, p.appointmentTimeEnd),
        latitude: null,
        longitude: null,
      });
    }

    if (extracted.delivery) {
      const d = extracted.delivery;
      formStops.push({
        id: `stop-${Date.now()}-1`,
        stopSequence: formStops.length,
        stopType: "delivery",
        locationName: d.facilityName || null,
        streetAddress: d.streetAddress || null,
        city: d.city || "",
        state: d.state || null,
        postalCode: d.zip || null,
        country: normalizeCountryCode(d.country),
        contactName: d.contactName || null,
        contactPhone: d.contactPhone || null,
        contactEmail: null,
        specialInstructions: d.specialInstructions || null,
        driverInstructions: null,
        appointmentType: "fcfs",
        appointmentStart: formatAppointment(d.appointmentDate, d.appointmentTimeStart),
        appointmentEnd: formatAppointment(d.appointmentDate, d.appointmentTimeEnd),
        latitude: null,
        longitude: null,
      });
    }
  }

  if (formStops.length > 0) {
    result.stops = formStops;
  }

  // Freight items
  if (extracted.freight) {
    const items = (currentData.freightItems as Array<Record<string, unknown>>) || [];
    const firstItem = items[0] || {};
    const f = extracted.freight;
    
    items[0] = {
      ...firstItem,
      commodity: f.commodity || firstItem.commodity,
      weightLbs: f.weight || firstItem.weightLbs,
      quantity: f.pallets || firstItem.quantity,
      pieces: f.pieces || firstItem.pieces,
      isHazmat: f.hazmat ?? firstItem.isHazmat,
      lengthIn: f.lengthIn || firstItem.lengthIn,
      widthIn: f.widthIn || firstItem.widthIn,
      heightIn: f.heightIn || firstItem.heightIn,
      freightClass: f.freightClass || firstItem.freightClass,
    };
    
    result.freightItems = items;

    // Total aggregates
    if (f.weight) result.totalWeightLbs = f.weight;
    if (f.pallets) result.totalPallets = f.pallets;
    if (f.pieces) result.totalPieces = f.pieces;
  }

  // References
  if (extracted.references?.length) {
    result.references = extracted.references.map((ref) => ({
      referenceType: ref.type,
      referenceValue: ref.value,
    }));
  }

  // Pricing - quotedRate is at top level, not nested
  if (extracted.quotedRate) {
    result.quotedRate = extracted.quotedRate;
  }

  // Service type - map to isDirect flag
  if (extracted.serviceType) {
    const st = extracted.serviceType.toLowerCase();
    result.isDirect = st === "direct" || st === "expedited";
  }

  // Source - map to sourceChannel enum
  if (extracted.source) {
    const src = extracted.source.toLowerCase();
    if (src.includes("portal")) result.sourceChannel = "portal";
    else if (src.includes("email")) result.sourceChannel = "email";
    else if (src.includes("phone")) result.sourceChannel = "phone";
    else if (src.includes("edi")) result.sourceChannel = "edi";
    else if (src.includes("api")) result.sourceChannel = "api";
    else result.sourceChannel = "manual";
  }

  // Accessorials - convert to accessorial input format
  if (extracted.accessorials?.length) {
    result.accessorials = extracted.accessorials.map((acc, idx) => ({
      id: `acc-${Date.now()}-${idx}`,
      accessorialCode: mapAccessorialCode(acc),
      quantity: 1,
      unitPrice: null, // Will use default from accessorial type
      notes: null,
    })).filter(a => a.accessorialCode); // Only include valid codes
  }

  // Special instructions
  if (extracted.specialInstructions) {
    result.specialInstructions = extracted.specialInstructions;
  }

  return result;
}

/**
 * Map accessorial name to valid AccessorialCode enum value
 */
function mapAccessorialCode(name: string): string | null {
  const normalized = name.toLowerCase();
  
  // Map common variations to valid AccessorialCode values
  if (normalized.includes("liftgate") && normalized.includes("pickup")) return "LIFTGATE_PU";
  if (normalized.includes("liftgate") && normalized.includes("delivery")) return "LIFTGATE_DEL";
  if (normalized.includes("liftgate")) return "LIFTGATE_DEL"; // Default to delivery
  
  if (normalized.includes("inside") && normalized.includes("pickup")) return "INSIDE_PU";
  if (normalized.includes("inside") && normalized.includes("delivery")) return "INSIDE_DEL";
  if (normalized.includes("inside")) return "INSIDE_DEL"; // Default to delivery
  
  if (normalized.includes("residential")) return "RESIDENTIAL";
  if (normalized.includes("limited") || normalized.includes("difficult")) return "LIMITED_ACCESS";
  if (normalized.includes("appointment")) return "APPOINTMENT";
  
  if (normalized.includes("detention") && normalized.includes("pickup")) return "DETENTION_PU";
  if (normalized.includes("detention") && normalized.includes("delivery")) return "DETENTION_DEL";
  if (normalized.includes("detention")) return "DETENTION_DEL";
  
  if (normalized.includes("layover")) return "LAYOVER";
  if (normalized.includes("tarp")) return "TARP";
  if (normalized.includes("team")) return "TEAM";
  if (normalized.includes("hazmat")) return "HAZMAT";
  if (normalized.includes("freeze") || normalized.includes("reefer")) return "REEFER_PROTECTION";
  if (normalized.includes("temp")) return "TEMP_CONTROLLED";
  if (normalized.includes("sort") || normalized.includes("segregate")) return "SORT_SEGREGATE";
  if (normalized.includes("scale")) return "SCALE_TICKET";
  if (normalized.includes("stop") || normalized.includes("extra")) return "EXTRA_STOP";
  if (normalized.includes("border") || normalized.includes("crossing")) return "BORDER_CROSSING";
  if (normalized.includes("blind")) return "BLIND_SHIPMENT";
  
  // Return null for unrecognized accessorials (filtered out)
  return null;
}

/**
 * Normalize country to 3-letter code
 */
function normalizeCountryCode(country?: string): string {
  if (!country) return "USA";
  const upper = country.toUpperCase();
  if (upper.includes("CANADA") || upper === "CAN") return "CAN";
  if (upper.includes("MEXICO") || upper === "MEX") return "MEX";
  return "USA";
}

/**
 * Format appointment datetime for form input
 */
function formatAppointment(date?: string, time?: string): string | null {
  if (!date) return null;
  const timeStr = time || "00:00";
  // Return in datetime-local format: YYYY-MM-DDTHH:mm
  return `${date}T${timeStr}`;
}
