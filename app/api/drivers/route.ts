import { NextResponse } from "next/server";

// Mock data for demonstration
const mockDrivers = [
  { id: "d1", name: "Adrian Radu", homeBase: "Windsor, ON", hoursAvailableToday: 10, onTimeScore: 98, active: true, recommended: true },
  { id: "d2", name: "Carlos Mendez", homeBase: "Detroit, MI", hoursAvailableToday: 8, onTimeScore: 95, active: true },
  { id: "d3", name: "Sarah Chen", homeBase: "Toronto, ON", hoursAvailableToday: 11, onTimeScore: 97, active: true },
  { id: "d4", name: "Michael Torres", homeBase: "Buffalo, NY", hoursAvailableToday: 9, onTimeScore: 92, active: true },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";

  let drivers = mockDrivers;
  
  if (activeOnly) {
    drivers = drivers.filter(d => d.active);
  }

  return NextResponse.json(drivers);
}
