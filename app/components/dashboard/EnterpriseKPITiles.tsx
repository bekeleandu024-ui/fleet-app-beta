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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

  const deltaLabel = delta ? `${delta.isPositive ? "+" : ""}${delta.value}% ${delta.period}` : null;
  const deltaBackground = delta
    ? `${delta.isPositive ? darkERPTheme.severity.good : darkERPTheme.severity.breach}20`
    : `${darkERPTheme.textMuted}20`;

  return (
    <div
      className="rounded-2xl text-left transition-all"
      style={{
        backgroundColor: darkERPTheme.surface,
        border: `1px solid ${darkERPTheme.border}`,
        padding: "32px",
        minHeight: "240px",
      }}
    >
      {/* Label */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: darkERPTheme.textMuted }}
          >
            {label}
          </div>
        </div>
        {target && (
          <span
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
            style={{
              backgroundColor: darkERPTheme.surface2,
              color: darkERPTheme.textMuted,
              border: `1px solid ${darkERPTheme.border}`,
            }}
          >
            Target {target}
          </span>
        )}
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
      {/* Sparkline */}
      {sparklineData && (
        <div className="h-14 -mx-2 mb-4">
          <ResponsiveContainer width="100%" height={56} minHeight={56}>
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
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full"
            style={{
              backgroundColor: deltaBackground,
              color: trendColor,
            }}
          >
            {delta.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : delta.value === 0 ? (
              <Minus className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {deltaLabel}
          </span>
          <span className="text-xs" style={{ color: darkERPTheme.textMuted }}>
            Compared to last {delta.period}
          </span>
        </div>
      )}
    </div>
  );
}
