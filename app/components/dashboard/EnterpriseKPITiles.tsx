"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { darkERPTheme } from "@/app/lib/theme-config";

interface KPITileProps {
  label: string;
  value: string | number;
  unit?: string;
  target?: string;
  delta?: {
    value: number;
    period: string;
    isPositive: boolean;
  };
  sparklineData?: number[];
}

export default function EnterpriseKPITiles() {
  // Mock sparkline data
  const generateSparkline = () =>
    Array.from({ length: 20 }, () => Math.random() * 100 + 50);

  const kpis: KPITileProps[] = [
    {
      label: "Active Trips",
      value: "24",
      unit: "trips",
      delta: { value: 12, period: "WoW", isPositive: true },
      sparklineData: generateSparkline(),
    },
    {
      label: "On-time %",
      value: "94.2",
      unit: "%",
      target: "95%",
      delta: { value: 2.1, period: "DoD", isPositive: true },
      sparklineData: generateSparkline(),
    },
    {
      label: "Available Drivers",
      value: "18",
      unit: "drivers",
      delta: { value: 5, period: "WoW", isPositive: false },
      sparklineData: generateSparkline(),
    },
    {
      label: "Utilization",
      value: "87.3",
      unit: "%",
      target: "85%",
      delta: { value: 3.2, period: "WoW", isPositive: true },
      sparklineData: generateSparkline(),
    },
    {
      label: "Today's Revenue",
      value: "24,580",
      unit: "$",
      target: "$30,000",
      delta: { value: 8.4, period: "vs Target", isPositive: false },
      sparklineData: generateSparkline(),
    },
    {
      label: "Exceptions",
      value: "7",
      unit: "issues",
      delta: { value: 3, period: "DoD", isPositive: false },
      sparklineData: generateSparkline(),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      {kpis.map((kpi, index) => (
        <KPITile key={index} {...kpi} />
      ))}
    </div>
  );
}

function KPITile({ label, value, unit, target, delta, sparklineData }: KPITileProps) {
  const formattedValue = unit === "$" ? `$${value}` : value;
  const displayUnit = unit !== "$" ? unit : "";

  const trendColor = delta
    ? delta.isPositive
      ? darkERPTheme.severity.good
      : darkERPTheme.severity.breach
    : darkERPTheme.textMuted;

  return (
    <button
      className="rounded-lg p-6 text-left transition-all focus:outline-none"
      style={{
        backgroundColor: darkERPTheme.surface,
        border: `1px solid ${darkERPTheme.border}`,
      }}
    >
      {/* Label */}
      <div
        className="text-xs font-medium mb-3 uppercase tracking-wide"
        style={{ color: darkERPTheme.textMuted }}
      >
        {label}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold" style={{ color: darkERPTheme.textPrimary }}>
          {formattedValue}
        </span>
        {displayUnit && (
          <span className="text-sm font-medium" style={{ color: darkERPTheme.textMuted }}>
            {displayUnit}
          </span>
        )}
      </div>

      {/* Target chip */}
      {target && (
        <div className="mb-3">
          <span
            className="inline-block px-2 py-1 text-xs font-medium rounded"
            style={{
              backgroundColor: darkERPTheme.surface2,
              color: darkERPTheme.textMuted,
            }}
          >
            Target: {target}
          </span>
        </div>
      )}

      {/* Sparkline */}
      {sparklineData && (
        <div className="h-10 -mx-2 mb-3">
          <ResponsiveContainer width="100%" height={40} minHeight={40}>
            <LineChart
              data={sparklineData.map((val) => ({ value: val }))}
              margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
            >
              <Line
                type="monotone"
                dataKey="value"
                stroke={darkERPTheme.brandAccent}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Delta */}
      {delta && (
        <div className="flex items-center gap-1 text-xs">
          {delta.isPositive ? (
            <TrendingUp className="h-3.5 w-3.5" style={{ color: trendColor }} />
          ) : delta.value === 0 ? (
            <Minus className="h-3.5 w-3.5" style={{ color: trendColor }} />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" style={{ color: trendColor }} />
          )}
          <span className="font-semibold" style={{ color: trendColor }}>
            {delta.isPositive ? "+" : ""}
            {delta.value}%
          </span>
          <span style={{ color: darkERPTheme.textMuted }}>{delta.period}</span>
        </div>
      )}
    </button>
  );
}
