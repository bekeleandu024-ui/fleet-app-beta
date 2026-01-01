import { NextRequest, NextResponse } from "next/server";
import {
  parseOrderOCR,
  parseEnterpriseOrderOCR,
  suggestOrderFields,
  validateOrder,
  chatWithOrderAssistant,
} from "@/lib/claude-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "parse-ocr":
        const parsed = await parseOrderOCR(data.text, data.image);
        return NextResponse.json({ success: true, data: parsed });

      case "parse-ocr-enterprise":
        const enterpriseParsed = await parseEnterpriseOrderOCR(data.text, data.image);
        return NextResponse.json({ success: true, data: enterpriseParsed });

      case "suggest-fields":
        const suggestions = await suggestOrderFields(
          data.partialOrder,
          data.historicalOrders || []
        );
        return NextResponse.json({ success: true, data: suggestions });

      case "validate":
        const validation = await validateOrder(data.order);
        return NextResponse.json({ success: true, data: validation });

      case "chat":
        const response = await chatWithOrderAssistant(data.message, {
          currentOrder: data.currentOrder,
          conversationHistory: data.history,
        });
        return NextResponse.json({ success: true, data: { response } });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("AI Assistant error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

