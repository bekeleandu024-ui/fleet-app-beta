import { cn } from "@/lib/utils";

interface MarginGaugeProps {
  margin: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function MarginGauge({ 
  margin = 0, 
  size = "md", 
  showLabel = true,
  className 
}: MarginGaugeProps) {
  // Safety check for invalid margin values
  const safeMargin = isNaN(margin) || !isFinite(margin) ? 0 : margin;
  
  // Determine color based on margin thresholds
  const getMarginColor = (margin: number) => {
    if (margin >= 15) return { color: "emerald", level: "excellent" };
    if (margin >= 8) return { color: "amber", level: "acceptable" };
    return { color: "red", level: "poor" };
  };

  const { color, level } = getMarginColor(safeMargin);

  const sizeConfig = {
    sm: { width: "w-32", height: "h-2", text: "text-xs" },
    md: { width: "w-48", height: "h-3", text: "text-sm" },
    lg: { width: "w-64", height: "h-4", text: "text-base" },
  };

  const config = sizeConfig[size];

  // Calculate fill percentage (max at 25% margin for visual purposes)
  const fillPercentage = Math.min((safeMargin / 25) * 100, 100);

  const colorClasses = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={cn("font-medium", config.text, {
            "text-emerald-400": color === "emerald",
            "text-amber-400": color === "amber",
            "text-red-400": color === "red",
          })}>
            {safeMargin.toFixed(1)}% Margin
          </span>
          <span className={cn("text-xs capitalize", {
            "text-emerald-400": color === "emerald",
            "text-amber-400": color === "amber",
            "text-red-400": color === "red",
          })}>
            {level}
          </span>
        </div>
      )}

      {/* Gauge bar */}
      <div className={cn(
        "relative rounded-full bg-neutral-800 overflow-hidden",
        config.width,
        config.height
      )}>
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
            colorClasses[color as keyof typeof colorClasses]
          )}
          style={{ width: `${fillPercentage}%` }}
        />
      </div>

      {/* Threshold markers */}
      <div className={cn("flex justify-between text-xs text-neutral-500", config.width)}>
        <span>0%</span>
        <span className="absolute left-1/3 -translate-x-1/2">8%</span>
        <span className="absolute left-3/5 -translate-x-1/2">15%</span>
        <span>25%+</span>
      </div>
    </div>
  );
}

// Circular gauge variant
interface CircularMarginGaugeProps {
  margin: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularMarginGauge({ 
  margin = 0, 
  size = 120, 
  strokeWidth = 8,
  className 
}: CircularMarginGaugeProps) {
  // Safety check for invalid margin values
  const safeMargin = isNaN(margin) || !isFinite(margin) ? 0 : margin;
  
  const getMarginColor = (margin: number) => {
    if (margin >= 15) return "#10b981"; // emerald-500
    if (margin >= 8) return "#f59e0b"; // amber-500
    return "#ef4444"; // red-500
  };

  const color = getMarginColor(safeMargin);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((safeMargin / 25) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-neutral-800"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">
          {safeMargin.toFixed(1)}%
        </span>
        <span className="text-xs text-neutral-500">Margin</span>
      </div>
    </div>
  );
}

