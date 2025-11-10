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
        return <CheckCircle2 className="h-4 w-4 text-fleet-success" />;
      case "reassignment":
        return <TrendingDown className="h-4 w-4 text-fleet-accent" />;
      case "conflict":
        return <AlertTriangle className="h-4 w-4 text-fleet-alert" />;
      case "balance":
        return <TrendingDown className="h-4 w-4 text-fleet-warning" />;
    }
  };

  const getRecommendationColor = (type: AIRecommendation["type"]) => {
    switch (type) {
      case "assignment":
        return "border-fleet-success/20 bg-fleet-success/10";
      case "reassignment":
        return "border-fleet-accent/20 bg-fleet-accent/10";
      case "conflict":
        return "border-fleet-alert/20 bg-fleet-alert/10";
      case "balance":
        return "border-fleet-warning/20 bg-fleet-warning/10";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-fleet-success";
    if (confidence >= 75) return "text-fleet-accent";
    if (confidence >= 60) return "text-fleet-warning";
    return "text-fleet-alert";
  };

  return (
    <div className="w-80 bg-fleet-primary border-l border-fleet flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-fleet">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-fleet-accent" />
          <h2 className="text-lg font-semibold text-fleet-primary">AI Dispatch Assistant</h2>
        </div>
        <p className="text-xs text-fleet-muted">
          Smart recommendations to optimize your dispatch operations
        </p>
      </div>

      {/* Recommendations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Sparkles className="h-12 w-12 text-fleet-muted mb-3 opacity-30" />
            <p className="text-sm text-fleet-muted">No recommendations at this time</p>
            <p className="text-xs text-fleet-muted mt-1">AI is monitoring your dispatch board</p>
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
                  <span className="text-xs font-medium text-fleet-primary capitalize">
                    {rec.type.replace("_", " ")}
                  </span>
                </div>
                <button
                  onClick={() => onDismissRecommendation(rec.id)}
                  className="text-fleet-muted hover:text-fleet-primary transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Order & Driver */}
              <div className="space-y-1 mb-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-fleet-muted">Order</span>
                  <code className="text-fleet-primary font-mono">{rec.orderId}</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-fleet-muted">Driver</span>
                  <span className="text-fleet-primary">{rec.driverId}</span>
                </div>
              </div>

              {/* Reason */}
              <p className="text-xs text-fleet-secondary mb-3 leading-relaxed">{rec.reason}</p>

              {/* Metrics */}
              {(rec.costSavings || rec.etaImprovement) && (
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-fleet">
                  {rec.costSavings && (
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-fleet-success" />
                      <span className="text-xs text-fleet-success font-medium">
                        Save ${rec.costSavings}
                      </span>
                    </div>
                  )}
                  {rec.etaImprovement && (
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-fleet-accent" />
                      <span className="text-xs text-fleet-accent font-medium">
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
                  <span className="text-xs text-fleet-muted">Confidence</span>
                  <span className={`text-xs font-medium ${getConfidenceColor(rec.confidence)}`}>
                    {rec.confidence}%
                  </span>
                </div>
                <button
                  onClick={() => onApplyRecommendation(rec)}
                  className="h-7 px-3 bg-fleet-accent hover:bg-(--hover-accent) rounded-md text-xs text-white font-medium transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-fleet bg-fleet-secondary">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-fleet-muted mb-1">Today's AI Actions</div>
            <div className="text-lg font-semibold text-fleet-primary">23</div>
          </div>
          <div>
            <div className="text-fleet-muted mb-1">Cost Saved</div>
            <div className="text-lg font-semibold text-fleet-success">$2,450</div>
          </div>
        </div>
      </div>
    </div>
  );
}
