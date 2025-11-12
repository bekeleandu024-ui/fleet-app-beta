"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, TrendingUp } from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SectionBanner } from "@/components/section-banner";
import { StatChip } from "@/components/stat-chip";
import { Chip } from "@/components/ui/chip";
import { fetchAnalytics } from "@/lib/api";
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { queryKeys } from "@/lib/query";

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.analytics,
    queryFn: fetchAnalytics,
  });

  // Move useMemo BEFORE early returns to maintain hook order
  const revenueTotals = useMemo(
    () => {
      if (!data?.revenueTrend) {
        return { revenue: 0, cost: 0 };
      }
      return {
        revenue: data.revenueTrend.reduce((total, point) => total + point.revenue, 0),
        cost: data.revenueTrend.reduce((total, point) => total + point.cost, 0),
      };
    },
    [data?.revenueTrend]
  );

  if (isLoading && !data) {
    return <AnalyticsSkeleton />;
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Margin analytics" subtitle="Monitor profitability, trends, and driver performance." aria-live="polite">
        <p className="text-sm text-neutral-400">Unable to load analytics right now. Please try again shortly.</p>
      </SectionBanner>
    );
  }

  const { summary, revenueTrend, marginByCategory, driverPerformance, lanePerformance, marginDistribution, alerts, updatedAt } =
    data;

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
      <div className="grid gap-6">
        <SectionBanner
          title="Margin analytics"
          subtitle="Monitor margin health, revenue efficiency, and risk before month-end."
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
            <Chip tone="brand">{summary.periodLabel}</Chip>
            <span className="text-xs text-neutral-500">Last refreshed {formatDateTime(updatedAt)}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryStat label="Total revenue" value={formatCurrency(summary.totalRevenue)} helper="Booked linehaul + FSC" />
            <SummaryStat label="Total cost" value={formatCurrency(summary.totalCost)} helper="Fuel, equipment, labor" />
            <SummaryStat label="Total miles" value={formatNumber(summary.totalMiles)} helper="Revenue miles captured" />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <StatChip
              label="Margin"
              value={formatPercent(summary.marginPercent)}
              variant={summary.marginPercent >= 20 ? "ok" : summary.marginPercent >= 15 ? "warn" : "alert"}
              icon={<TrendingUp className="size-4" aria-hidden="true" />}
            />
            <StatChip label="RPM" value={`$${summary.avgRatePerMile.toFixed(2)}`} />
            <StatChip label="CPM" value={`$${summary.avgCostPerMile.toFixed(2)}`} />
            <StatChip
              label="Profitable trips"
              value={summary.profitableTrips}
              variant="ok"
              ariaLabel={`${summary.profitableTrips} profitable trips this period`}
            />
            <StatChip
              label="At-risk trips"
              value={summary.atRiskTrips}
              variant={summary.atRiskTrips > 12 ? "alert" : summary.atRiskTrips > 8 ? "warn" : "default"}
              ariaLabel={`${summary.atRiskTrips} trips with margin below target`}
            />
          </div>
        </SectionBanner>

        <SectionBanner
          title="Revenue vs cost trend"
          subtitle="Weekly totals with margin overlay"
          footer={
            <span className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-400" aria-hidden="true" />
              <span>
                {formatCurrency(revenueTotals.revenue)} revenue vs {formatCurrency(revenueTotals.cost)} cost captured this period.
              </span>
            </span>
          }
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="label" stroke="#5a5a5a" tickLine={false} axisLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="#5a5a5a"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${Math.round((value as number) / 1000)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#5a5a5a"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  cursor={{ fill: "#1a1a1a" }}
                  contentStyle={{ background: "#111827", borderRadius: "0.75rem", border: "1px solid #1f2937", color: "#e5e7eb" }}
                  formatter={(value, name) => {
                    if (name === "revenue" || name === "cost") {
                      return [formatCurrency(Number(value)), name === "revenue" ? "Revenue" : "Cost"];
                    }
                    if (name === "marginPercent") {
                      return [formatPercent(Number(value)), "Margin %"];
                    }
                    if (name === "miles") {
                      return [formatNumber(Number(value)), "Miles"];
                    }
                    return [value as string, name as string];
                  }}
                  labelFormatter={(label) => `Week: ${label}`}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={10} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#34d399"
                  fill="#10b98133"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="cost"
                  name="Cost"
                  stroke="#818cf8"
                  fill="#6366f133"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="marginPercent"
                  name="Margin %"
                  stroke="#facc15"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </SectionBanner>

        <SectionBanner
          title="Margin composition"
          subtitle="Segments generating the strongest contribution"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marginByCategory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="category" stroke="#5a5a5a" tickLine={false} axisLine={false} />
                  <YAxis stroke="#5a5a5a" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    cursor={{ fill: "#1a1a1a" }}
                    contentStyle={{ background: "#111827", borderRadius: "0.75rem", border: "1px solid #1f2937", color: "#e5e7eb" }}
                    formatter={(value, name) => {
                      if (name === "marginPercent") {
                        return [formatPercent(Number(value)), "Margin %"];
                      }
                      if (name === "revenue") {
                        return [formatCurrency(Number(value)), "Revenue"];
                      }
                      return [value as string, name as string];
                    }}
                  />
                  <Legend iconType="circle" iconSize={10} />
                  <Bar dataKey="marginPercent" name="Margin %" fill="#34d399" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={marginDistribution}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis type="number" stroke="#5a5a5a" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="band" stroke="#5a5a5a" tickLine={false} axisLine={false} width={70} />
                  <Tooltip
                    cursor={{ fill: "#1a1a1a" }}
                    contentStyle={{ background: "#111827", borderRadius: "0.75rem", border: "1px solid #1f2937", color: "#e5e7eb" }}
                    formatter={(value) => [formatNumber(Number(value)), "Trips"]}
                  />
                  <Bar dataKey="trips" name="Trips" fill="#60a5fa" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SectionBanner>
      </div>

      <div className="grid gap-6">
        <SectionBanner
          title="Driver margin leaders"
          subtitle="Top drivers ranked by contribution margin"
          dense
        >
          <ul className="space-y-3">
            {driverPerformance.map((driver) => (
              <li
                key={driver.driverId}
                className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-100">{driver.driverName}</p>
                    <p className="text-xs text-neutral-500">
                      {driver.trips} trips · {formatCurrency(driver.revenue)}
                    </p>
                  </div>
                  <StatChip
                    label="Margin"
                    value={formatPercent(driver.marginPercent)}
                    variant={driver.marginPercent >= summary.marginPercent ? "ok" : "warn"}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SectionBanner>

        <SectionBanner title="Lane profitability" subtitle="Focus lanes needing price or cost attention" dense>
          <ul className="space-y-3">
            {lanePerformance.map((lane) => (
              <li key={lane.lane} className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-100">{lane.lane}</p>
                    <p className="text-xs text-neutral-500">
                      {formatCurrency(lane.revenue)} · {formatNumber(lane.miles)} mi
                    </p>
                  </div>
                  <StatChip
                    label="Margin"
                    value={formatPercent(lane.marginPercent)}
                    variant={lane.marginPercent >= summary.marginPercent ? "ok" : lane.marginPercent >= 18 ? "warn" : "alert"}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SectionBanner>

        <SectionBanner title="Alerts" subtitle="AI surfaced risk and opportunities" dense>
          <ul className="space-y-3">
            {alerts.length === 0 ? (
              <li className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 text-sm text-neutral-400">
                No active analytics alerts.
              </li>
            ) : (
              alerts.map((alert) => (
                <li key={alert.id} className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-neutral-100">{alert.title}</p>
                      <p className="text-sm text-neutral-400">{alert.description}</p>
                    </div>
                    <StatChip
                      label="Severity"
                      value={alert.severity.toUpperCase()}
                      variant={severityToVariant(alert.severity)}
                      icon={<AlertTriangle className="size-4" aria-hidden="true" />}
                      ariaLabel={`Alert severity ${alert.severity}`}
                    />
                  </div>
                </li>
              ))
            )}
          </ul>
        </SectionBanner>
      </div>
    </div>
  );
}

function severityToVariant(severity: "info" | "warn" | "alert") {
  switch (severity) {
    case "warn":
      return "warn";
    case "alert":
      return "alert";
    default:
      return "default";
  }
}

function SummaryStat({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-neutral-100">{value}</p>
      {helper ? <p className="mt-1 text-xs text-neutral-500">{helper}</p> : null}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
      <SectionBanner title="Margin analytics" subtitle="Monitor profitability, trends, and driver performance." aria-live="polite">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 animate-pulse rounded-lg bg-neutral-900/60" />
          <div className="h-24 animate-pulse rounded-lg bg-neutral-900/60" />
          <div className="h-24 animate-pulse rounded-lg bg-neutral-900/60" />
        </div>
        <div className="h-10 animate-pulse rounded-full bg-neutral-900/60" />
      </SectionBanner>
      <SectionBanner title="Revenue vs cost trend" subtitle="Weekly totals with margin overlay">
        <div className="h-72 animate-pulse rounded-lg bg-neutral-900/60" />
      </SectionBanner>
      <SectionBanner title="Margin composition" subtitle="Segments generating the strongest contribution">
        <div className="h-64 animate-pulse rounded-lg bg-neutral-900/60" />
      </SectionBanner>
      <SectionBanner title="Driver margin leaders" subtitle="Top drivers ranked by contribution margin" dense>
        <div className="h-64 animate-pulse rounded-lg bg-neutral-900/60" />
      </SectionBanner>
      <SectionBanner title="Lane profitability" subtitle="Focus lanes needing price or cost attention" dense>
        <div className="h-64 animate-pulse rounded-lg bg-neutral-900/60" />
      </SectionBanner>
      <SectionBanner title="Alerts" subtitle="AI surfaced risk and opportunities" dense>
        <div className="h-40 animate-pulse rounded-lg bg-neutral-900/60" />
      </SectionBanner>
    </div>
  );
}
