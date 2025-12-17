import { NextResponse } from "next/server";

import { serviceFetch } from "@/lib/service-client";

type RuleRecord = {
  id: string;
  name: string;
  status: string;
  region: string;
  owner: string;
  updated: string;
  value?: string | number;
};

export async function GET() {
  try {
    const payload = await serviceFetch<{ rules?: Array<Record<string, any>> }>("masterData", "/api/metadata/rules");
    const rules = transformRules(payload.rules ?? []);
    return NextResponse.json(buildRuleResponse(rules));
  } catch (error) {
    console.error("Error fetching rules from service", error);
    return NextResponse.json(buildRuleResponse([]));
  }
}

function transformRules(records: Array<Record<string, any>>): RuleRecord[] {
  const idCounts: Record<string, number> = {};

  return records.map((record, index) => {
    const rawId = record.rule_id ?? record.id ?? record.rule_key ?? record.name;
    let id = rawId && String(rawId).trim() !== "" ? String(rawId) : `rule-${index}`;

    if (idCounts[id]) {
      idCounts[id]++;
      id = `${id}_${idCounts[id]}`;
    } else {
      idCounts[id] = 1;
    }

    return {
      id,
      name: record.rule_key ?? record.name ?? "Rule",
      status: record.status ?? (record.is_active === false ? "Draft" : "Active"),
      region: record.region ?? record.rule_type ?? "Network",
      owner: record.owner ?? "Costing",
      updated: new Date(record.updated_at ?? Date.now()).toISOString(),
      value: record.value ?? record.rule_value ?? record.amount ?? record.default_value,
    };
  });
}

function buildRuleResponse(rules: RuleRecord[]) {
  const regions = Array.from(new Set(rules.map((rule) => rule.region))).sort();
  const statuses = Array.from(new Set(rules.map((rule) => rule.status))).sort();

  return {
    filters: {
      regions: ["All", ...regions],
      statuses,
    },
    data: rules,
  };
}

