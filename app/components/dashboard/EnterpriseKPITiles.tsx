"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi, index) => (
        <KPITile key={index} {...kpi} />
      ))}
    </div>
  );
}

function KPITile({ label, value, unit, target, delta, sparklineData }: KPITileProps) {
  const formattedValue = unit === "$" ? `$${value}` : value;
  const displayUnit = unit !== "$" ? unit : "";

  return (
    <button className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500">
      {/* Label */}
      <div className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
        {label}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold text-gray-900">{formattedValue}</span>
        {displayUnit && (
          <span className="text-sm font-medium text-gray-500">{displayUnit}</span>
        )}
      </div>

      {/* Target chip */}
      {target && (
        <div className="mb-2">
          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded border border-gray-200">
            Target: {target}
          </span>
        </div>
      )}

      {/* Sparkline */}
      {sparklineData && (
        <div className="h-8 -mx-2 mb-2">
          <ResponsiveContainer width="100%" height={32} minHeight={32}>
            <LineChart data={sparklineData.map((val, i) => ({ value: val }))} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={1.5}
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
            <TrendingUp className="h-3 w-3 text-green-600" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-600" />
          )}
          <span
            className={`font-semibold ${
              delta.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {delta.isPositive ? "+" : ""}
            {delta.value}%
          </span>
          <span className="text-gray-500">{delta.period}</span>
        </div>
      )}
    </button>
  );
}
