// Types for AI OCR Order Extraction

/**
 * Equipment configuration extracted from order text
 */
export interface ExtractedEquipment {
  type?: "Dry Van" | "Reefer" | "Flatbed" | "Step Deck" | "Tanker" | "Box Truck" | "Lowboy" | "Double Drop" | "Conestoga" | "Power Only";
  size?: "53'" | "48'" | "26'";
}

/**
 * Location/stop extracted from order text
 */
export interface ExtractedStop {
  stopType?: "pickup" | "delivery";  // For multi-stop orders
  facilityName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: "USA" | "Canada" | "Mexico";
  appointmentDate?: string;      // ISO 8601: YYYY-MM-DD
  appointmentTimeStart?: string; // 24-hour: HH:MM
  appointmentTimeEnd?: string;   // 24-hour: HH:MM
  timezone?: "ET" | "CT" | "MT" | "PT" | "AT";
  contactName?: string;
  contactPhone?: string;
  specialInstructions?: string;
}

/**
 * Freight details extracted from order text
 */
export interface ExtractedFreight {
  commodity?: string;
  weight?: number;
  weightUnit?: "lb" | "kg";
  pallets?: number;
  pieces?: number;
  hazmat?: boolean;
  highValue?: boolean;
  temperature?: number;
  temperatureUnit?: "F" | "C";
  lengthIn?: number;
  widthIn?: number;
  heightIn?: number;
  freightClass?: string;
}

/**
 * Reference number extracted from order text
 */
export interface ExtractedReference {
  type: "PO" | "BOL" | "PRO" | "SEAL" | "REF" | "SO" | "QUOTE" | "LOAD";
  value: string;
}

/**
 * Accessorial service types
 */
export type AccessorialType = 
  | "Liftgate Pickup"
  | "Liftgate Delivery"
  | "Residential Pickup"
  | "Residential Delivery"
  | "Inside Pickup"
  | "Inside Delivery"
  | "Appointment Required"
  | "Driver Assist"
  | "Hazmat"
  | "Team Required"
  | "Tarping"
  | "Tracking Updates"
  | "Detention"
  | "Layover";

/**
 * Complete extracted order data from AI
 */
export interface ExtractedOrder {
  // Customer & Equipment
  customer?: string;
  equipment?: ExtractedEquipment;

  // Locations - support both legacy single pickup/delivery AND multi-stop
  pickup?: ExtractedStop;      // Legacy: single pickup
  delivery?: ExtractedStop;    // Legacy: single delivery
  stops?: ExtractedStop[];     // Multi-stop: array of all stops for multi-pick/multi-drop

  // Freight
  freight?: ExtractedFreight;

  // References
  references?: ExtractedReference[];

  // Pricing
  quotedRate?: number;
  rateType?: "flat" | "per_mile";

  // Service
  serviceType?: "Standard" | "Direct" | "Expedited";
  source?: string;

  // Accessorials
  accessorials?: AccessorialType[];

  // Instructions
  specialInstructions?: string;
}

/**
 * Callback for progressive field updates during streaming
 */
export type FieldUpdateCallback = (path: string, value: unknown) => void;

/**
 * Extraction state for the hook
 */
export interface ExtractionState {
  isExtracting: boolean;
  extractedFields: Set<string>;
  error: string | null;
  progress: number; // 0-100
}

/**
 * Mapping from extracted fields to form field paths
 */
export const FIELD_PATH_MAPPINGS: Record<string, string> = {
  // Customer
  customer: "customerName",
  
  // Equipment
  "equipment.type": "equipmentType",
  "equipment.size": "equipmentLength",
  
  // Pickup stop (index 0)
  "pickup.facilityName": "stops.0.locationName",
  "pickup.streetAddress": "stops.0.streetAddress",
  "pickup.city": "stops.0.city",
  "pickup.state": "stops.0.state",
  "pickup.zip": "stops.0.postalCode",
  "pickup.country": "stops.0.country",
  "pickup.contactName": "stops.0.contactName",
  "pickup.contactPhone": "stops.0.contactPhone",
  "pickup.specialInstructions": "stops.0.specialInstructions",
  
  // Delivery stop (index 1)
  "delivery.facilityName": "stops.1.locationName",
  "delivery.streetAddress": "stops.1.streetAddress",
  "delivery.city": "stops.1.city",
  "delivery.state": "stops.1.state",
  "delivery.zip": "stops.1.postalCode",
  "delivery.country": "stops.1.country",
  "delivery.contactName": "stops.1.contactName",
  "delivery.contactPhone": "stops.1.contactPhone",
  "delivery.specialInstructions": "stops.1.specialInstructions",
  
  // Freight (first item)
  "freight.commodity": "freightItems.0.commodity",
  "freight.weight": "freightItems.0.weightLbs",
  "freight.pallets": "freightItems.0.quantity",
  "freight.pieces": "freightItems.0.pieces",
  "freight.hazmat": "freightItems.0.isHazmat",
  "freight.temperature": "temperatureSetting",
  "freight.lengthIn": "freightItems.0.lengthIn",
  "freight.widthIn": "freightItems.0.widthIn",
  "freight.heightIn": "freightItems.0.heightIn",
  "freight.freightClass": "freightItems.0.freightClass",
  
  // Pricing
  quotedRate: "pricing.quotedRate",
  
  // Instructions
  specialInstructions: "specialInstructions",
};

/**
 * Convert equipment size string to number
 */
export function parseEquipmentSize(size?: string): number | undefined {
  if (!size) return undefined;
  const match = size.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Convert extracted country to form format
 */
export function normalizeCountry(country?: string): "USA" | "CAN" | "MEX" {
  if (!country) return "USA";
  const upper = country.toUpperCase();
  if (upper.includes("CANADA") || upper === "CAN") return "CAN";
  if (upper.includes("MEXICO") || upper === "MEX") return "MEX";
  return "USA";
}
