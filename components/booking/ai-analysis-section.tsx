"use client";

import { useEffect, useMemo, useState } from "react";
import { AIInsightsPanel } from "@/components/ai-insights-panel";
import { BookingInsights } from "@/lib/types";

interface AIAnalysisSectionProps {
  tripContext: any;
  totalCost: number;
  latestTripStart: string | null;
  onSelectDriver: (driverId: string) => void;
  onSelectUnit: (unitId: string) => void;
  onInsightsUpdate?: (insights: any) => void;
}

// Generate insights locally from tripContext data (no API call needed)
function generateLocalInsights(tripContext: any): BookingInsights | null {
  if (!tripContext || !tripContext.costingOptions || tripContext.costingOptions.length === 0) {
    return null;
  }

  // 1. Find the lowest cost option
  const sortedOptions = [...tripContext.costingOptions].sort((a, b) => a.totalCost - b.totalCost);
  const lowestCostOption = sortedOptions[0];
  const driverType = lowestCostOption.type; // 'COM', 'RNR', 'OO_Z1', 'OO_Z2', 'OO_Z3'

  // 2. Map driver type to available drivers list
  let availableDrivers: { id: string; name: string }[] = [];
  let driverTypeLabel = "";
  
  if (driverType === 'COM' || driverType === 'Company') {
    availableDrivers = tripContext.availableDrivers?.com || [];
    driverTypeLabel = "Company";
  } else if (driverType === 'RNR' || driverType === 'Rental') {
    availableDrivers = tripContext.availableDrivers?.rnr || [];
    driverTypeLabel = "Rental";
  } else if (driverType?.startsWith('OO') || driverType === 'Owner Operator') {
    availableDrivers = tripContext.availableDrivers?.oo || [];
    driverTypeLabel = "Owner Operator";
  }

  // 3. Pick first available driver
  const recommendedDriver = availableDrivers.length > 0 ? availableDrivers[0] : null;

  // 4. Pick first available unit
  const recommendedUnit = tripContext.availableUnits?.length > 0 ? tripContext.availableUnits[0] : null;

  // 5. Calculate savings vs other options
  const highestCostOption = sortedOptions[sortedOptions.length - 1];
  const potentialSavings = highestCostOption.totalCost - lowestCostOption.totalCost;

  // 6. Build insights
  const insights: BookingInsights = {
    recommendedDriverType: driverType,
    reasoning: `${driverTypeLabel} driver is the most cost-effective option at $${lowestCostOption.totalCost.toFixed(2)} (${lowestCostOption.cpm.toFixed(2)} CPM) for this ${tripContext.distance} mile ${tripContext.isCrossBorder ? 'cross-border ' : ''}route.`,
    
    costOptimization: {
      potentialSavings: potentialSavings > 0 ? `$${potentialSavings.toFixed(2)}` : "$0",
      suggestion: potentialSavings > 0 
        ? `Using ${driverTypeLabel} saves $${potentialSavings.toFixed(2)} compared to the most expensive option.`
        : "This is already the optimal cost option."
    },
    
    operationalInsights: [
      `Route: ${tripContext.lane} (${tripContext.distance} mi)`,
      availableDrivers.length > 0 
        ? `${availableDrivers.length} ${driverTypeLabel} driver${availableDrivers.length > 1 ? 's' : ''} available`
        : `No ${driverTypeLabel} drivers currently available`,
      tripContext.estimatedDuration 
        ? `Estimated duration: ${Math.round(tripContext.estimatedDuration / 60)} hrs`
        : null
    ].filter(Boolean) as string[],
    
    riskFactors: [
      tripContext.isCrossBorder ? "Cross-border shipment - ensure customs documentation" : null,
      availableDrivers.length === 0 ? `No ${driverTypeLabel} drivers available - consider alternate type` : null,
      tripContext.distance > 500 ? "Long haul - verify driver HOS compliance" : null
    ].filter(Boolean) as string[],
    
    specificDriverRecommendation: recommendedDriver ? {
      driverId: recommendedDriver.id,
      driverName: recommendedDriver.name,
      reason: `First available ${driverTypeLabel} driver for lowest-cost option`
    } : undefined,
    
    specificUnitRecommendation: recommendedUnit ? {
      unitId: recommendedUnit.id,
      unitCode: recommendedUnit.code,
      reason: `Available ${recommendedUnit.type || 'unit'} ready for dispatch`
    } : undefined,
    
    marginAnalysis: {
      targetMargin: "5%",
      recommendedRevenue: `$${(lowestCostOption.totalCost * 1.05).toFixed(2)}`,
      reasoning: "5% margin floor applied to lowest cost option"
    }
  };

  return insights;
}

export default function AIAnalysisSection({
  tripContext,
  totalCost,
  latestTripStart,
  onSelectDriver,
  onSelectUnit,
  onInsightsUpdate
}: AIAnalysisSectionProps) {
  const [isReady, setIsReady] = useState(false);

  // Generate insights instantly from local data (no API call)
  const insights = useMemo(() => {
    if (!tripContext || !tripContext.customer || tripContext.distance <= 0) {
      return null;
    }
    return generateLocalInsights(tripContext);
  }, [tripContext]);

  // Small delay for smooth UI transition
  useEffect(() => {
    if (insights) {
      const timer = setTimeout(() => setIsReady(true), 200);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [insights]);

  // Pass insights back up if needed
  useEffect(() => {
    if (insights && onInsightsUpdate) {
      onInsightsUpdate(insights);
    }
  }, [insights, onInsightsUpdate]);

  return (
    <AIInsightsPanel
      insights={isReady ? insights : null}
      loading={!isReady && tripContext?.distance > 0}
      error={null}
      onRetry={() => {}} // No retry needed for local computation
      totalCost={totalCost}
      latestTripStart={latestTripStart}
      onSelectDriver={onSelectDriver}
      onSelectUnit={onSelectUnit}
    />
  );
}
