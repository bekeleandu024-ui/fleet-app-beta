"use client";

import { ChevronRight, DollarSign, Clock } from "lucide-react";
import clsx from "clsx";
import { darkERPTheme } from "@/app/lib/theme-config";

interface Insight {
  id: string;
  severity: "breach" | "risk" | "watch" | "info";
  title: string;
  description: string;
  impact: {
    type: "cost" | "time";
    value: string;
  };
  confidence: "low" | "medium" | "high";
  confidencePercent: number;
  action: {
    label: string;
    onClick: () => void;
  };
}

interface ActionCenterProps {
  onOpenDetails: (insightId: string) => void;
}

export default function ActionCenter({ onOpenDetails }: ActionCenterProps) {
  // Mock insights grouped by severity
  const insights: Insight[] = [
    {
      id: "1",
      severity: "breach",
      title: "HOS risk in 2h (Trip #1234)",
      description: "Predicted 14m over. Impact: ETA +25m. Next best action: reassign to Driver Sarah.",
      impact: { type: "time", value: "+25m" },
      confidence: "high",
      confidencePercent: 92,
      action: {
        label: "Reassign",
        onClick: () => console.log("Reassigning driver"),
      },
    },
    {
      id: "2",
      severity: "risk",
      title: "Cost variance detected (Trip #5678)",
      description: "Trip cost 23% above lane average. Review fuel charges and tolls.",
      impact: { type: "cost", value: "+$385" },
      confidence: "high",
      confidencePercent: 87,
      action: {
        label: "Review variance",
        onClick: () => console.log("Reviewing variance"),
      },
    },
    {
      id: "3",
      severity: "watch",
      title: "Optimization available (Order #9012)",
      description: "Reassign to Driver Mike for $150 savings. On-time delivery maintained.",
      impact: { type: "cost", value: "-$150" },
      confidence: "medium",
      confidencePercent: 78,
      action: {
        label: "Apply fix",
        onClick: () => console.log("Applying optimization"),
      },
    },
    {
      id: "4",
      severity: "info",
      title: "Market rate update",
      description: "Toronto-Chicago lane rates up 12% this week. Consider pricing adjustments.",
      impact: { type: "cost", value: "+12%" },
      confidence: "high",
      confidencePercent: 94,
      action: {
        label: "Review pricing",
        onClick: () => console.log("Reviewing pricing"),
      },
    },
  ];

  // Group insights by severity
  const groupedInsights = {
    breach: insights.filter((i) => i.severity === "breach"),
    risk: insights.filter((i) => i.severity === "risk"),
    watch: insights.filter((i) => i.severity === "watch"),
    info: insights.filter((i) => i.severity === "info"),
  };

  const getSeverityConfig = (severity: Insight["severity"]) => {
    switch (severity) {
      case "breach":
        return {
          label: "Breach",
          color: darkERPTheme.severity.breach,
        };
      case "risk":
        return {
          label: "Risk",
          color: darkERPTheme.severity.risk,
        };
      case "watch":
        return {
          label: "Watch",
          color: darkERPTheme.severity.watch,
        };
      case "info":
        return {
          label: "Info",
          color: darkERPTheme.brandAccent,
        };
    }
  };

  const getConfidenceLabel = (confidence: Insight["confidence"]) => {
    switch (confidence) {
      case "low":
        return "Low";
      case "medium":
        return "Med";
      case "high":
        return "High";
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-base font-semibold text-foreground">
          Action Center
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Optimization Insights
        </p>
      </div>

      {/* Insights by severity */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedInsights).map(
          ([severity, items]) =>
            items.length > 0 && (
              <div
                key={severity}
                className="border-b border-border p-4"
              >
                {/* Severity header */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: getSeverityConfig(severity as Insight["severity"]).color }}
                  >
                    {getSeverityConfig(severity as Insight["severity"]).label} ({items.length})
                  </span>
                </div>

                {/* Insight cards */}
                <div className="space-y-3">
                  {items.map((insight) => {
                    const config = getSeverityConfig(insight.severity);
                    return (
                      <div
                        key={insight.id}
                        className="rounded-lg border border-border bg-card p-3"
                      >
                        {/* Title + confidence */}
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="flex-1 text-sm font-semibold text-foreground">
                            {insight.title}
                          </h3>
                          <span
                            className="rounded border border-border bg-card px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
                            title={`${insight.confidencePercent}% confidence`}
                          >
                            {getConfidenceLabel(insight.confidence)}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                          {insight.description}
                        </p>

                        {/* Impact */}
                        <div className="mb-3 flex items-center gap-1">
                          {insight.impact.type === "cost" ? (
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Clock className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="text-xs font-semibold text-foreground">
                            Impact: {insight.impact.value}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={insight.action.onClick}
                            className="flex-1 px-3 py-1.5 text-xs font-semibold text-white rounded transition-colors hover:opacity-90"
                            style={{ backgroundColor: darkERPTheme.brandAccent }}
                          >
                            {insight.action.label}
                          </button>
                          <button
                            onClick={() => onOpenDetails(insight.id)}
                            className="rounded bg-card p-1.5 text-muted-foreground transition-opacity hover:opacity-70"
                            title="View details"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
        )}
      </div>

      {/* Footer - Stats */}
      <div className="border-t border-border bg-card px-6 py-3">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Total insights</span>
            <span className="font-semibold text-foreground">
              {insights.length}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>Est. savings</span>
            <span className="font-semibold" style={{ color: darkERPTheme.severity.good }}>
              $535
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
