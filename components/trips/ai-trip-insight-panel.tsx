import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Info,
  RouteIcon,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import type { TripDetail } from "@/lib/types";
import { formatCurrency, formatDurationHours, formatNumber } from "@/lib/format";
import type { getTripInsights } from "@/lib/ai-service";

const bulletToneStyles: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-200 border-blue-500/30",
  success: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
  warn: "bg-amber-500/10 text-amber-200 border-amber-500/30",
  alert: "bg-red-500/10 text-red-200 border-red-500/30",
};

type TripInsights = Awaited<ReturnType<typeof getTripInsights>>;

interface AiTripInsightPanelProps {
  trip: TripDetail;
  aiInsights?: TripInsights | null;
  loading?: boolean;
}

export function AiTripInsightPanel({ trip, aiInsights, loading }: AiTripInsightPanelProps) {
  if (loading) {
    return <Card className="h-full animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />;
  }

  const distance = aiInsights?.routeOptimization.distance ?? trip.metrics?.distanceMiles;
  const duration = aiInsights?.routeOptimization.duration ??
    (trip.metrics?.estDurationHours ? formatDurationHours(trip.metrics.estDurationHours) : undefined);
  const margin = aiInsights?.costAnalysis.margin ?? trip.metrics?.marginPct;
  const driverType = (aiInsights?.currentAssignment.driverType || trip.driverType || "COM").toUpperCase();
  const altRnr = aiInsights?.alternativeDrivers?.find((driver) => driver.driverType === "RNR");
  const altOo = aiInsights?.alternativeDrivers?.find((driver) => driver.driverType === "OO");
  const altCom = aiInsights?.alternativeDrivers?.find((driver) => driver.driverType === "COM");
  const currentDriverCost = aiInsights?.currentAssignment.estimatedCost;
  const distanceNum = typeof distance === "string" ? Number.parseFloat(distance) : distance;

  const headline = buildHeadline({ driverType, distance: distanceNum, currentDriver: trip.driver, altRnr, altOo });
  const bullets = buildBullets({
    distance: distanceNum,
    duration,
    margin,
    driverType,
    currentDriver: trip.driver,
    altRnr,
    altCom,
    altOo,
    currentDriverCost,
    pickup: trip.pickup,
    delivery: trip.delivery,
  });

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

function buildHeadline({
  driverType,
  distance,
  currentDriver,
  altRnr,
  altOo,
}: {
  driverType: string;
  distance?: number;
  currentDriver?: string;
  altRnr?: TripInsights["alternativeDrivers"][number];
  altOo?: TripInsights["alternativeDrivers"][number];
}) {
  if (!distance) {
    return "Using available trip data to summarize configuration.";
  }
  const shortRun = distance < 200;

  if (driverType === "OO" && shortRun) {
    return "Owner-Operator is likely overkill for a short run – consider COM or RNR to improve margin.";
  }

  if (driverType === "COM" && shortRun) {
    return `Best configuration: keep ${currentDriver ?? "the assigned driver"} (COM) for this short run. Balanced cost and reliability.`;
  }

  if (driverType === "COM" && altRnr) {
    return "COM assignment is solid. RNR drivers could trim cost slightly but swap is optional for this load.";
  }

  if (driverType === "OO" && altRnr) {
    return `Switch to an RNR driver like ${altRnr.driverName} to bring costs closer to benchmark.`;
  }

  if (driverType === "OO" && altOo) {
    return `${currentDriver ?? "The assigned driver"} (OO) is premium; ensure service level justifies cost.`;
  }

  return "Trip configuration looks stable based on current telemetry and costing.";
}

function buildBullets({
  distance,
  duration,
  margin,
  driverType,
  currentDriver,
  altRnr,
  altCom,
  altOo,
  currentDriverCost,
  pickup,
  delivery,
}: {
  distance?: number;
  duration?: string;
  margin?: number;
  driverType: string;
  currentDriver?: string;
  altRnr?: TripInsights["alternativeDrivers"][number];
  altCom?: TripInsights["alternativeDrivers"][number];
  altOo?: TripInsights["alternativeDrivers"][number];
  currentDriverCost?: number;
  pickup?: string;
  delivery?: string;
}) {
  const bullets: Array<{ label: string; text: string; tone: keyof typeof bulletToneStyles; icon: ReactNode }> = [];

  bullets.push({
    label: "Trip Profile",
    text: `Short ${pickup ?? "origin"} → ${delivery ?? "destination"} run (~${distance ? Math.round(distance) : 120} mi, ${
      duration ?? "2-3h"
    }).`,
    tone: "info",
    icon: <RouteIcon className="h-3.5 w-3.5" />,
  });

  if (margin !== undefined) {
    const tone = margin >= 15 ? "success" : margin < 10 ? "alert" : "warn";
    const text = margin >= 15
      ? `Current margin of ${margin}% is healthy for this route type.`
      : `Margin of ${margin}% is tight – review rate or driver choice.`;
    bullets.push({ label: "Margin", text, tone, icon: <CircleDollarSign className="h-3.5 w-3.5" /> });
  }

  if (driverType === "COM" && altRnr && currentDriverCost) {
    const delta = currentDriverCost - altRnr.estimatedCost;
    bullets.push({
      label: "Driver Choice",
      text: `Keeping ${currentDriver ?? "driver"} (COM, ${formatCurrency(currentDriverCost)}) is balanced. RNR drivers could save about ${
        formatCurrency(delta)
      } for this trip.`,
      tone: "info",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    });
  } else if (driverType === "OO" && currentDriverCost && altCom) {
    const delta = currentDriverCost - altCom.estimatedCost;
    bullets.push({
      label: "Driver Choice",
      text: `Owner-Operator adds ${formatCurrency(delta)} extra driver cost on this lane – consider COM or RNR unless premium service is needed.`,
      tone: "warn",
      icon: <TriangleAlert className="h-3.5 w-3.5" />,
    });
  } else {
    bullets.push({
      label: "Driver Choice",
      text: `${currentDriver ?? "Driver"} (${driverType}) is suitable for the current requirements.`,
      tone: "info",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    });
  }

  if (distance && distance > 300 && pickup?.toLowerCase().includes("guelph") && delivery?.toLowerCase().includes("buffalo")) {
    bullets.push({
      label: "Route Check",
      text: "Verify route distance – estimate looks too high for this lane. Expected distance is ~120 mi via QEW / Peace Bridge.",
      tone: "warn",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    });
  }

  bullets.push({
    label: "Cost",
    text: `Estimated driver cost ${formatCurrency(currentDriverCost ?? altCom?.estimatedCost ?? altRnr?.estimatedCost ?? 0)}; distance ${
      formatNumber(distance ?? 0)
    } mi supports a quick-turn load.`,
    tone: "info",
    icon: <Info className="h-3.5 w-3.5" />,
  });

  return bullets;
}

