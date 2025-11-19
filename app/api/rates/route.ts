import { NextResponse } from "next/server";

// Mock data for demonstration
const mockRates = [
  {
    id: "r1",
    type: "Company Driver",
    zone: "Short Haul (<500mi)",
    fixedCPM: 0.25,
    wageCPM: 0.45,
    addOnsCPM: 0.10,
    fuelCPM: 0.35,
    truckMaintCPM: 0.15,
    trailerMaintCPM: 0.05,
    rollingCPM: 0.20,
  },
  {
    id: "r2",
    type: "Owner Operator",
    zone: "Short Haul (<500mi)",
    fixedCPM: 0.10,
    wageCPM: 0.95,
    addOnsCPM: 0.15,
    fuelCPM: 0.35,
    truckMaintCPM: 0.08,
    trailerMaintCPM: 0.05,
    rollingCPM: 0.12,
  },
  {
    id: "r3",
    type: "Company Driver",
    zone: "Long Haul (500+ mi)",
    fixedCPM: 0.20,
    wageCPM: 0.50,
    addOnsCPM: 0.12,
    fuelCPM: 0.33,
    truckMaintCPM: 0.14,
    trailerMaintCPM: 0.06,
    rollingCPM: 0.18,
  },
  {
    id: "r4",
    type: "Owner Operator",
    zone: "Long Haul (500+ mi)",
    fixedCPM: 0.08,
    wageCPM: 1.05,
    addOnsCPM: 0.18,
    fuelCPM: 0.33,
    truckMaintCPM: 0.10,
    trailerMaintCPM: 0.06,
    rollingCPM: 0.15,
  },
];

export async function GET() {
  return NextResponse.json(mockRates);
}
