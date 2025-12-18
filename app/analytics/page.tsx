"use client";

import { useMemo, useCallback } from "react";

import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertTriangle, TrendingUp, Brain, Lightbulb, TrendingDown, Target, Zap, RefreshCw, Calendar, Download } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/kpi-card";
import { fetchAnalytics } from "@/lib/api";
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { queryKeys } from "@/lib/query";

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.analytics,
    queryFn: fetchAnalytics,
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch AI insights when analytics data is available
  const { data: aiInsights, isPending: aiLoading, mutate: generateInsights } = useMutation({
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
      <div className="p-6">
        <Card className="border-red-900/50 bg-red-950/10">
          <CardHeader>
            <CardTitle className="text-red-400">Error Loading Analytics</CardTitle>
            <CardDescription>Unable to load analytics right now. Please try again shortly.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { summary, revenueTrend, marginByCategory, driverPerformance, lanePerformance, marginDistribution, alerts, updatedAt } =
    data;

  const insights = aiInsights?.insights;

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-black/20">
      {/* Header & Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics Dashboard</h1>
          <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
            <span>{summary.periodLabel}</span>
            <span>•</span>
            <span>Last updated {formatDateTime(updatedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 bg-zinc-900 border-zinc-800 hover:bg-zinc-800">
            <Calendar className="mr-2 h-4 w-4 text-zinc-400" />
            <span>This Month</span>
          </Button>
          <Button variant="outline" size="sm" className="h-9 bg-zinc-900 border-zinc-800 hover:bg-zinc-800">
            <Download className="mr-2 h-4 w-4 text-zinc-400" />
            <span>Export</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4 text-zinc-400" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          subtitle="Booked linehaul + FSC"
          trend="up"
          variant="default"
        />
        <KPICard
          label="Total Cost"
          value={formatCurrency(summary.totalCost)}
          subtitle="Fuel, equipment, labor"
          variant="default"
        />
        <KPICard
          label="Net Margin"
          value={formatPercent(summary.marginPercent)}
          subtitle={`${formatCurrency(summary.totalRevenue - summary.totalCost)} profit`}
          variant={summary.marginPercent >= 20 ? "success" : summary.marginPercent >= 15 ? "warning" : "danger"}
          trend={summary.marginPercent >= 15 ? "up" : "down"}
        />
        <KPICard
          label="RPM / CPM"
          value={`$${summary.avgRatePerMile.toFixed(2)}`}
          subtitle={`Cost: $${summary.avgCostPerMile.toFixed(2)} / mi`}
          variant="info"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Column: Charts & Detailed Analysis */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Revenue Trend Chart */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Revenue vs Cost Trend</CardTitle>
                <CardDescription>Weekly financial performance with margin overlay</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800">
                <TrendingUp className="size-4 text-blue-400" />
                <span>{formatCurrency(revenueTotals.revenue)} revenue captured</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      stroke="#52525b" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#52525b"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${Math.round((value as number) / 1000)}k`}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#52525b"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#27272a", opacity: 0.4 }}
                      contentStyle={{ background: "#18181b", borderRadius: "0.5rem", border: "1px solid #27272a", color: "#e4e4e7" }}
                      formatter={(value, name) => {
                        if (name === "revenue" || name === "cost") return [formatCurrency(Number(value)), name === "revenue" ? "Revenue" : "Cost"];
                        if (name === "marginPercent") return [formatPercent(Number(value)), "Margin %"];
                        return [value, name];
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                    <Area yAxisId="left" type="monotone" dataKey="cost" name="Cost" stroke="#71717a" fill="#71717a" fillOpacity={0.1} strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="marginPercent" name="Margin %" stroke="#facc15" strokeWidth={2} dot={{ r: 3, fill: "#facc15" }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Margin Composition Row */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-base">Margin by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marginByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis dataKey="category" stroke="#52525b" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={0} />
                      <YAxis stroke="#52525b" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 11 }} />
                      <Tooltip cursor={{ fill: "#27272a", opacity: 0.4 }} contentStyle={{ background: "#18181b", border: "1px solid #27272a", color: "#e4e4e7" }} />
                      <Bar dataKey="marginPercent" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-base">Margin Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marginDistribution} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                      <XAxis type="number" stroke="#52525b" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="band" stroke="#52525b" tickLine={false} axisLine={false} width={60} tick={{ fontSize: 11 }} />
                      <Tooltip cursor={{ fill: "#27272a", opacity: 0.4 }} contentStyle={{ background: "#18181b", border: "1px solid #27272a", color: "#e4e4e7" }} />
                      <Bar dataKey="trips" fill="#71717a" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Insights & Lists */}
        <div className="space-y-6">
          
          {/* AI Insights Panel */}
          {insights ? (
             <Card className="border-indigo-500/30 bg-indigo-950/10">
               <CardHeader className="pb-3">
                 <div className="flex items-center gap-2">
                   <Brain className="size-5 text-indigo-400" />
                   <CardTitle className="text-indigo-100">AI Insights</CardTitle>
                 </div>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Health Score</span>
                    <span className="font-bold text-white">{insights.keyMetrics?.healthScore || 0}/100</span>
                 </div>
                 <div className="space-y-3">
                   {insights.opportunities?.slice(0, 2).map((opp: any, i: number) => (
                     <div key={i} className="flex gap-3 p-3 rounded bg-indigo-950/30 border border-indigo-500/20">
                       <Lightbulb className="size-4 text-amber-400 shrink-0 mt-0.5" />
                       <p className="text-xs text-indigo-200 leading-relaxed">{opp.description}</p>
                     </div>
                   ))}
                 </div>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="w-full text-indigo-300 hover:text-indigo-200 hover:bg-indigo-900/50 h-8 text-xs"
                   onClick={handleGenerateInsights}
                 >
                   {aiLoading ? "Analyzing..." : "Refresh Analysis"}
                 </Button>
               </CardContent>
             </Card>
          ) : (
            <Card className="border-zinc-800 bg-zinc-900/50">
               <CardContent className="pt-6 text-center">
                  <Button onClick={handleGenerateInsights} disabled={aiLoading} variant="outline" size="sm">
                    {aiLoading ? "Generating..." : "Generate AI Insights"}
                  </Button>
               </CardContent>
            </Card>
          )}

          {/* Driver Performance List */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Drivers</CardTitle>
              <CardDescription>Ranked by margin contribution</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="space-y-1">
                {driverPerformance.slice(0, 5).map((driver) => (
                  <div key={driver.driverId} className="flex items-center justify-between px-5 py-2 hover:bg-zinc-800/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{driver.driverName}</p>
                      <p className="text-xs text-zinc-500">{driver.trips} trips</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${driver.marginPercent >= 20 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                        {formatPercent(driver.marginPercent)}
                      </p>
                      <p className="text-xs text-zinc-500">{formatCurrency(driver.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
               {alerts.length === 0 ? (
                 <p className="px-5 py-4 text-sm text-zinc-500">No active alerts.</p>
               ) : (
                 <div className="space-y-1">
                   {alerts.slice(0, 5).map((alert) => (
                     <div key={alert.id} className="flex gap-3 px-5 py-3 hover:bg-zinc-800/50 border-l-2 border-transparent hover:border-zinc-700">
                       <AlertTriangle className={`size-4 shrink-0 ${alert.severity === 'alert' ? 'text-red-400' : 'text-amber-400'}`} />
                       <div>
                         <p className="text-sm text-zinc-300 leading-snug">{alert.title}</p>
                         <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{alert.description}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </CardContent>
          </Card>

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
                    <Chip tone={prediction.confidence === "high" ? "ok" : prediction.confidence === "medium" ? "warn" : "default"}>
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
                    <Chip tone={rec.priority === "high" ? "alert" : rec.priority === "medium" ? "warn" : "default"}>
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

