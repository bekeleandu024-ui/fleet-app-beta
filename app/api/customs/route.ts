import { NextResponse } from "next/server";

import { listCustomsClearances } from "@/lib/customs-store";

export async function GET() {
  const data = listCustomsClearances();
  return NextResponse.json(data);
}
