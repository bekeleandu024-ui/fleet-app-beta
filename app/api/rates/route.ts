import { NextResponse } from "next/server";

// Mock data for demonstration
const mockRates = [
  {
    id: "r1",
    rate_type: "Company Driver",
    zone: "Short Haul (<500mi)",
    fixed_cpm: 0.25,
    wage_cpm: 0.45,
    addons_cpm: 0.10,
    fuel_cpm: 0.35,
    truck_maint_cpm: 0.15,
    trailer_maint_cpm: 0.05,
    rolling_cpm: 0.20,
  },
  {
    id: "r2",
    rate_type: "Owner Operator",
    zone: "Short Haul (<500mi)",
    fixed_cpm: 0.10,
    wage_cpm: 0.95,
    addons_cpm: 0.15,
    fuel_cpm: 0.35,
    truck_maint_cpm: 0.08,
    trailer_maint_cpm: 0.05,
    rolling_cpm: 0.12,
  },
  {
    id: "r3",
    rate_type: "Company Driver",
    zone: "Long Haul (500+ mi)",
    fixed_cpm: 0.20,
    wage_cpm: 0.50,
    addons_cpm: 0.12,
    fuel_cpm: 0.33,
    truck_maint_cpm: 0.14,
    trailer_maint_cpm: 0.06,
    rolling_cpm: 0.18,
  },
  {
    id: "r4",
    rate_type: "Owner Operator",
    zone: "Long Haul (500+ mi)",
    fixed_cpm: 0.08,
    wage_cpm: 1.05,
    addons_cpm: 0.18,
    fuel_cpm: 0.33,
    truck_maint_cpm: 0.10,
    trailer_maint_cpm: 0.06,
    rolling_cpm: 0.15,
  },
];

export async function GET() {
  // Calculate total_cpm for each rate
  const ratesWithTotal = mockRates.map(rate => ({
    ...rate,
    total_cpm: 
      rate.fixed_cpm + 
      rate.wage_cpm + 
      rate.addons_cpm + 
      rate.fuel_cpm + 
      rate.truck_maint_cpm + 
      rate.trailer_maint_cpm + 
      rate.rolling_cpm,
  }));

  return NextResponse.json(ratesWithTotal);
}
