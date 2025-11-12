import { NextResponse } from "next/server";

import { formatError } from "@/lib/api-errors";
import { removeTrip } from "@/lib/mock-data-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    removeTrip(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = formatError(error);
    const status = message === "Record not found" ? 404 : 400;
    return NextResponse.json(
      { error: status === 404 ? "Not found" : message },
      { status }
    );
  }
}
