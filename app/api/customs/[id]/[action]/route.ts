import { NextResponse } from "next/server";

import {
  approveCustomsClearance,
  assignCustomsAgent,
  clearCustomsHold,
  rejectCustomsClearance,
  submitCustomsDocuments,
  uploadCustomsDocument,
} from "@/lib/customs-store";

const ACTION_HANDLERS = {
  submit: async (id: string, _request: Request) => submitCustomsDocuments(id),
  clear: async (id: string, _request: Request) => clearCustomsHold(id),
  approve: async (id: string, request: Request) => {
    const body = await request.json();
    if (!body?.agentName) {
      throw new Error("Agent name is required");
    }
    return approveCustomsClearance(id, {
      agentName: body.agentName,
      notes: body.notes ?? "",
    });
  },
  reject: async (id: string, request: Request) => {
    const body = await request.json();
    if (!body?.agentName || !body?.reason) {
      throw new Error("Agent name and reason are required");
    }
    return rejectCustomsClearance(id, {
      agentName: body.agentName,
      reason: body.reason,
    });
  },
  "assign-agent": async (id: string, request: Request) => {
    const body = await request.json();
    if (!body?.agentName) {
      throw new Error("Agent name is required");
    }
    return assignCustomsAgent(id, { agentName: body.agentName });
  },
  documents: async (id: string, request: Request) => {
    const body = await request.json();
    if (!body?.documentType || !body?.documentName) {
      throw new Error("Document type and name are required");
    }
    return uploadCustomsDocument(id, {
      documentType: body.documentType,
      documentName: body.documentName,
    });
  },
} as const;

export async function POST(
  request: Request,
  { params }: { params: { id: string; action: keyof typeof ACTION_HANDLERS } }
) {
  const handler = ACTION_HANDLERS[params.action];

  if (!handler) {
    return NextResponse.json({ error: "Unsupported action" }, { status: 404 });
  }

  try {
    const data = await handler(params.id, request);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Customs Action API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process customs action",
      },
      { status: 400 }
    );
  }
}
