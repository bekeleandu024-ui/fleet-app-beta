import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Info,
  RouteIcon,
  Sparkles,
  TriangleAlert,
  User,
  Truck,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import type { TripDetail } from "@/lib/types";
import type { getTripInsights } from "@/lib/ai-service";

const bulletToneStyles: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-200 border-blue-500/30",
  success: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
  warn: "bg-amber-500/10 text-amber-200 border-amber-500/30",
  alert: "bg-red-500/10 text-red-200 border-red-500/30",
  critical: "bg-red-500/10 text-red-200 border-red-500/30",
  warning: "bg-amber-500/10 text-amber-200 border-amber-500/30",
};


type TripInsights = Awaited<ReturnType<typeof getTripInsights>>;

interface AiTripInsightPanelProps {
  trip: TripDetail;
  aiInsights?: TripInsights | null;
  loading?: boolean;
}

// Helper to determine tone/icon from insight text
function getInsightStyle(text: string): { tone: keyof typeof bulletToneStyles; icon: ReactNode; label: string } {
  const lowerText = text.toLowerCase();
  
  if (text.startsWith("✅") || lowerText.includes("healthy") || lowerText.includes("complete") || lowerText.includes("ready")) {
    return { tone: "success", icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "OK" };
  }
  if (text.startsWith("⚠️") || lowerText.includes("warning") || lowerText.includes("below")) {
    return { tone: "warn", icon: <AlertTriangle className="h-3.5 w-3.5" />, label: "Warn" };
  }
  if (text.startsWith("❌") || lowerText.includes("critical") || lowerText.includes("missing") || lowerText.includes("error")) {
    return { tone: "alert", icon: <TriangleAlert className="h-3.5 w-3.5" />, label: "Alert" };
  }
  if (lowerText.includes("margin") || lowerText.includes("revenue") || lowerText.includes("cost") || text.startsWith("💰")) {
    return { tone: "info", icon: <CircleDollarSign className="h-3.5 w-3.5" />, label: "Cost" };
  }
  if (lowerText.includes("driver") || text.includes("assigned")) {
    return { tone: "info", icon: <User className="h-3.5 w-3.5" />, label: "Driver" };
  }
  if (lowerText.includes("unit") || lowerText.includes("truck")) {
    return { tone: "info", icon: <Truck className="h-3.5 w-3.5" />, label: "Unit" };
  }
  if (lowerText.includes("route") || lowerText.includes("mile") || text.startsWith("📍")) {
    return { tone: "info", icon: <RouteIcon className="h-3.5 w-3.5" />, label: "Route" };
  }
  if (lowerText.includes("border") || lowerText.includes("customs") || text.startsWith("🌐")) {
    return { tone: "warn", icon: <Info className="h-3.5 w-3.5" />, label: "Border" };
  }
  
  return { tone: "info", icon: <Info className="h-3.5 w-3.5" />, label: "Info" };
}

