"use client";

import { Sparkles, TrendingDown, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { AIRecommendation } from "../types";

interface AICopilotSidebarProps {
  recommendations: AIRecommendation[];
  onApplyRecommendation: (rec: AIRecommendation) => void;
  onDismissRecommendation: (recId: string) => void;
}

export function AICopilotSidebar({
  recommendations,
  onApplyRecommendation,
  onDismissRecommendation,
}: AICopilotSidebarProps) {
  const getRecommendationIcon = (type: AIRecommendation["type"]) => {
    switch (type) {
      case "assignment":
        return <CheckCircle2 className="h-4 w-4 text-[#24D67B]" />;
      case "reassignment":
        return <TrendingDown className="h-4 w-4 text-[#60A5FA]" />;
      case "conflict":
        return <AlertTriangle className="h-4 w-4 text-[#FF8A00]" />;
      case "balance":
        return <TrendingDown className="h-4 w-4 text-[#FFC857]" />;
    }
  };

  const getRecommendationColor = (type: AIRecommendation["type"]) => {
    switch (type) {
      case "assignment":
        return "border-[#24D67B]/30 bg-[#24D67B]/5";
      case "reassignment":
        return "border-[#60A5FA]/30 bg-[#60A5FA]/5";
      case "conflict":
        return "border-[#FF8A00]/30 bg-[#FF8A00]/5";
      case "balance":
        return "border-[#FFC857]/30 bg-[#FFC857]/5";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-[#24D67B]";
    if (confidence >= 75) return "text-[#60A5FA]";
    if (confidence >= 60) return "text-[#FFC857]";
    return "text-[#FF8A00]";
  };

  return (
    <div className="w-80 bg-[#0A0F1E] border-l border-[#1E2638] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#1E2638]">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-[#60A5FA]" />
          <h2 className="text-lg font-semibold text-[#E6EAF2]">AI Dispatch Assistant</h2>
        </div>
        <p className="text-xs text-[#6C7484]">
          Smart recommendations to optimize your dispatch operations
        </p>
      </div>

      {/* Recommendations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Sparkles className="h-12 w-12 text-[#6C7484] mb-3 opacity-30" />
            <p className="text-sm text-[#6C7484]">No recommendations at this time</p>
            <p className="text-xs text-[#6C7484] mt-1">AI is monitoring your dispatch board</p>
          </div>
        ) : (
          recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`border rounded-lg p-3 ${getRecommendationColor(rec.type)}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getRecommendationIcon(rec.type)}
                  <span className="text-xs font-medium text-[#E6EAF2] capitalize">
                    {rec.type.replace("_", " ")}
                  </span>
                </div>
                <button
                  onClick={() => onDismissRecommendation(rec.id)}
                  className="text-[#6C7484] hover:text-[#E6EAF2] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Order & Driver */}
              <div className="space-y-1 mb-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6C7484]">Order</span>
                  <code className="text-[#E6EAF2] font-mono">{rec.orderId}</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6C7484]">Driver</span>
                  <span className="text-[#E6EAF2]">{rec.driverId}</span>
                </div>
              </div>

              {/* Reason */}
              <p className="text-xs text-[#9AA4B2] mb-3 leading-relaxed">{rec.reason}</p>

              {/* Metrics */}
              {(rec.costSavings || rec.etaImprovement) && (
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#1E2638]">
                  {rec.costSavings && (
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-[#24D67B]" />
                      <span className="text-xs text-[#24D67B] font-medium">
                        Save ${rec.costSavings}
                      </span>
                    </div>
                  )}
                  {rec.etaImprovement && (
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-[#60A5FA]" />
                      <span className="text-xs text-[#60A5FA] font-medium">
                        {rec.etaImprovement > 0 ? "+" : ""}
                        {rec.etaImprovement.toFixed(1)}h ETA
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Confidence & Action */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6C7484]">Confidence</span>
                  <span className={`text-xs font-medium ${getConfidenceColor(rec.confidence)}`}>
                    {rec.confidence}%
                  </span>
                </div>
                <button
                  onClick={() => onApplyRecommendation(rec)}
                  className="h-7 px-3 bg-[#60A5FA] hover:bg-[#60A5FA]/90 rounded-md text-xs text-white font-medium transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-[#1E2638] bg-[#0F1420]">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-[#6C7484] mb-1">Today's AI Actions</div>
            <div className="text-lg font-semibold text-[#E6EAF2]">23</div>
          </div>
          <div>
            <div className="text-[#6C7484] mb-1">Cost Saved</div>
            <div className="text-lg font-semibold text-[#24D67B]">$2,450</div>
          </div>
        </div>
      </div>
    </div>
  );
}
