import { NextResponse } from "next/server";

import { listRules } from "@/lib/mock-data-store";

export async function GET() {
  const rules = listRules();
  const regions = Array.from(new Set(rules.map((rule) => rule.region))).sort();
  const statuses = Array.from(new Set(rules.map((rule) => rule.status))).sort();

  return NextResponse.json({
    filters: {
      regions: ["All", ...regions],
      statuses,
    },
    data: rules,
  });
}
