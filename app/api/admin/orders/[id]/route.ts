import { NextResponse } from "next/server";

import { formatError } from "@/lib/api-errors";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    return NextResponse.json(
      { error: "Order deletion is not supported against live services" },
      { status: 503 }
    );
  } catch (error) {
    const message = formatError(error);
    const status = message === "Record not found" ? 404 : 400;
    return NextResponse.json(
      { error: status === 404 ? "Not found" : message },
      { status }
    );
  }
}
