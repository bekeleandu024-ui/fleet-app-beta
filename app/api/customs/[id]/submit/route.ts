import { NextResponse } from "next/server";

import { submitCustomsDocuments } from "@/lib/customs-store";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clearance = submitCustomsDocuments(params.id);
    return NextResponse.json(clearance);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit customs documents";
    const status = error instanceof Error && /not found/i.test(error.message) ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
