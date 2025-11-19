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
  PendingInfo: { color: "bg-amber-500/20 text-amber-400 border-amber-500/40", icon: "⏳" },
  Qualified: { color: "bg-blue-500/20 text-blue-400 border-blue-500/40", icon: "✓" },
  Booked: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", icon: "📋" },
  
  // Trip statuses
  Created: { color: "bg-neutral-500/20 text-neutral-400 border-neutral-500/40", icon: "○" },
  "In Progress": { color: "bg-blue-500/20 text-blue-400 border-blue-500/40", icon: "▶" },
  Completed: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", icon: "✓" },
  Closed: { color: "bg-neutral-600/20 text-neutral-500 border-neutral-600/40", icon: "✓✓" },
  "At Risk": { color: "bg-red-500/20 text-red-400 border-red-500/40", icon: "⚠" },
  
  // Customs statuses
  Pending: { color: "bg-amber-500/20 text-amber-400 border-amber-500/40", icon: "⏳" },
  "In Review": { color: "bg-blue-500/20 text-blue-400 border-blue-500/40", icon: "👁" },
  Approved: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", icon: "✓" },
  Rejected: { color: "bg-red-500/20 text-red-400 border-red-500/40", icon: "✗" },
  Cleared: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", icon: "✓✓" },
  
  // Generic
  Active: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", icon: "●" },
  Inactive: { color: "bg-neutral-600/20 text-neutral-500 border-neutral-600/40", icon: "○" },
};

export function StatusBadge({ status, variant = "default", showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] || { 
    color: "bg-neutral-500/20 text-neutral-400 border-neutral-500/40", 
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
        "inline-flex items-center gap-1.5 font-medium border",
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
    if (margin >= 15) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    if (margin >= 8) return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    return "bg-red-500/20 text-red-400 border-red-500/40";
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5"
  };

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border",
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
    high: { color: "bg-red-500/20 text-red-400 border-red-500/40", icon: "🔴" },
    medium: { color: "bg-amber-500/20 text-amber-400 border-amber-500/40", icon: "🟡" },
    low: { color: "bg-neutral-500/20 text-neutral-400 border-neutral-500/40", icon: "⚪" },
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5"
  };

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border capitalize",
        config[priority].color,
        sizeClasses[variant]
      )}
    >
      <span className="text-xs">{config[priority].icon}</span>
      {priority}
    </Badge>
  );
}
