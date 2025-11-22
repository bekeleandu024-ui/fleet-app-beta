import { NextResponse } from "next/server";
import { serviceFetch } from "@/lib/service-client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    // Build SQL query
    let sql = "SELECT * FROM business_rules WHERE is_active = true";
    
    if (scope) {
      const scopes = scope.split(",").map(s => `'${s.trim()}'`).join(",");
      sql += ` AND scope IN (${scopes})`;
    }
    
    sql += " ORDER BY severity DESC, rule_key ASC";

    // Fetch from master data service
    const response = await serviceFetch<{ rows?: any[] }>(
      "masterData",
      "/query",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      }
    );

    const rules = response.rows || [];
    
    return NextResponse.json({
      success: true,
      data: rules,
      count: rules.length,
    });
  } catch (error) {
    console.error("Error fetching business rules:", error);
    
    // Return empty array on error instead of failing
    return NextResponse.json({
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : "Failed to fetch business rules",
    });
  }
}

