"use client";

import { useMemo, useCallback } from "react";

import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertTriangle, TrendingUp, Brain, Lightbulb, TrendingDown, Target, Zap } from "lucide-react";
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
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  // Fetch AI insights when analytics data is available
  const { data: aiInsights, isLoading: aiLoading, mutate: generateInsights } = useMutation({
    mutationFn: async (analyticsData: any) => {
      const response = await fetch("/api/analytics/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analyticsData),
      });
      return response.json();
    },
  });

  // Generate AI insights when data is loaded
  const handleGenerateInsights = useCallback(() => {
    if (data) {
      generateInsights(data);
    }
  }, [data, generateInsights]);

  // Auto-generate insights when data loads
  useMemo(() => {
    if (data && !aiInsights && !aiLoading) {
      handleGenerateInsights();
    }
  }, [data, aiInsights, aiLoading, handleGenerateInsights]);

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
        <p className="text-sm text-zinc-400">Unable to load analytics right now. Please try again shortly.</p>
      </SectionBanner>
    );
  }

  const { summary, revenueTrend, marginByCategory, driverPerformance, lanePerformance, marginDistribution, alerts, updatedAt } =
    data;

  const insights = aiInsights?.insights;

  return (
    <div className="grid gap-6">
      {/* AI Insights Section - Full Width */}
      {insights && (
        <AIInsightsSection 
          insights={insights} 
          isLoading={aiLoading} 
          onRefresh={handleGenerateInsights}
        />
      )}

      {/* Main Analytics Grid */}
      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <div className="grid gap-6">
          <SectionBanner
            title="Margin analytics"
            subtitle="Monitor margin health, revenue efficiency, and risk before month-end."
            aria-live="polite"
            collapsible
          >
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <Chip tone="brand">{summary.periodLabel}</Chip>
            <span className="text-xs text-zinc-500">Last refreshed {formatDateTime(updatedAt)}</span>
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
          collapsible
          footer={
            <span className="flex items-center gap-2">
              <TrendingUp className="size-4 text-blue-400" aria-hidden="true" />
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
                  stroke="#3b82f6"
                  fill="#3b82f633"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="cost"
                  name="Cost"
                  stroke="#a1a1aa"
                  fill="#a1a1aa33"
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
          collapsible
          defaultOpen={false}
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
                  <Bar dataKey="marginPercent" name="Margin %" fill="#3b82f6" radius={[6, 6, 0, 0]} />
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
                  <Bar dataKey="trips" name="Trips" fill="#a1a1aa" radius={[0, 6, 6, 0]} />
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
          collapsible
          defaultOpen={false}
        >
          <ul className="space-y-3">
            {driverPerformance.map((driver) => (
              <li
                key={driver.driverId}
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{driver.driverName}</p>
                    <p className="text-xs text-zinc-500">
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

        <SectionBanner title="Lane profitability" subtitle="Focus lanes needing price or cost attention" dense collapsible defaultOpen={false}>
          <ul className="space-y-3">
            {lanePerformance.map((lane) => (
              <li key={lane.lane} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{lane.lane}</p>
                    <p className="text-xs text-zinc-500">
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

        <SectionBanner title="Alerts" subtitle="AI surfaced risk and opportunities" dense collapsible defaultOpen={false}>
          <ul className="space-y-3">
            {alerts.length === 0 ? (
              <li className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
                No active analytics alerts.
              </li>
            ) : (
              alerts.map((alert) => (
                <li key={alert.id} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-zinc-100">{alert.title}</p>
                      <p className="text-sm text-zinc-400">{alert.description}</p>
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
    </div>
  );
}

// AI Insights Section Component
function AIInsightsSection({ 
  insights, 
  isLoading, 
  onRefresh 
}: { 
  insights: any; 
  isLoading: boolean; 
  onRefresh: () => void;
}) {
  if (isLoading) {
    return (
      <SectionBanner
        title="AI-Powered Insights"
        subtitle="Claude AI is analyzing your fleet data..."
        aria-live="polite"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-32 animate-pulse rounded-lg bg-zinc-900/60" />
          <div className="h-32 animate-pulse rounded-lg bg-zinc-900/60" />
          <div className="h-32 animate-pulse rounded-lg bg-zinc-900/60" />
        </div>
      </SectionBanner>
    );
  }

  const healthScore = insights.keyMetrics?.healthScore || 0;
  const riskLevel = insights.keyMetrics?.riskLevel || "medium";

  return (
    <div className="grid gap-6">
      {/* Executive Summary */}
      <SectionBanner
        title="AI-Powered Insights"
        subtitle="Claude AI analysis of your fleet performance"
        aria-live="polite"
        collapsible
        defaultOpen={false}
      >
        <div className="flex items-center gap-2 mb-4">
          <Brain className="size-5 text-blue-400" aria-hidden="true" />
          <button
            onClick={onRefresh}
            className="text-sm text-blue-400 hover:text-blue-300"
            aria-label="Refresh AI insights"
          >
            Refresh Insights
          </button>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-linear-to-br from-blue-950/40 to-black/60 p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-lg font-semibold text-zinc-100 mb-2">Executive Summary</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{insights.executiveSummary}</p>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-20">
              <div className="text-3xl font-bold text-blue-400">{healthScore}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wide">Health Score</div>
              <StatChip
                label="Risk"
                value={riskLevel.toUpperCase()}
                variant={riskLevel === "high" ? "alert" : riskLevel === "medium" ? "warn" : "ok"}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <InsightCard
            icon={<TrendingUp className="size-5 text-blue-400" />}
            title="Trend Analysis"
            items={[
              { label: "Revenue", value: insights.trendAnalysis?.revenue },
              { label: "Margin", value: insights.trendAnalysis?.margin },
              { label: "Prediction", value: insights.trendAnalysis?.prediction },
            ]}
          />
          <InsightCard
            icon={<Target className="size-5 text-yellow-400" />}
            title="Performance"
            items={[
              { label: "Efficiency", value: insights.keyMetrics?.efficiency },
              { label: "Profitability", value: insights.keyMetrics?.profitability },
            ]}
          />
          <InsightCard
            icon={<Lightbulb className="size-5 text-blue-400" />}
            title="Top Recommendation"
            items={
              insights.strategicRecommendations?.[0]
                ? [
                    { label: "Action", value: insights.strategicRecommendations[0].action },
                    { label: "Impact", value: insights.strategicRecommendations[0].expectedImpact },
                    { label: "Timeframe", value: insights.strategicRecommendations[0].timeframe },
                  ]
                : [{ label: "Status", value: "No recommendations at this time" }]
            }
          />
        </div>
      </SectionBanner>

      {/* Anomaly Detection */}
      {insights.anomalyDetection && insights.anomalyDetection.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <SectionBanner title="Anomaly Detection" subtitle="AI-detected issues requiring attention" dense collapsible defaultOpen={false}>
            <ul className="space-y-3">
              {insights.anomalyDetection.map((anomaly: any, idx: number) => (
                <li key={idx} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold text-zinc-100">{anomaly.finding}</p>
                    <StatChip
                      label={anomaly.type}
                      value={anomaly.severity.toUpperCase()}
                      variant={anomaly.severity === "critical" ? "alert" : anomaly.severity === "warning" ? "warn" : "default"}
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mb-2">{anomaly.impact}</p>
                  <div className="flex items-start gap-2 text-xs text-blue-400">
                    <Lightbulb className="size-3 mt-0.5 shrink-0" />
                    <span>{anomaly.recommendation}</span>
                  </div>
                </li>
              ))}
            </ul>
          </SectionBanner>

          {/* Predictions */}
          <SectionBanner title="Predictions" subtitle="AI forecasts based on current trends" dense collapsible defaultOpen={false}>
            <ul className="space-y-3">
              {insights.predictions?.map((prediction: any, idx: number) => (
                <li key={idx} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold text-zinc-100 capitalize">{prediction.metric} Forecast</p>
                    <Chip tone={prediction.confidence === "high" ? "ok" : prediction.confidence === "medium" ? "warn" : "neutral"}>
                      {prediction.confidence}
                    </Chip>
                  </div>
                  <p className="text-xs text-zinc-300 mb-2">{prediction.forecast}</p>
                  <p className="text-xs text-zinc-500">{prediction.reasoning}</p>
                </li>
              ))}
            </ul>
          </SectionBanner>
        </div>
      )}

      {/* Strategic Recommendations */}
      {insights.strategicRecommendations && insights.strategicRecommendations.length > 0 && (
        <SectionBanner
          title="Strategic Recommendations"
          subtitle="AI-generated action items ranked by priority"
          dense
          collapsible
          defaultOpen={false}
        >
          <ul className="space-y-3">
            {insights.strategicRecommendations.map((rec: any, idx: number) => (
              <li key={idx} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    <Zap
                      className={`size-4 mt-0.5 shrink-0 ${
                        rec.priority === "high"
                          ? "text-red-400"
                          : rec.priority === "medium"
                          ? "text-yellow-400"
                          : "text-blue-400"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{rec.action}</p>
                      <p className="text-xs text-zinc-400 mt-1">{rec.expectedImpact}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Chip tone={rec.priority === "high" ? "alert" : rec.priority === "medium" ? "warn" : "neutral"}>
                      {rec.priority}
                    </Chip>
                    <span className="text-xs text-zinc-500">{rec.timeframe}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </SectionBanner>
      )}

      {/* Detailed Insights Grid */}
      <SectionBanner title="Detailed Analysis" subtitle="Breakdown by category, driver, and lane" collapsible defaultOpen={false}>
        <div className="grid gap-4 md:grid-cols-3">
          {insights.categoryInsights && (
            <DetailedInsightCard
              title="Category Analysis"
              insights={[
                { label: "Strongest", value: insights.categoryInsights.strongest, icon: "✓" },
                { label: "Weakest", value: insights.categoryInsights.weakest, icon: "⚠" },
                { label: "Opportunity", value: insights.categoryInsights.opportunity, icon: "💡" },
              ]}
            />
          )}
          {insights.driverInsights && (
            <DetailedInsightCard
              title="Driver Insights"
              insights={[
                { label: "Top Performers", value: insights.driverInsights.topPerformers, icon: "🏆" },
                { label: "Improvement", value: insights.driverInsights.improvement, icon: "📈" },
                { label: "Retention", value: insights.driverInsights.retention, icon: "🔒" },
              ]}
            />
          )}
          {insights.laneInsights && (
            <DetailedInsightCard
              title="Lane Insights"
              insights={[
                { label: "Optimize", value: insights.laneInsights.optimize, icon: "🔧" },
                { label: "Expand", value: insights.laneInsights.expand, icon: "📊" },
                { label: "Review", value: insights.laneInsights.review, icon: "🔍" },
              ]}
            />
          )}
        </div>
      </SectionBanner>
    </div>
  );
}

function InsightCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: Array<{ label: string; value?: string }> }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="text-xs">
            <span className="text-zinc-500">{item.label}:</span>
            <p className="text-zinc-300 mt-0.5 leading-relaxed">{item.value || "N/A"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailedInsightCard({ title, insights }: { title: string; insights: Array<{ label: string; value: string; icon: string }> }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-sm font-semibold text-zinc-100 mb-3">{title}</p>
      <ul className="space-y-3">
        {insights.map((insight, idx) => (
          <li key={idx}>
            <div className="flex items-start gap-2">
              <span className="text-base shrink-0 mt-0.5">{insight.icon}</span>
              <div>
                <p className="text-xs font-medium text-zinc-400 mb-1">{insight.label}</p>
                <p className="text-xs text-zinc-300 leading-relaxed">{insight.value}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-zinc-100">{value}</p>
      {helper ? <p className="mt-1 text-xs text-zinc-500">{helper}</p> : null}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
      <SectionBanner title="Margin analytics" subtitle="Monitor profitability, trends, and driver performance." aria-live="polite">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 animate-pulse rounded-lg bg-zinc-900/60" />
          <div className="h-24 animate-pulse rounded-lg bg-zinc-900/60" />
          <div className="h-24 animate-pulse rounded-lg bg-zinc-900/60" />
        </div>
        <div className="h-10 animate-pulse rounded-full bg-zinc-900/60" />
      </SectionBanner>
      <SectionBanner title="Revenue vs cost trend" subtitle="Weekly totals with margin overlay">
        <div className="h-72 animate-pulse rounded-lg bg-zinc-900/60" />
      </SectionBanner>
      <SectionBanner title="Margin composition" subtitle="Segments generating the strongest contribution">
        <div className="h-64 animate-pulse rounded-lg bg-zinc-900/60" />
      </SectionBanner>
      <SectionBanner title="Driver margin leaders" subtitle="Top drivers ranked by contribution margin" dense>
        <div className="h-64 animate-pulse rounded-lg bg-zinc-900/60" />
      </SectionBanner>
      <SectionBanner title="Lane profitability" subtitle="Focus lanes needing price or cost attention" dense>
        <div className="h-64 animate-pulse rounded-lg bg-zinc-900/60" />
      </SectionBanner>
      <SectionBanner title="Alerts" subtitle="AI surfaced risk and opportunities" dense>
        <div className="h-40 animate-pulse rounded-lg bg-zinc-900/60" />
      </SectionBanner>
    </div>
  );
}

