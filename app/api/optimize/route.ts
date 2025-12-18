import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Assuming optimization service runs on port 8000
    const res = await fetch('http://localhost:8000/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
        const error = await res.text();
        return NextResponse.json({ error }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Optimization error:", error);
    return NextResponse.json({ error: "Failed to optimize" }, { status: 500 });
  }
}
