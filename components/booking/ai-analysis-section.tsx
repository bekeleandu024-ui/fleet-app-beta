"use client";

import { useEffect } from "react";
import { AIInsightsPanel } from "@/components/ai-insights-panel";
import { useAIInsights } from "@/hooks/use-ai-insights";

interface AIAnalysisSectionProps {
  tripContext: any;
  totalCost: number;
  latestTripStart: string | null;
  onSelectDriver: (driverId: string) => void;
  onSelectUnit: (unitId: string) => void;
  onInsightsUpdate?: (insights: any) => void;
}

export default function AIAnalysisSection({
  tripContext,
  totalCost,
  latestTripStart,
  onSelectDriver,
  onSelectUnit,
  onInsightsUpdate
}: AIAnalysisSectionProps) {
  const { 
    insights, 
    isGenerating, 
    error, 
    generateInsights 
  } = useAIInsights();

  // Trigger insights generation when tripContext changes
  useEffect(() => {
    if (tripContext && tripContext.selectedOrder && tripContext.actualMiles > 0) {
       const timer = setTimeout(() => {
         generateInsights(tripContext);
       }, 1000);
       return () => clearTimeout(timer);
    }
  }, [tripContext, generateInsights]);

  // Pass insights back up if needed
  useEffect(() => {
    if (insights && onInsightsUpdate) {
      onInsightsUpdate(insights);
    }
  }, [insights, onInsightsUpdate]);

  return (
    <AIInsightsPanel
      insights={insights}
      loading={isGenerating}
      error={error}
      onRetry={() => generateInsights(tripContext)}
      totalCost={totalCost}
      latestTripStart={latestTripStart}
      onSelectDriver={onSelectDriver}
      onSelectUnit={onSelectUnit}
    />
  );
}
