import { NextResponse } from "next/server";

import { getCustomsClearance } from "@/lib/customs-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clearance = getCustomsClearance(id);

  if (!clearance) {
    return NextResponse.json(
      { error: "Customs clearance not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(clearance);
}
