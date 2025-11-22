import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "sm" | "lg";
  showIcon?: boolean;
}

const statusConfig: Record<string, { 
  color: string; 
  icon: string; 
  label?: string;
}> = {
  // Order statuses
  PendingInfo: { color: "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-sm shadow-amber-500/10", icon: "⏳" },
  Qualified: { color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-sm shadow-cyan-500/10", icon: "✓" },
  Booked: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-500/10", icon: "📋" },
  
  // Trip statuses
  Created: { color: "bg-slate-500/20 text-slate-400 border-slate-500/50 shadow-sm shadow-slate-500/10", icon: "○" },
  "In Progress": { color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-sm shadow-cyan-500/10", icon: "▶" },
  Completed: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-500/10", icon: "✓" },
  Closed: { color: "bg-slate-600/20 text-slate-500 border-slate-600/50 shadow-sm shadow-slate-600/10", icon: "✓✓" },
  "At Risk": { color: "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-sm shadow-rose-500/10", icon: "⚠" },
  
  // Customs statuses
  Pending: { color: "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-sm shadow-amber-500/10", icon: "⏳" },
  "In Review": { color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-sm shadow-cyan-500/10", icon: "👁" },
  Approved: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-500/10", icon: "✓" },
  Rejected: { color: "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-sm shadow-rose-500/10", icon: "✗" },
  Cleared: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-500/10", icon: "✓✓" },
  
  // Generic
  Active: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-500/10", icon: "●" },
  Inactive: { color: "bg-slate-600/20 text-slate-500 border-slate-600/50 shadow-sm shadow-slate-600/10", icon: "○" },
};

export function StatusBadge({ status, variant = "default", showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] || { 
    color: "bg-slate-500/20 text-slate-400 border-slate-500/50 shadow-sm shadow-slate-500/10", 
    icon: "○" 
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5"
  };

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold border transition-all duration-200",
        config.color,
        sizeClasses[variant]
      )}
    >
      {showIcon && <span className="text-xs">{config.icon}</span>}
      {config.label || status}
    </Badge>
  );
}

// Margin badge with color-coded thresholds
interface MarginBadgeProps {
  margin: number;
  variant?: "default" | "sm" | "lg";
}

export function MarginBadge({ margin, variant = "default" }: MarginBadgeProps) {
  const getMarginColor = (margin: number) => {
    if (margin >= 15) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-500/10";
    if (margin >= 8) return "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-sm shadow-amber-500/10";
    return "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-sm shadow-rose-500/10";
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5"
  };

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold border transition-all duration-200",
        getMarginColor(margin),
        sizeClasses[variant]
      )}
    >
      {margin.toFixed(1)}%
    </Badge>
  );
}

// Priority badge
interface PriorityBadgeProps {
  priority: "high" | "medium" | "low";
  variant?: "default" | "sm" | "lg";
}

export function PriorityBadge({ priority, variant = "default" }: PriorityBadgeProps) {
  const config = {
    high: { color: "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-sm shadow-rose-500/10", icon: "🔴" },
    medium: { color: "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-sm shadow-amber-500/10", icon: "🟡" },
    low: { color: "bg-slate-500/20 text-slate-400 border-slate-500/50 shadow-sm shadow-slate-500/10", icon: "⚪" },
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5"
  };

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold border capitalize transition-all duration-200",
        config[priority].color,
        sizeClasses[variant]
      )}
    >
      <span className="text-xs">{config[priority].icon}</span>
      {priority}
    </Badge>
  );
}

