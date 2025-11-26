"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  PackageSearch, 
  TrendingUp, 
  DollarSign, 
  Truck,
  Users,
  Activity,
  Map as MapIcon
} from "lucide-react";

import { SectionBanner } from "@/components/section-banner";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

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
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !metrics) {
    return (
      <div className="flex flex-col gap-6">
        <SectionBanner title="Network Pulse" subtitle="Key performance indicators for the fleet." aria-live="polite">
          <div className="p-6 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <p>Unable to load live dashboard metrics. Please check your connection.</p>
            </div>
          </div>
        </SectionBanner>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Immediate Triage - Critical Alerts */}
      <SectionBanner title="Morning Health Check" subtitle="Immediate attention items" dense aria-live="polite">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* At-Risk Trips */}
          <Card className={`p-5 rounded-lg backdrop-blur border shadow-lg transition-all duration-200 ${
            metrics.atRiskTrips > 0 
              ? "bg-rose-950/20 border-rose-500/50 shadow-rose-900/20" 
              : "bg-zinc-900/40 border-zinc-800/70 shadow-black/40"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${metrics.atRiskTrips > 0 ? "bg-rose-500/20 text-rose-400" : "bg-zinc-800/40 text-zinc-400"}`}>
                <AlertTriangle className="size-5" />
              </div>
              {metrics.atRiskTrips > 0 && (
                <span className="px-2 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold animate-pulse">
                  ACTION REQUIRED
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">At-Risk Trips</p>
              <p className={`text-3xl font-bold ${metrics.atRiskTrips > 0 ? "text-rose-400" : "text-white"}`}>
                {formatNumber(metrics.atRiskTrips)}
              </p>
              <p className="text-xs text-zinc-400">
                {metrics.atRiskTrips > 0 ? "Trips delayed or missing ETA" : "All active trips on schedule"}
              </p>
            </div>
          </Card>

          {/* Orders Waiting */}
          <Card className={`p-5 rounded-lg backdrop-blur border shadow-lg transition-all duration-200 ${
            metrics.ordersWaiting > 10 
              ? "bg-amber-950/20 border-amber-500/50 shadow-amber-900/20" 
              : "bg-zinc-900/40 border-zinc-800/70 shadow-black/40"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${metrics.ordersWaiting > 10 ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800/40 text-zinc-400"}`}>
                <PackageSearch className="size-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">Orders Waiting</p>
              <p className={`text-3xl font-bold ${metrics.ordersWaiting > 10 ? "text-amber-400" : "text-white"}`}>
                {formatNumber(metrics.ordersWaiting)}
              </p>
              <p className="text-xs text-zinc-400">
                New & Planning status
              </p>
            </div>
          </Card>
        </div>
      </SectionBanner>
      
      {/* 2. Financial Pulse - Revenue & Margin */}
      <SectionBanner title="Financial Performance" subtitle="Real-time revenue and cost analysis (Last 30 Days)" aria-live="polite">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Net Margin */}
          <Card className="p-6 rounded-lg bg-zinc-900/40 backdrop-blur border-zinc-800/70 shadow-lg shadow-black/40 hover:border-zinc-700 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">Net Margin</h3>
              <div className={`p-2 rounded-full ${metrics.netMargin >= 0 ? "bg-emerald-900/20 text-emerald-400" : "bg-rose-900/20 text-rose-400"}`}>
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-2">
              <p className={`text-3xl font-bold ${metrics.netMargin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                ${formatNumber(metrics.netMargin)}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className={`font-medium ${metrics.avgMargin >= 15 ? "text-emerald-400" : "text-amber-400"}`}>
                  {metrics.avgMargin.toFixed(1)}% Avg Margin
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">Target: 15%</span>
              </div>
            </div>
          </Card>

          {/* Revenue vs Cost */}
          <Card className="col-span-2 p-6 rounded-lg bg-zinc-900/40 backdrop-blur border-zinc-800/70 shadow-lg shadow-black/40 hover:border-zinc-700 transition-all duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">Revenue vs Cost</h3>
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div className="space-y-6">
              {/* Revenue Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">Total Revenue</span>
                  <span className="text-white font-bold">${formatNumber(metrics.totalRevenue)}</span>
                </div>
                <div className="h-3 bg-zinc-800/70 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-emerald-500 shadow-lg shadow-emerald-500/30" style={{ width: "100%" }} />
                </div>
              </div>
              
              {/* Cost Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">Total Cost</span>
                  <span className="text-white font-bold">${formatNumber(metrics.totalCost)}</span>
                </div>
                <div className="h-3 bg-zinc-800/70 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-rose-500 shadow-lg shadow-rose-500/30" 
                    style={{ width: `${Math.min((metrics.totalCost / (metrics.totalRevenue || 1)) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </SectionBanner>

      {/* 3. Resource Allocation - Drivers & Utilization */}
      <SectionBanner title="Resource Allocation" subtitle="Asset utilization and fleet status" aria-live="polite">
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Active Drivers */}
          <Card className="p-5 rounded-lg bg-zinc-900/40 backdrop-blur border-zinc-800/70 shadow-lg shadow-black/40 hover:border-zinc-700 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-blue-900/20 text-blue-400">
                <Users className="size-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">Active Drivers</p>
              <p className="text-2xl font-bold text-white">{metrics.activeDrivers}</p>
              <p className="text-xs text-zinc-400">Currently on duty</p>
            </div>
          </Card>

          {/* Utilization Rate */}
          <Card className="p-5 rounded-lg bg-zinc-900/40 backdrop-blur border-zinc-800/70 shadow-lg shadow-black/40 hover:border-zinc-700 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-purple-900/20 text-purple-400">
                <Truck className="size-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">Utilization</p>
              <p className="text-2xl font-bold text-white">{metrics.utilizationRate.toFixed(1)}%</p>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
                <div 
                  className={`h-1.5 rounded-full ${metrics.utilizationRate >= 80 ? "bg-emerald-500" : "bg-amber-500"}`} 
                  style={{ width: `${metrics.utilizationRate}%` }}
                ></div>
              </div>
            </div>
          </Card>

          {/* On-Time Performance */}
          <Card className="p-5 rounded-lg bg-zinc-900/40 backdrop-blur border-zinc-800/70 shadow-lg shadow-black/40 hover:border-zinc-700 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${metrics.onTimePercent >= 90 ? "bg-emerald-900/20 text-emerald-400" : "bg-amber-900/20 text-amber-400"}`}>
                <TrendingUp className="size-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">On-Time %</p>
              <p className="text-2xl font-bold text-white">{metrics.onTimePercent.toFixed(1)}%</p>
              <p className="text-xs text-zinc-400">Target: 90%</p>
            </div>
          </Card>
        </div>
      </SectionBanner>

      {/* 4. Tactical Investigation - Map Link */}
      <SectionBanner title="Live Network" subtitle="Geospatial view of fleet operations" aria-live="polite">
        <div className="rounded-lg border border-zinc-800/70 bg-[#0B0E14] p-1 shadow-lg shadow-black/40">
          <div className="relative flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-zinc-800/50 bg-black/40 overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/map-placeholder.png')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="z-10 text-center">
              <MapIcon className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-400 font-medium mb-4">View live fleet positions and traffic</p>
              <a 
                href="/map" 
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              >
                Open Live Map
              </a>
            </div>
          </div>
        </div>
      </SectionBanner>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <SectionBanner title="Morning Health Check" subtitle="Loading metrics..." dense aria-live="polite">
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-lg bg-zinc-800/50" />
          ))}
        </div>
      </SectionBanner>
      <SectionBanner title="Financial Performance" subtitle="Loading financials..." aria-live="polite">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-48 animate-pulse rounded-lg bg-zinc-800/50" />
          <div className="col-span-2 h-48 animate-pulse rounded-lg bg-zinc-800/50" />
        </div>
      </SectionBanner>
    </div>
  );
}

