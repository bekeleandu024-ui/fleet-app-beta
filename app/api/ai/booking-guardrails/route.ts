import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { orderData } = await request.json();

    const prompt = generateGuardrailsPrompt(orderData);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const guardrails = JSON.parse(content.text);
    return NextResponse.json(guardrails);
  } catch (error) {
    console.error("Error generating booking guardrails:", error);
    return NextResponse.json(
      { error: "Failed to generate guardrails" },
      { status: 500 }
    );
  }
}

function generateGuardrailsPrompt(orderData: any): string {
  const orderJson = JSON.stringify(orderData, null, 2);
  const currentDate = new Date().toISOString().split('T')[0];
  
  return `You are a logistics AI analyzing a transportation order to generate specific booking guardrails. Generate 3-5 critical constraints that must be verified before dispatching this order.

ORDER DATA:
${orderJson}

CURRENT DATE: ${currentDate}

GUARDRAIL RULES:
1. Be SPECIFIC to this order - reference actual details (locations, times, distances, commodity)
2. Focus on critical dispatch blockers or compliance requirements
3. Include customs requirements if cross-border (US↔Canada)
4. Consider time sensitivity if pickup/delivery windows are tight
5. Consider route requirements (distance, hours of service needed)
6. Avoid generic items like "Driver must have valid CDL" - assume basic qualifications

GUARDRAIL CATEGORIES TO CONSIDER:
- Cross-border: FAST card, customs documentation, ACE/ACI clearance required
- Time-critical: Must depart within X hours to meet delivery window
- Route-specific: Requires X+ hours HOS available for Y mile trip
- Commodity: Hazmat endorsement, temperature control, special handling
- Equipment: Specific unit type or certification required
- Documentation: BOL, customs forms, special permits needed

OUTPUT FORMAT:
Return ONLY a JSON array of 3-5 strings, each being a specific guardrail:

[
  "Driver must have FAST card for US-Canada border crossing at Detroit",
  "Unit requires 12+ hours HOS available for 450 mile trip",
  "Customs Form 7533 required for cross-border freight clearance"
]

Generate the guardrails now as a JSON array only (no markdown, no explanation):`;
}
