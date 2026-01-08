/**
 * Streaming API Route for AI Order Extraction
 * 
 * Uses Claude Haiku with tool_use for fast, structured extraction.
 * Supports streaming for progressive field population.
 */

import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  EXTRACTION_MODEL,
  MAX_TOKENS,
  ORDER_EXTRACTION_TOOL,
  EXTRACTION_SYSTEM_PROMPT,
} from "@/app/orders/new/enterprise/lib/orderExtraction";

// Initialize Anthropic client
const anthropic = new Anthropic();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExtractOrderRequest {
  text?: string;
  image?: string; // Base64 encoded image
  stream?: boolean;
}

/**
 * POST /api/ai/extract-order-streaming
 * 
 * Extracts order details from text or image using Claude Haiku.
 * Returns streamed response for progressive field population.
 */
export async function POST(request: NextRequest) {
  try {
    const body: ExtractOrderRequest = await request.json();
    const { text, image, stream = true } = body;

    if (!text && !image) {
      return new Response(
        JSON.stringify({ error: "No text or image provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build message content
    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    if (image) {
      // Handle base64 image
      let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
      let imageData = image;

      if (image.includes(";base64,")) {
        const parts = image.split(";base64,");
        const mimeType = parts[0].replace("data:", "");
        if (["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType)) {
          mediaType = mimeType as typeof mediaType;
        }
        imageData = parts[1];
      }

      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: imageData,
        },
      });
      content.push({
        type: "text",
        text: "Extract all order details from this image.",
      });
    } else if (text) {
      content.push({
        type: "text",
        text: `Extract all order details from this message:\n\n${text}`,
      });
    }

    // Streaming response
    if (stream) {
      const encoder = new TextEncoder();
      
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const messageStream = await anthropic.messages.stream({
              model: EXTRACTION_MODEL,
              max_tokens: MAX_TOKENS,
              system: EXTRACTION_SYSTEM_PROMPT,
              messages: [{ role: "user", content }],
              tools: [ORDER_EXTRACTION_TOOL as Anthropic.Tool],
              tool_choice: { type: "tool", name: "fill_order_form" },
            });

            let accumulatedJson = "";

            for await (const event of messageStream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "input_json_delta"
              ) {
                accumulatedJson += event.delta.partial_json;
                
                // Send partial JSON as SSE
                const sseData = `data: ${JSON.stringify({
                  type: "partial",
                  json: accumulatedJson,
                })}\n\n`;
                controller.enqueue(encoder.encode(sseData));
              }
            }

            // Get final complete response
            const finalMessage = await messageStream.finalMessage();
            const toolUse = finalMessage.content.find(
              (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
            );

            if (toolUse) {
              const completeData = `data: ${JSON.stringify({
                type: "complete",
                data: toolUse.input,
              })}\n\n`;
              controller.enqueue(encoder.encode(completeData));
            } else {
              const errorData = `data: ${JSON.stringify({
                type: "error",
                error: "No tool use response",
              })}\n\n`;
              controller.enqueue(encoder.encode(errorData));
            }

            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            const errorData = `data: ${JSON.stringify({
              type: "error",
              error: errorMessage,
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response (fallback)
    const response = await anthropic.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: MAX_TOKENS,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
      tools: [ORDER_EXTRACTION_TOOL as Anthropic.Tool],
      tool_choice: { type: "tool", name: "fill_order_form" },
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolUse) {
      return new Response(
        JSON.stringify({ error: "Failed to extract order details" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: toolUse.input }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Order extraction error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
