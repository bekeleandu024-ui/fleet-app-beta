import { NextResponse } from "next/server";

// Mock data for demonstration
const mockUnits = [
  { id: "u1", code: "T-1024", type: "53' Dry Van", homeBase: "Windsor, ON", status: "Available", isOnHold: false, active: true, recommended: true },
  { id: "u2", code: "T-1025", type: "53' Reefer", homeBase: "Detroit, MI", status: "Available", isOnHold: false, active: true },
  { id: "u3", code: "T-1026", type: "53' Dry Van", homeBase: "Toronto, ON", status: "Available", isOnHold: false, active: true },
  { id: "u4", code: "T-1027", type: "48' Flatbed", homeBase: "Buffalo, NY", status: "In Service", isOnHold: false, active: true },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";
  const notOnHold = searchParams.get("isOnHold") === "false";

  let units = mockUnits;
  
  if (activeOnly) {
    units = units.filter(u => u.active);
  }
  
  if (notOnHold) {
    units = units.filter(u => !u.isOnHold);
  }

  return NextResponse.json(units);
}
