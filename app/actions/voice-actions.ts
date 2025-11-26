"use server";

import { interpretVoiceCommand } from "@/lib/claude-api";

export async function processVoiceCommand(transcript: string) {
  try {
    const result = await interpretVoiceCommand(transcript);
    return result;
  } catch (error) {
    console.error("Error processing voice command:", error);
    return { eventType: null, confidence: 0 };
  }
}
