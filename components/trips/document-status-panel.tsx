"use client";

import {
  FileCheck,
  Receipt,
  Globe,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DocumentStatusPanelProps {
  podStatus?: "uploaded" | "pending" | "not_tracked" | null;
  billingStatus?: "pending" | "invoiced" | "paid" | "overdue" | null;
  borderCrossings?: number;
  customsStatus?: "cleared" | "pending" | "flagged" | "not_required" | null;
  pickupLocation?: string;
  dropoffLocation?: string;
  className?: string;
}

type StatusVariant = "success" | "warning" | "error" | "neutral" | "info";

function StatusBadge({
  label,
  status,
  icon: Icon,
}: {
  label: string;
  status: StatusVariant;
  icon: React.ElementType;
}) {
  const statusStyles: Record<StatusVariant, string> = {
    success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    error: "bg-red-500/20 text-red-300 border-red-500/30",
    neutral: "bg-neutral-700/50 text-neutral-400 border-neutral-600/50",
    info: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };

  const iconStyles: Record<StatusVariant, string> = {
    success: "text-emerald-400",
    warning: "text-amber-400",
    error: "text-red-400",
    neutral: "text-neutral-500",
    info: "text-blue-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
        statusStyles[status]
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", iconStyles[status])} />
      {label}
    </span>
  );
}

function detectCrossBorder(
  pickup?: string,
  dropoff?: string
): boolean {
  if (!pickup || !dropoff) return false;

  const pickupLower = pickup.toLowerCase();
  const dropoffLower = dropoff.toLowerCase();

  const canadaKeywords = [
    "canada",
    "ontario",
    "quebec",
    "qc",
    " on,",
    " on ",
    "bc",
    "alberta",
    "manitoba",
    "saskatchewan",
    "toronto",
    "montreal",
    "vancouver",
    "calgary",
    "edmonton",
    "winnipeg",
  ];

  const usaKeywords = [
    "usa",
    "united states",
    "michigan",
    "ohio",
    "new york",
    "illinois",
    "pennsylvania",
    "washington",
    "texas",
    "california",
    "florida",
    "detroit",
    "chicago",
    "buffalo",
  ];

  const pickupIsCanada = canadaKeywords.some((k) => pickupLower.includes(k));
  const pickupIsUSA = usaKeywords.some((k) => pickupLower.includes(k));
  const dropoffIsCanada = canadaKeywords.some((k) => dropoffLower.includes(k));
  const dropoffIsUSA = usaKeywords.some((k) => dropoffLower.includes(k));

  return (pickupIsCanada && dropoffIsUSA) || (pickupIsUSA && dropoffIsCanada);
}

export function DocumentStatusPanel({
  podStatus,
  billingStatus,
  borderCrossings = 0,
  customsStatus,
  pickupLocation,
  dropoffLocation,
  className,
}: DocumentStatusPanelProps) {
  const isCrossBorder =
    borderCrossings > 0 || detectCrossBorder(pickupLocation, dropoffLocation);

  const getPodStatusConfig = (): { label: string; status: StatusVariant; icon: React.ElementType } => {
    switch (podStatus) {
      case "uploaded":
        return { label: "POD Uploaded", status: "success", icon: CheckCircle2 };
      case "pending":
        return { label: "POD Pending", status: "warning", icon: Clock };
      default:
        return { label: "Not Tracked", status: "neutral", icon: HelpCircle };
    }
  };

  const getBillingStatusConfig = (): { label: string; status: StatusVariant; icon: React.ElementType } => {
    switch (billingStatus) {
      case "paid":
        return { label: "Paid", status: "success", icon: CheckCircle2 };
      case "invoiced":
        return { label: "Invoiced", status: "info", icon: Receipt };
      case "overdue":
        return { label: "Overdue", status: "error", icon: AlertCircle };
      case "pending":
        return { label: "Pending", status: "warning", icon: Clock };
      default:
        return { label: "Not Set", status: "neutral", icon: HelpCircle };
    }
  };

  const getCustomsStatusConfig = (): { label: string; status: StatusVariant; icon: React.ElementType } => {
    if (!isCrossBorder) {
      return { label: "Not Required", status: "neutral", icon: HelpCircle };
    }
    switch (customsStatus) {
      case "cleared":
        return { label: "Cleared", status: "success", icon: CheckCircle2 };
      case "pending":
        return { label: "Pending Review", status: "warning", icon: Clock };
      case "flagged":
        return { label: "Flagged", status: "error", icon: AlertCircle };
      default:
        return { label: "Pending", status: "warning", icon: Clock };
    }
  };

  const podConfig = getPodStatusConfig();
  const billingConfig = getBillingStatusConfig();
  const customsConfig = getCustomsStatusConfig();

  return (
    <Card className={cn("border-neutral-800/70 bg-neutral-900/60", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-blue-400" />
          Document & Billing Status
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* POD Status */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-800/30">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-neutral-500" />
              <span className="text-sm text-neutral-300">POD Status</span>
            </div>
            <StatusBadge
              label={podConfig.label}
              status={podConfig.status}
              icon={podConfig.icon}
            />
          </div>

          {/* Invoice Status */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-800/30">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-neutral-500" />
              <span className="text-sm text-neutral-300">Invoice Status</span>
            </div>
            <StatusBadge
              label={billingConfig.label}
              status={billingConfig.status}
              icon={billingConfig.icon}
            />
          </div>

          {/* Customs Status (Cross-Border) */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-800/30">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-neutral-500" />
              <span className="text-sm text-neutral-300">Customs Status</span>
              {isCrossBorder && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Cross-Border
                </span>
              )}
            </div>
            <StatusBadge
              label={customsConfig.label}
              status={customsConfig.status}
              icon={customsConfig.icon}
            />
          </div>
        </div>

        {/* Border Crossing Count */}
        {borderCrossings > 0 && (
          <div className="mt-3 pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Border Crossings</span>
              <span className="text-neutral-300 font-medium">
                {borderCrossings} crossing{borderCrossings > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
