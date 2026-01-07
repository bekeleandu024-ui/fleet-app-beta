"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TripDetail } from "@/lib/types";

// ============================================================================
// TYPES
// ============================================================================

export interface Insight {
  type: "critical" | "warning" | "opportunity" | "info";
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  actionType: string;
}

export interface AIInsightsBarProps {
  tripId: string;
  tripData?: TripDetail;
  onAction: (actionType: string, insightData: Insight) => void;
  className?: string;
}

interface InsightsResponse {
  tripId: string;
  insights: Insight[];
  generatedAt: string;
}

// ============================================================================
// SEVERITY COLORS - Enterprise Muted Palette
// Only critical gets visible color, others are neutral/subdued
// ============================================================================

const severityColors: Record<Insight["type"], string> = {
  critical: "#b45353",    // Muted red - losses, required actions
  warning: "#c97a5a",     // Muted orange - at risk
  opportunity: "#5a7a6b", // Muted green - only for confirmations
  info: "#5a6a8a",        // Muted blue - links, interactive
};

const severityBgGradient: Record<Insight["type"], string> = {
  critical: "from-[#b45353]/10 to-transparent",
  warning: "from-[#c97a5a]/08 to-transparent",
  opportunity: "from-[#5a7a6b]/08 to-transparent",
  info: "from-[#5a6a8a]/08 to-transparent",
};

const severityBorderColor: Record<Insight["type"], string> = {
  critical: "border-l-[#b45353]",
  warning: "border-l-[#c97a5a]",
  opportunity: "border-l-[#3a3a42]",  // Neutral for non-critical
  info: "border-l-[#3a3a42]",          // Neutral for non-critical
};

const severityTextColor: Record<Insight["type"], string> = {
  critical: "text-[#b45353]",
  warning: "text-[#c97a5a]",
  opportunity: "text-[#a0a0b0]",  // Neutral for non-critical
  info: "text-[#a0a0b0]",          // Neutral for non-critical
};

const severityButtonBg: Record<Insight["type"], string> = {
  critical: "bg-[#b45353] hover:bg-[#c46363]",
  warning: "bg-[#c97a5a] hover:bg-[#d98a6a]",
  opportunity: "bg-[#2a2a32] hover:bg-[#3a3a42]",
  info: "bg-[#2a2a32] hover:bg-[#3a3a42]",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function AIInsightsBar({
  tripId,
  tripData,
  onAction,
  className = "",
}: AIInsightsBarProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch insights from API
  const fetchInsights = useCallback(async () => {
    if (!tripId) return;

    // Check cache first
    const cacheKey = `ai-insights-bar-${tripId}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const cachedData: InsightsResponse = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(cachedData.generatedAt).getTime();

        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setInsights(cachedData.insights);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Failed to parse cached insights:", e);
      }
    }

    try {
      setError(null);
      const response = await fetch(`/api/ai/trip-insights-bar/${tripId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch insights");
      }

      const data: InsightsResponse = await response.json();
      setInsights(data.insights || []);

      // Cache the response
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error("Error fetching AI insights:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Handle dot click with smooth transition
  const handleDotClick = (index: number) => {
    if (index === activeIndex || isTransitioning) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(index);
      setIsTransitioning(false);
    }, 150);
  };

  // Handle action button click
  const handleActionClick = () => {
    if (insights[activeIndex]) {
      onAction(insights[activeIndex].actionType, insights[activeIndex]);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-[#1c1c22] bg-[#111114] ${className}`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1c1c22]">
            <Loader2 className="h-4 w-4 animate-spin text-[#5a5a6e]" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-32 animate-pulse rounded bg-[#1c1c22]" />
            <div className="mt-1 h-3 w-48 animate-pulse rounded bg-[#1c1c22]/60" />
          </div>
        </div>
      </div>
    );
  }

  // Error state - show compact error
  if (error || insights.length === 0) {
    return null; // Don't show the bar if there are no insights
  }

  const currentInsight = insights[activeIndex];
  const displayDots = insights.slice(0, 4);
  const extraCount = insights.length > 4 ? insights.length - 4 : 0;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#1c1c22] bg-[#111114] ${className}`}
    >
      {/* Left accent border */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${severityBorderColor[currentInsight.type]}`}
      />

      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${severityBgGradient[currentInsight.type]}`}
        style={{ opacity: isTransitioning ? 0 : 1, transition: "opacity 150ms ease-in-out" }}
      />

      {/* Content */}
      <div className="relative flex items-center gap-4 px-5 py-3.5">
        {/* Icon */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg"
          style={{ backgroundColor: `${severityColors[currentInsight.type]}20` }}
        >
          <span
            className={`transition-opacity duration-150 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
          >
            {currentInsight.icon}
          </span>
        </div>

        {/* Text content */}
        <div
          className={`flex-1 min-w-0 transition-opacity duration-150 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`text-sm font-semibold ${severityTextColor[currentInsight.type]}`}
            >
              {currentInsight.title}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-medium text-[#5a5a6e]">• AI Insight</span>
          </div>
          <p className="text-xs text-[#a0a0b0] leading-relaxed">
            <HighlightedDescription
              text={currentInsight.description}
              color={severityColors[currentInsight.type]}
            />
          </p>
        </div>

        {/* Action button */}
        <Button
          size="sm"
          className={`flex-shrink-0 ${severityButtonBg[currentInsight.type]} text-white text-xs px-4 py-1.5 h-8 font-medium shadow-sm transition-transform hover:scale-[1.02]`}
          onClick={handleActionClick}
        >
          {currentInsight.actionLabel}
          <ChevronRight className="ml-1.5 h-3 w-3" />
        </Button>

        {/* Indicator dots */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {displayDots.map((insight, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`rounded-full transition-all duration-200 ${
                index === activeIndex
                  ? "w-2 h-2 ring-2 ring-offset-1 ring-offset-[#111114]"
                  : "w-1.5 h-1.5 hover:scale-125"
              }`}
              style={{
                backgroundColor: severityColors[insight.type],
                ["--tw-ring-color" as string]: index === activeIndex ? severityColors[insight.type] : undefined,
              }}
              aria-label={`View insight ${index + 1}: ${insight.title}`}
            />
          ))}
          {extraCount > 0 && (
            <span className="text-[11px] text-[#5a5a6e] ml-1">+{extraCount} more</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface HighlightedDescriptionProps {
  text: string;
  color: string;
}

function HighlightedDescription({ text, color }: HighlightedDescriptionProps) {
  // Highlight numbers, percentages, and currency values
  const parts = text.split(/(\$[\d,]+(?:\.\d{2})?|\d+(?:\.\d+)?%?(?:\/mi)?|\d+(?:,\d{3})*(?:\.\d+)?)/g);

  return (
    <>
      {parts.map((part, index) => {
        // Check if this part is a number, percentage, or currency
        const isHighlight = /^\$[\d,]+(?:\.\d{2})?$|^\d+(?:\.\d+)?%?(?:\/mi)?$|^\d+(?:,\d{3})*(?:\.\d+)?$/.test(
          part
        );

        if (isHighlight) {
          return (
            <span key={index} className="font-semibold" style={{ color }}>
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AIInsightsBar;