export function AiTripInsightPanel({ trip, aiInsights, loading }: AiTripInsightPanelProps) {
  if (loading) {
    return <Card className="h-full animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />;
  }

  // Extract AI analysis if available - check multiple possible locations
  const aiAnalysis = (aiInsights as any)?.aiAnalysis;
  
  // Get structured insights (array of objects with title, detail, severity)
  const structuredInsights: Array<{
    title?: string;
    detail?: string;
    severity?: string;
    action?: string;
    category?: string;
  }> = aiAnalysis?.insights || [];
  
  // Get string-based insights (fallback)
  const keyInsights: string[] = aiAnalysis?.keyInsights || [];
  
  // Get other AI analysis data
  const marginAnalysis = aiAnalysis?.marginAnalysis;
  const summary = aiAnalysis?.summary;
  const positiveIndicators: string[] = aiAnalysis?.positive_indicators || aiAnalysis?.positiveIndicators || [];
  const riskFactors = aiAnalysis?.riskFactors || aiInsights?.routeOptimization?.warnings || [];

  // Determine if we have any AI data
  const hasAiData = structuredInsights.length > 0 || keyInsights.length > 0 || summary;

  // Build headline from AI summary
  let headline: string | null = null;
  if (summary) {
    headline = summary;
  } else if (marginAnalysis?.message) {
    headline = marginAnalysis.message;
  } else if (aiInsights?.recommendation) {
    headline = aiInsights.recommendation;
  }

  // Build bullets from actual AI insights
  const bullets: Array<{ label: string; text: string; tone: keyof typeof bulletToneStyles; icon: ReactNode }> = [];

  // Process structured insights first (preferred format from AI)
  for (const insight of structuredInsights) {
    const severity = insight.severity || "info";
    const title = insight.title || "Insight";
    const detail = insight.detail || "";
    
    // Map severity to tone
    let tone: keyof typeof bulletToneStyles = "info";
    let icon: ReactNode = <Info className="h-3.5 w-3.5" />;
    
    if (severity === "success") {
      tone = "success";
      icon = <CheckCircle2 className="h-3.5 w-3.5" />;
    } else if (severity === "critical") {
      tone = "critical";
      icon = <TriangleAlert className="h-3.5 w-3.5" />;
    } else if (severity === "warning") {
      tone = "warning";
      icon = <AlertTriangle className="h-3.5 w-3.5" />;
    } else if (insight.category === "financial") {
      icon = <CircleDollarSign className="h-3.5 w-3.5" />;
    } else if (insight.category === "resources") {
      icon = <User className="h-3.5 w-3.5" />;
    } else if (insight.category === "route") {
      icon = <RouteIcon className="h-3.5 w-3.5" />;
    }
    
    bullets.push({
      label: title.substring(0, 20), // Truncate long titles
      text: detail,
      tone,
      icon,
    });
  }

  // If no structured insights, fall back to string-based keyInsights
  if (bullets.length === 0 && keyInsights.length > 0) {
    for (const insight of keyInsights) {
      const cleanText = insight.replace(/^[✅⚠️❌💰📍🌐]\s*/, "");
      const style = getInsightStyle(insight);
      bullets.push({
        label: style.label,
        text: cleanText,
        tone: style.tone,
        icon: style.icon,
      });
    }
  }

  // Add positive indicators as success bullets (if not already covered)
  for (const positive of positiveIndicators) {
    if (!bullets.some(b => b.text.includes(positive.substring(0, 20)))) {
      bullets.push({
        label: "OK",
        text: positive,
        tone: "success",
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      });
    }
  }

  // Add margin analysis if not already in insights
  if (marginAnalysis && !bullets.some(b => b.text.toLowerCase().includes("margin"))) {
    const marginTone = marginAnalysis.status === "healthy" ? "success" : marginAnalysis.status === "warning" ? "warn" : "alert";
    bullets.push({
      label: "Margin",
      text: marginAnalysis.recommendation || marginAnalysis.message,
      tone: marginTone,
      icon: <TrendingUp className="h-3.5 w-3.5" />,
    });
  }

  // Add risk factors (only if they represent actual problems)
  for (const risk of riskFactors) {
    if (risk && !bullets.some(b => b.text === risk)) {
      bullets.push({
        label: "Risk",
        text: risk,
        tone: "alert",
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      });
    }
  }

  // If no AI data, fall back to basic display
  if (!hasAiData && bullets.length === 0) {
    const distance = aiInsights?.routeOptimization?.distance ?? trip.metrics?.distanceMiles;
    const margin = aiInsights?.costAnalysis?.margin ?? trip.metrics?.marginPct;
    
    bullets.push({
      label: "Route",
      text: `${trip.pickup ?? "Origin"} → ${trip.delivery ?? "Destination"} (${distance ? Math.round(distance) : "?"} mi)`,
      tone: "info",
      icon: <RouteIcon className="h-3.5 w-3.5" />,
    });
    
    if (trip.driver) {
      bullets.push({
        label: "Driver",
        text: `${trip.driver} (${trip.driverType || "COM"}) assigned`,
        tone: "success",
        icon: <User className="h-3.5 w-3.5" />,
      });
    }
    
    if (margin !== undefined) {
      const marginTone = margin >= 15 ? "success" : margin < 10 ? "alert" : "warn";
      bullets.push({
        label: "Margin",
        text: `Current margin: ${margin}%`,
        tone: marginTone,
        icon: <CircleDollarSign className="h-3.5 w-3.5" />,
      });
    }
  }

  return (
    <Card className="h-full space-y-4 border-neutral-800/70 bg-neutral-900/60 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-neutral-100">AI Trip Insight</h3>
          <p className="text-sm text-neutral-400">Configuration and cost insight for this trip</p>
        </div>
      </div>

      {headline ? (
        <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm text-indigo-50">
          {headline}
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-4 text-sm text-neutral-400">
          No AI insight available for this trip yet.
        </div>
      )}

      <div className="space-y-3">
        {bullets.map((bullet, idx) => (
          <div
            key={`${bullet.label}-${idx}`}
            className="flex gap-3 rounded-lg border border-neutral-800/70 bg-neutral-900/50 p-3"
          >
            <span
              className={`mt-0.5 inline-flex h-7 items-center gap-2 rounded-full border px-2 text-[11px] font-semibold uppercase tracking-wide ${
                bulletToneStyles[bullet.tone]
              }`}
            >
              {bullet.icon}
              {bullet.label}
            </span>
            <p className="text-sm text-neutral-200">{bullet.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

