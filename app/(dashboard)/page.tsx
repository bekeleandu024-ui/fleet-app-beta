"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  PackageSearch, 
  TrendingUp, 
  DollarSign, 
  Truck,
  Users,
  Activity,
  Map as MapIcon,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

import { formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { DashboardMap } from "@/components/dashboard-map";

// Define the metrics interface based on our API response
interface DashboardMetrics {
  ordersWaiting: number;
  atRiskTrips: number;
  avgMargin: number;
  onTimePercent: number;
  activeDrivers: number;
  utilizationRate: number;
  totalRevenue: number;
  totalCost: number;
  netMargin: number;
}

export default function DashboardPage() {
  // Fetch real metrics from our direct-to-db endpoint
  const { data: metrics, isLoading, isError } = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/metrics");
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !metrics) {
    return (
      <div className="p-6 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <p>Unable to load live dashboard metrics. Please check your connection.</p>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex flex-col gap-4 p-2 md:p-0">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">{currentDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-zinc-400">System Operational</span>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KPICard 
          label="Revenue (MTD)" 
          value={`$${formatNumber(metrics.totalRevenue)}`} 
          icon={DollarSign}
          trend="neutral"
        />
        <KPICard 
          label="Net Margin" 
          value={`$${formatNumber(metrics.netMargin)}`} 
          icon={Activity}
          trend={metrics.netMargin >= 0 ? "up" : "down"}
          color={metrics.netMargin >= 0 ? "emerald" : "rose"}
        />
        <KPICard 
          label="Avg Margin %" 
          value={`${metrics.avgMargin.toFixed(1)}%`} 
          icon={TrendingUp}
          trend={metrics.avgMargin >= 15 ? "up" : "down"}
          subtext="Target: 15%"
        />
        <KPICard 
          label="Active Drivers" 
          value={metrics.activeDrivers.toString()} 
          icon={Users}
          color="blue"
        />
        <KPICard 
          label="Utilization" 
          value={`${metrics.utilizationRate.toFixed(1)}%`} 
          icon={Truck}
          color={metrics.utilizationRate >= 80 ? "emerald" : "amber"}
        />
        <KPICard 
          label="On-Time %" 
          value={`${metrics.onTimePercent.toFixed(1)}%`} 
          icon={CheckCircle2}
          color={metrics.onTimePercent >= 90 ? "emerald" : "amber"}
          subtext="Target: 90%"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        
        {/* Left Column: Operations (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* Critical Alerts */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AlertBox 
              title="At-Risk Trips" 
              count={metrics.atRiskTrips} 
              icon={AlertTriangle}
              type="danger"
              description="Trips delayed or missing ETA updates"
              link="/trips?filter=late"
            />
            <AlertBox 
              title="Orders Waiting" 
              count={metrics.ordersWaiting} 
              icon={PackageSearch}
              type="warning"
              description="New orders requiring dispatch"
              link="/orders"
            />
          </div>

          {/* Live Network Map */}
          <DashboardMap />
        </div>

        {/* Right Column: Financials (1/3 width) */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden h-full">
            <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
              <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-zinc-500" />
                Financial Overview
              </h3>
            </div>
            <div className="p-5 space-y-8">
              {/* Revenue Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Total Revenue</span>
                  <span className="text-zinc-200 font-mono">${formatNumber(metrics.totalRevenue)}</span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500/80 w-full" />
                </div>
              </div>

              {/* Cost Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Total Cost</span>
                  <span className="text-zinc-200 font-mono">${formatNumber(metrics.totalCost)}</span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500/80" 
                    style={{ width: `${Math.min((metrics.totalCost / (metrics.totalRevenue || 1)) * 100, 100)}%` }} 
                  />
                </div>
              </div>

              {/* Margin Summary */}
              <div className="pt-4 border-t border-zinc-800/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500">Net Margin</span>
                  <span className={`text-sm font-bold font-mono ${metrics.netMargin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    ${formatNumber(metrics.netMargin)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Margin %</span>
                  <span className={`text-sm font-bold font-mono ${metrics.avgMargin >= 15 ? "text-emerald-400" : "text-amber-400"}`}>
                    {metrics.avgMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Sub-components ---

function KPICard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  color = "zinc",
  subtext
}: { 
  label: string; 
  value: string; 
  icon: any; 
  trend?: "up" | "down" | "neutral";
  color?: "zinc" | "emerald" | "rose" | "blue" | "amber";
  subtext?: string;
}) {
  const colorStyles = {
    zinc: "text-zinc-400",
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    blue: "text-blue-400",
    amber: "text-amber-400",
  };

  return (
    <div className="flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-4 shadow-sm hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{label}</span>
        <Icon className={`h-4 w-4 ${colorStyles[color]}`} />
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-xl font-bold font-mono ${colorStyles[color]}`}>{value}</span>
        {trend && (
          <div className={`flex items-center ${trend === "up" ? "text-emerald-500" : trend === "down" ? "text-rose-500" : "text-zinc-500"}`}>
            {trend === "up" && <ArrowUpRight className="h-4 w-4" />}
            {trend === "down" && <ArrowDownRight className="h-4 w-4" />}
          </div>
        )}
      </div>
      {subtext && <div className="mt-1 text-[10px] text-zinc-600">{subtext}</div>}
    </div>
  );
}

function AlertBox({ 
  title, 
  count, 
  icon: Icon, 
  type, 
  description,
  link
}: { 
  title: string; 
  count: number; 
  icon: any; 
  type: "danger" | "warning"; 
  description: string;
  link: string;
}) {
  const styles = type === "danger" 
    ? "border-rose-900/30 bg-rose-950/10 hover:bg-rose-950/20" 
    : "border-amber-900/30 bg-amber-950/10 hover:bg-amber-950/20";
  
  const textStyles = type === "danger" ? "text-rose-400" : "text-amber-400";
  const iconStyles = type === "danger" ? "text-rose-500" : "text-amber-500";

  return (
    <Link href={link} className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${styles}`}>
      <div className={`mt-1 rounded-full p-2 bg-black/20 ${iconStyles}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className={`text-sm font-bold ${textStyles}`}>{title}</h4>
          {count > 0 && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-black/40 ${textStyles}`}>
              {count}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-400">{description}</p>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-2 md:p-0">
      <div className="h-16 w-full animate-pulse rounded-lg bg-zinc-900/50" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-900/50" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-96 animate-pulse rounded-lg bg-zinc-900/50" />
        <div className="h-96 animate-pulse rounded-lg bg-zinc-900/50" />
      </div>
    </div>
  );
}

