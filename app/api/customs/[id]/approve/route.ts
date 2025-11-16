import { NextResponse } from "next/server";

import { approveCustomsClearance } from "@/lib/customs-store";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      agentName?: string;
      notes?: string;
    };

    if (!body.agentName || !body.notes?.trim()) {
      return NextResponse.json({ error: "Agent name and notes are required" }, { status: 400 });
    }

    const clearance = approveCustomsClearance(params.id, {
      agentName: body.agentName,
      notes: body.notes.trim(),
    });

    return NextResponse.json(clearance);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to approve customs clearance";
    const status = error instanceof Error && /not found/i.test(error.message) ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
