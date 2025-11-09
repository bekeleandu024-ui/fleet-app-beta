"use client";

import { Brain, AlertTriangle, DollarSign, TrendingUp, Sparkles } from "lucide-react";

interface AIInsight {
  id: string;
  type: "alert" | "anomaly" | "recommendation" | "intelligence";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  confidence: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function AIInsightsPanel() {
  // Mock AI insights - in production, these would come from your AI engine
  const insights: AIInsight[] = [
    {
      id: "1",
      type: "alert",
      title: "HOS Violation Risk",
      description: "Driver John may exceed HOS in 2 hours on Trip #1234",
      priority: "high",
      confidence: 92,
      action: {
        label: "Reassign",
        onClick: () => console.log("Reassign driver"),
      },
    },
    {
      id: "2",
      type: "anomaly",
      title: "Cost Anomaly Detected",
      description: "Trip #5678 cost 23% above normal range for this lane",
      priority: "medium",
      confidence: 87,
      action: {
        label: "Review",
        onClick: () => console.log("Review cost"),
      },
    },
    {
      id: "3",
      type: "recommendation",
      title: "Optimization Opportunity",
      description: "Reassign load to Driver Sarah for $150 savings",
      priority: "medium",
      confidence: 85,
      action: {
        label: "Apply",
        onClick: () => console.log("Apply recommendation"),
      },
    },
    {
      id: "4",
      type: "intelligence",
      title: "Market Rate Update",
      description: "Toronto-Chicago lane rates up 12% this week",
      priority: "low",
      confidence: 94,
    },
  ];

  const getIconByType = (type: AIInsight["type"]) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "anomaly":
        return <DollarSign className="h-5 w-5 text-orange-600" />;
      case "recommendation":
        return <Sparkles className="h-5 w-5 text-purple-600" />;
      case "intelligence":
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
    }
  };

  const getPriorityStyles = (priority: AIInsight["priority"]) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-red-500 bg-red-50";
      case "medium":
        return "border-l-4 border-l-yellow-500 bg-yellow-50";
      case "low":
        return "border-l-4 border-l-blue-500 bg-blue-50";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span className="mr-1 h-2 w-2 bg-green-600 rounded-full animate-pulse" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 hover:bg-gray-50 transition-colors ${getPriorityStyles(
              insight.priority
            )}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{getIconByType(insight.type)}</div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {insight.title}
                  </h3>
                  <span className="flex-shrink-0 text-xs text-gray-500 font-medium">
                    {insight.confidence}% confident
                  </span>
                </div>
                
                <p className="mt-1 text-sm text-gray-700">{insight.description}</p>
                
                {/* Confidence bar */}
                <div className="mt-2">
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        insight.confidence >= 90
                          ? "bg-green-500"
                          : insight.confidence >= 80
                          ? "bg-yellow-500"
                          : "bg-orange-500"
                      }`}
                      style={{ width: `${insight.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Action button */}
                {insight.action && (
                  <button
                    onClick={insight.action.onClick}
                    className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    {insight.action.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-red-600">
              {insights.filter((i) => i.priority === "high").length}
            </p>
            <p className="text-xs text-gray-600">High Priority</p>
          </div>
          <div>
            <p className="text-lg font-bold text-yellow-600">
              {insights.filter((i) => i.priority === "medium").length}
            </p>
            <p className="text-xs text-gray-600">Medium</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">
              {insights.filter((i) => i.priority === "low").length}
            </p>
            <p className="text-xs text-gray-600">Low</p>
          </div>
        </div>
      </div>
    </div>
  );
}
