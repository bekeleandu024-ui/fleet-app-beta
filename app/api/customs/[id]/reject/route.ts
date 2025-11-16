import { NextResponse } from "next/server";

import { rejectCustomsClearance } from "@/lib/customs-store";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      agentName?: string;
      reason?: string;
    };

    if (!body.agentName || !body.reason?.trim()) {
      return NextResponse.json({ error: "Agent name and rejection reason are required" }, { status: 400 });
    }

    const clearance = rejectCustomsClearance(params.id, {
      agentName: body.agentName,
      reason: body.reason.trim(),
    });

    return NextResponse.json(clearance);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reject customs clearance";
    const status = error instanceof Error && /not found/i.test(error.message) ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
