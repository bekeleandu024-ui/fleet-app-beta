import { NextRequest, NextResponse } from "next/server";
import { chatWithFleetAI } from "@/lib/fleet-ai";

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const response = await chatWithFleetAI({
      message,
      conversationHistory: conversationHistory || [],
      context
    });

    // Detect metadata type based on content
    let metadata = { type: "insight" };
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes("recommend") || lowerResponse.includes("suggest")) {
      metadata.type = "recommendation";
    } else if (lowerResponse.includes("warning") || lowerResponse.includes("risk") || lowerResponse.includes("alert")) {
      metadata.type = "alert";
    } else if (lowerResponse.includes("done") || lowerResponse.includes("completed") || lowerResponse.includes("assigned")) {
      metadata.type = "action";
    }

    return NextResponse.json({
      response,
      metadata
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat message" },
      { status: 500 }
    );
  }
}
