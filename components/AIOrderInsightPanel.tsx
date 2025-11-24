'use client';

import { Sparkles, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface Insight {
  category: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation: string;
}

interface InsightsData {
  summary: string;
  canDispatch: boolean;
  recommendedDriver: {
    id: string | null;
    name: string;
    reason: string;
  };
  recommendedUnit: {
    id: string | null;
    number: string;
    reason: string;
  };
  insights: Insight[];
}

export function AIOrderInsightPanel({ insights }: { insights: InsightsData | null }) {
  if (!insights) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          <h2 className="text-lg font-semibold text-neutral-200">AI Order Insight</h2>
        </div>
        <p className="text-sm text-neutral-400">Loading insights...</p>
      </div>
    );
  }

  const severityStyles = {
    critical: 'bg-red-900/20 border-l-4 border-red-500',
    warning: 'bg-yellow-900/20 border-l-4 border-yellow-500',
    info: 'bg-blue-900/20 border-l-4 border-blue-500'
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-neutral-200">AI Order Insight</h2>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        <p className="text-sm text-neutral-300">{insights.summary}</p>
        {insights.canDispatch && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            Ready to dispatch
          </div>
        )}
      </div>

      {/* Recommended Driver */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            Recommended Driver
          </span>
          {insights.recommendedDriver.id && (
            <span className="text-xs text-green-400">Best Match</span>
          )}
        </div>
        <div className="text-base font-semibold text-neutral-200">
          {insights.recommendedDriver.name}
        </div>
        <div className="text-xs text-neutral-400 mt-1">
          {insights.recommendedDriver.reason}
        </div>
      </div>

      {/* Recommended Unit */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            Recommended Unit
          </span>
          {insights.recommendedUnit.id && (
            <span className="text-xs text-green-400">Best Match</span>
          )}
        </div>
        <div className="text-base font-semibold text-neutral-200">
          {insights.recommendedUnit.number !== 'N/A' ? `Unit ${insights.recommendedUnit.number}` : insights.recommendedUnit.number}
        </div>
        <div className="text-xs text-neutral-400 mt-1">
          {insights.recommendedUnit.reason}
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-1.5">
        {insights.insights.map((insight, index) => (
          <div 
            key={index}
            className={`rounded p-2 ${severityStyles[insight.severity]}`}
          >
            <div className="flex items-start gap-2">
              <div>{getSeverityIcon(insight.severity)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-neutral-500 uppercase">{insight.category}</span>
                  <h3 className="text-xs font-semibold text-neutral-200">{insight.title}</h3>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">{insight.recommendation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
