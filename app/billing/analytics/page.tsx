"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  FileCheck,
  Receipt,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SectionBanner } from "@/components/section-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/kpi-card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BillingAnalytics {
  summary: {
    pendingCount: number;
    auditedCount: number;
    invoicedCount: number;
    paidCount: number;
    totalQuoted: number;
    totalFinal: number;
    avgVariance: number;
    avgVariancePct: number;
    netVariance: number;
  };
  recentVariance: Array<{
    id: string;
    orderNumber: string;
    customer: string;
    quotedRate: number;
    finalAmount: number;
    billingStatus: string;
    finalizedAt: string | null;
    notes: string | null;
    varianceAmount: number;
    variancePct: number;
  }>;
  accessorialBreakdown: Array<{
    type: string;
    count: number;
    totalAmount: number;
    avgAmount: number;
  }>;
  varianceDistribution: Array<{
    bucket: string;
    count: number;
  }>;
}

async function fetchBillingAnalytics(): Promise<BillingAnalytics> {
  const res = await fetch("/api/billing/analytics");
  if (!res.ok) throw new Error("Failed to fetch billing analytics");
  return res.json();
}

export default function BillingAnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["billing-analytics"],
    queryFn: fetchBillingAnalytics,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <BillingSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <Card className="border-red-900/50 bg-red-950/10">
          <CardHeader>
            <CardTitle className="text-red-400">Error Loading Billing Analytics</CardTitle>
            <CardDescription>Unable to load billing data. Please try again.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { summary, recentVariance, accessorialBreakdown, varianceDistribution } = data;

  // Color mapping for variance distribution
  const bucketColors: Record<string, string> = {
    "Under 10%+": "#ef4444",
    "Under 5-10%": "#f97316", 
    "Under 0-5%": "#eab308",
    "No Variance": "#71717a",
    "Over 0-5%": "#22c55e",
    "Over 5-10%": "#10b981",
    "Over 10%+": "#059669",
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-black/20">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Billing Analytics</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Two-Stage Revenue: Quoted Rate vs Final Billable Amount
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/trips/closed">
            <Button size="sm" variant="subtle" className="h-9">
              <FileCheck className="mr-2 h-4 w-4 text-zinc-400" />
              <span>Pending Audit Queue</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Pipeline */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Billing Pipeline</CardTitle>
          <CardDescription>Orders by billing status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Clock className="h-6 w-6 text-amber-400 mb-2" />
              <span className="text-2xl font-bold text-amber-300">{summary.pendingCount}</span>
              <span className="text-xs text-zinc-400">Pending Audit</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <FileCheck className="h-6 w-6 text-blue-400 mb-2" />
              <span className="text-2xl font-bold text-blue-300">{summary.auditedCount}</span>
              <span className="text-xs text-zinc-400">Audited</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Receipt className="h-6 w-6 text-purple-400 mb-2" />
              <span className="text-2xl font-bold text-purple-300">{summary.invoicedCount}</span>
              <span className="text-xs text-zinc-400">Invoiced</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 mb-2" />
              <span className="text-2xl font-bold text-emerald-300">{summary.paidCount}</span>
              <span className="text-xs text-zinc-400">Paid</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Quoted"
          value={formatCurrency(summary.totalQuoted)}
          subtitle="Sum of all quoted rates"
          variant="default"
        />
        <KPICard
          label="Total Final Billable"
          value={formatCurrency(summary.totalFinal)}
          subtitle="After accessorials & audit"
          variant="default"
        />
        <KPICard
          label="Net Variance"
          value={formatCurrency(Math.abs(summary.netVariance))}
          subtitle={summary.netVariance >= 0 ? "Additional revenue captured" : "Revenue shortfall"}
          variant={summary.netVariance >= 0 ? "success" : "danger"}
          trend={summary.netVariance >= 0 ? "up" : "down"}
        />
        <KPICard
          label="Avg Variance %"
          value={formatPercent(Math.abs(summary.avgVariancePct))}
          subtitle={summary.avgVariancePct >= 0 ? "Avg over quoted" : "Avg under quoted"}
          variant={summary.avgVariancePct >= 0 ? "success" : "warning"}
          trend={summary.avgVariancePct >= 0 ? "up" : "down"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Variance Distribution */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-base">Variance Distribution</CardTitle>
            <CardDescription>How final amounts compare to quoted rates</CardDescription>
          </CardHeader>
          <CardContent>
            {varianceDistribution.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={varianceDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis 
                      dataKey="bucket" 
                      stroke="#52525b" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="#52525b" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      cursor={{ fill: "#27272a", opacity: 0.4 }} 
                      contentStyle={{ background: "#18181b", border: "1px solid #27272a", color: "#e4e4e7" }}
                      formatter={(value) => [value, "Orders"]}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                      {varianceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={bucketColors[entry.bucket] || "#3b82f6"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-zinc-500">
                No audited orders yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accessorial Breakdown */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-base">Accessorial Revenue</CardTitle>
            <CardDescription>Additional charges captured post-delivery</CardDescription>
          </CardHeader>
          <CardContent>
            {accessorialBreakdown.length > 0 ? (
              <div className="space-y-3">
                {accessorialBreakdown.map((acc) => (
                  <div key={acc.type} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                    <div>
                      <span className="text-sm font-medium text-zinc-200">
                        {acc.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-zinc-500 ml-2">
                        ({acc.count} charges)
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-emerald-400">
                        {formatCurrency(acc.totalAmount)}
                      </div>
                      <div className="text-xs text-zinc-500">
                        Avg: {formatCurrency(acc.avgAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-zinc-500">
                No accessorials recorded yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Variance Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base">Recent Audited Orders</CardTitle>
          <CardDescription>Latest finalized billing with variance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          {recentVariance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="text-left py-3 px-2 font-medium">Order</th>
                    <th className="text-left py-3 px-2 font-medium">Customer</th>
                    <th className="text-right py-3 px-2 font-medium">Quoted</th>
                    <th className="text-right py-3 px-2 font-medium">Final</th>
                    <th className="text-right py-3 px-2 font-medium">Variance</th>
                    <th className="text-center py-3 px-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVariance.map((order) => (
                    <tr key={order.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-3 px-2">
                        <Link 
                          href={`/orders/master?id=${order.id}`} 
                          className="text-blue-400 hover:underline font-medium"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-zinc-300">{order.customer}</td>
                      <td className="py-3 px-2 text-right text-zinc-400">
                        {formatCurrency(order.quotedRate)}
                      </td>
                      <td className="py-3 px-2 text-right text-zinc-200 font-medium">
                        {formatCurrency(order.finalAmount)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className={cn(
                          "flex items-center justify-end gap-1",
                          order.varianceAmount >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {order.varianceAmount >= 0 ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          <span>{formatCurrency(Math.abs(order.varianceAmount))}</span>
                          <span className="text-xs text-zinc-500">
                            ({order.variancePct >= 0 ? "+" : ""}{order.variancePct.toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          order.billingStatus === "AUDITED" && "bg-blue-500/20 text-blue-300",
                          order.billingStatus === "INVOICED" && "bg-purple-500/20 text-purple-300",
                          order.billingStatus === "PAID" && "bg-emerald-500/20 text-emerald-300"
                        )}>
                          {order.billingStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-500">
              No audited orders yet. Finalize billing from the{" "}
              <Link href="/trips/closed" className="text-blue-400 hover:underline ml-1">
                Closed Trips
              </Link>{" "}
              page.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-black/20">
      <div className="h-10 w-64 bg-zinc-800 rounded animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-zinc-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 bg-zinc-800/50 rounded-lg animate-pulse" />
        <div className="h-80 bg-zinc-800/50 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
