import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    options: {
      vehicleProfiles: ["53' Dry Van", "53' Reefer", "48' Flat"],
      avoidances: ["Tolls", "Low Bridges", "Ferries"],
    },
    steps: [
      { id: "step-1", sequence: 1, action: "Depart", location: "Dallas, TX", eta: "2024-05-08T05:00:00Z" },
      { id: "step-2", sequence: 2, action: "Fuel", location: "Little Rock, AR", eta: "2024-05-08T13:40:00Z" },
      { id: "step-3", sequence: 3, action: "Driver Change", location: "Birmingham, AL", eta: "2024-05-08T23:50:00Z" },
      { id: "step-4", sequence: 4, action: "Deliver", location: "Atlanta, GA", eta: "2024-05-09T18:30:00Z" },
    ],
    summary: {
      distance: "781 mi",
      eta: "26h 15m",
      costBand: "$3.9k - $4.3k",
    },
  });
}
