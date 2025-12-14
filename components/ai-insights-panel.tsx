'use client';

import { Sparkles, TrendingDown, AlertTriangle, CheckCircle, Info, User, DollarSign, Lightbulb } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { BookingInsights } from '@/lib/types';

interface AIInsightsPanelProps {
  insights: BookingInsights | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectDriver: (driverId: string) => void;
  onSelectUnit?: (unitId: string) => void;
  totalCost?: number;
  latestTripStart?: string | null;
}

export function AIInsightsPanel({
  insights,
  loading,
  error,
  onRetry,
  onSelectDriver,
  onSelectUnit,
  totalCost,
  latestTripStart
}: AIInsightsPanelProps) {
  
  if (loading) {
    return (
      <Card className="p-6 border-zinc-800 bg-zinc-900/40 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-zinc-800"></div>
          <div className="h-4 w-32 bg-zinc-800 rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="h-20 bg-zinc-800/50 rounded-lg"></div>
          <div className="h-12 bg-zinc-800/50 rounded-lg"></div>
          <div className="h-32 bg-zinc-800/50 rounded-lg"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-rose-900/30 bg-rose-950/10">
        <div className="flex flex-col items-center text-center gap-3">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
          <p className="text-sm text-rose-200">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="border-rose-800 text-rose-400 hover:bg-rose-950/50">
            Retry Analysis
          </Button>
        </div>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-blue-100">AI Analysis & Recommendations</h3>
      </div>

      {/* Primary Recommendation - REMOVED */}
      {/* <Card className="p-4 bg-linear-to-br from-blue-950/40 to-indigo-950/40 border-blue-800/50 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Recommended Strategy</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {insights.recommendedDriverType.replace('_', ' ')} Driver
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {insights.reasoning}
          </p>
        </div>
      </Card> */}

      {/* Specific Resource Recommendation */}
      {(insights.specificDriverRecommendation || insights.specificUnitRecommendation) && (
        <Card className="p-4 bg-zinc-900/40 border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-900/20 rounded-lg shrink-0">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-1">Suggested Resources</h4>
              
              {insights.specificDriverRecommendation && (
                <div className="mb-2">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Driver</p>
                  <p className="text-sm font-medium text-blue-300">{insights.specificDriverRecommendation.driverName}</p>
                  <p className="text-xs text-zinc-400">{insights.specificDriverRecommendation.reason}</p>
                </div>
              )}

              {insights.specificUnitRecommendation && (
                <div className="mb-3">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Unit</p>
                  <p className="text-sm font-medium text-blue-300">{insights.specificUnitRecommendation.unitCode}</p>
                  <p className="text-xs text-zinc-400">{insights.specificUnitRecommendation.reason}</p>
                </div>
              )}

              <Button 
                size="sm" 
                variant="secondary" 
                className="w-full h-8 text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-200 border border-blue-800/50"
                onClick={() => {
                  if (insights.specificDriverRecommendation) {
                    onSelectDriver(insights.specificDriverRecommendation.driverId);
                  }
                  if (insights.specificUnitRecommendation && onSelectUnit) {
                    onSelectUnit(insights.specificUnitRecommendation.unitId);
                  }
                }}
              >
                Assign Resources
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Trip Execution Parameters (Revenue & Timing) */}
      <div className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Revenue & Start Date Recommendation</h4>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">Target Margin</span>
          <span className="text-xs font-mono text-emerald-400">5%</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">Rec. Revenue</span>
          <span className="text-xs font-mono text-white">
            ${totalCost ? (totalCost * 1.05).toFixed(2) : "0.00"}
          </span>
        </div>
        {latestTripStart && (
          <div className="flex items-center justify-between mb-2 pt-2 border-t border-zinc-800/50">
            <span className="text-xs text-zinc-500">Latest Start</span>
            <span className="text-xs font-mono text-amber-400">
              {new Date(latestTripStart).toLocaleString(undefined, { 
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
              })}
            </span>
          </div>
        )}
        <p className="text-[10px] text-zinc-500 border-t border-zinc-800 pt-2 mt-2">
          Revenue calculated at cost + 5% margin. Latest start time calculated to ensure on-time delivery.
        </p>
      </div>
      
      {/* Cost Optimization - MOVED TO COST CARD */}
      {/* {insights.costOptimization && insights.costOptimization.potentialSavings !== "0" && (
        <Card className="p-4 bg-emerald-950/20 border-emerald-900/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-900/30 rounded-lg shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-300 mb-1">Cost Opportunity</h4>
              <p className="text-sm text-zinc-400 mb-1">{insights.costOptimization.suggestion}</p>
              <p className="text-xs font-medium text-emerald-500">Potential Savings: {insights.costOptimization.potentialSavings}</p>
            </div>
          </div>
        </Card>
      )} */}
      
      {/* Operational Insights - MOVED TO CHAT */}
      {/* <div className="space-y-2">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Key Insights</h4>
        {insights.operationalInsights.map((insight, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-300">{insight}</p>
          </div>
        ))}
      </div> */}
      
      {/* Risk Factors - MOVED TO CHAT */}
      {/* {insights.riskFactors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Risk Factors</h4>
          {insights.riskFactors.map((risk, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-rose-950/10 border border-rose-900/30">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-200/80">{risk}</p>
            </div>
          ))}
        </div>
      )} */}
    </div>
  );
}

