import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const variantStyles = {
  default: "border-slate-800/70 bg-slate-900/60",
  success: "border-emerald-500/40 bg-emerald-950/40 shadow-emerald-500/10",
  warning: "border-amber-500/40 bg-amber-950/40 shadow-amber-500/10",
  danger: "border-rose-500/40 bg-rose-950/40 shadow-rose-500/10",
  info: "border-slate-600/40 bg-slate-900/60 shadow-slate-500/10",
};

const trendStyles = {
  up: "text-emerald-400",
  down: "text-rose-400",
  neutral: "text-slate-500",
};

export function KPICard({
  label,
  value,
  trend,
  trendValue,
  subtitle,
  variant = "default",
  className,
}: KPICardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <Card className={cn("p-5 rounded-xl", variantStyles[variant], className)}>
      <div className="space-y-3">
        {/* Label */}
        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
          {label}
        </p>

        {/* Value */}
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-bold text-white">{value}</p>
          
          {/* Trend Indicator */}
          {trend && (
            <div className={cn("flex items-center gap-1 text-sm font-semibold", trendStyles[trend])}>
              <TrendIcon className="h-4 w-4" />
              {trendValue && <span>{trendValue}</span>}
            </div>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-slate-400">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}

// Stat card with icon
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export function StatCard({ label, value, icon, description, className }: StatCardProps) {
  return (
    <Card className={cn("p-5 rounded-xl border-slate-800/70 bg-slate-900/60", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
            {label}
          </p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {description && (
            <p className="text-xs text-slate-400">{description}</p>
          )}
        </div>
        {icon && (
          <div className="text-slate-500 opacity-50">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// Metric card with comparison
interface MetricCardProps {
  label: string;
  current: string | number;
  previous?: string | number;
  unit?: string;
  className?: string;
}

export function MetricCard({ label, current, previous, unit, className }: MetricCardProps) {
  const calculateChange = () => {
    if (!previous || typeof current !== 'number' || typeof previous !== 'number') return null;
    
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    };
  };

  const change = calculateChange();

  return (
    <Card className={cn("p-5 rounded-xl border-slate-800/70 bg-slate-900/60", className)}>
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
          {label}
        </p>
        
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-white">
            {current}
            {unit && <span className="text-sm text-slate-400 ml-1">{unit}</span>}
          </p>
        </div>

        {change && (
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-xs font-semibold",
              change.isPositive ? "text-emerald-400" : "text-rose-400"
            )}>
              {change.isPositive ? "↑" : "↓"} {change.value}%
            </span>
            <span className="text-xs text-slate-500">vs previous</span>
          </div>
        )}
      </div>
    </Card>
  );
}

