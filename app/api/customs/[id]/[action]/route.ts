import { NextResponse } from "next/server";

const TRACKING_SERVICE_URL =
  process.env.TRACKING_SERVICE_URL || "http://localhost:4004";

const SUPPORTED_ACTIONS = new Set([
  "documents",
  "submit",
  "assign-agent",
  "approve",
  "reject",
  "clear",
]);

export async function POST(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  if (!SUPPORTED_ACTIONS.has(params.action)) {
    return NextResponse.json({ error: "Unsupported action" }, { status: 404 });
  }

  try {
    const contentType = request.headers.get("content-type");
    const bodyText = await request.text();
    const hasBody = bodyText.length > 0;

    const response = await fetch(
      `${TRACKING_SERVICE_URL}/api/customs/${params.id}/${params.action}`,
      {
        method: "POST",
        headers: hasBody && contentType ? { "Content-Type": contentType } : undefined,
        body: hasBody ? bodyText : undefined,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "Tracking service action error:",
        params.action,
        params.id,
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: `Failed to ${params.action} customs clearance` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Customs Action API Error:", error);
    return NextResponse.json(
      { error: "Failed to connect to tracking service" },
      { status: 500 }
    );
  }
}
