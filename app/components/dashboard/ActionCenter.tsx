"use client";

import { ChevronRight, DollarSign, Clock } from "lucide-react";
import clsx from "clsx";

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
          color: "text-red-700",
          bg: "bg-red-50",
          border: "border-red-200",
        };
      case "risk":
        return {
          label: "Risk",
          color: "text-orange-700",
          bg: "bg-orange-50",
          border: "border-orange-200",
        };
      case "watch":
        return {
          label: "Watch",
          color: "text-yellow-700",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
        };
      case "info":
        return {
          label: "Info",
          color: "text-blue-700",
          bg: "bg-blue-50",
          border: "border-blue-200",
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
    <div className="bg-white border border-gray-200 rounded-lg h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">Action Center</h2>
        <p className="text-sm text-gray-600 mt-0.5">Optimization Insights</p>
      </div>

      {/* Insights by severity */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
        {Object.entries(groupedInsights).map(
          ([severity, items]) =>
            items.length > 0 && (
              <div key={severity} className="p-4">
                {/* Severity header */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      getSeverityConfig(severity as Insight["severity"]).color
                    }`}
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
                        className={clsx(
                          "p-3 rounded-lg border",
                          config.bg,
                          config.border
                        )}
                      >
                        {/* Title + confidence */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-gray-900 flex-1">
                            {insight.title}
                          </h3>
                          <span
                            className="text-xs font-medium text-gray-600 px-1.5 py-0.5 bg-white rounded border border-gray-200"
                            title={`${insight.confidencePercent}% confidence`}
                          >
                            {getConfidenceLabel(insight.confidence)}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-gray-700 mb-2 line-clamp-2">
                          {insight.description}
                        </p>

                        {/* Impact */}
                        <div className="flex items-center gap-1 mb-3">
                          {insight.impact.type === "cost" ? (
                            <DollarSign className="h-3 w-3 text-gray-500" />
                          ) : (
                            <Clock className="h-3 w-3 text-gray-500" />
                          )}
                          <span className="text-xs font-semibold text-gray-900">
                            Impact: {insight.impact.value}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={insight.action.onClick}
                            className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                          >
                            {insight.action.label}
                          </button>
                          <button
                            onClick={() => onOpenDetails(insight.id)}
                            className="p-1.5 text-gray-600 hover:bg-white hover:text-gray-900 rounded transition-colors"
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
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Total insights</span>
            <span className="font-semibold text-gray-900">{insights.length}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>Est. savings</span>
            <span className="font-semibold text-green-600">$535</span>
          </div>
        </div>
      </div>
    </div>
  );
}
