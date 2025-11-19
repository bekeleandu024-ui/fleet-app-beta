"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  PackageSearch, 
  Route, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Truck,
  TrendingDown,
  Users
} from "lucide-react";

import { SectionBanner } from "@/components/section-banner";
import { Chip } from "@/components/ui/chip";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { fetchDashboard } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";
import { queryKeys } from "@/lib/query";

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.dashboard, queryFn: fetchDashboard });
  
  // TMS-specific metrics
  const [tmsMetrics, setTmsMetrics] = useState({
    ordersWaiting: 12,
    atRiskTrips: 3,
    avgMargin: 18.5,
    onTimePercent: 87.3,
    activeDrivers: 24,
    utilizationRate: 76.2,
    totalRevenue: 145280,
    totalCost: 118425,
  });

  const metrics = data?.metrics ?? {
    activeOrders: 0,
    inTransit: 0,
    onTimePercent: 0,
    exceptions: 0,
  };
  
  // Fetch TMS metrics
  useEffect(() => {
    fetch("/api/dashboard/metrics")
      .then(res => res.json())
      .then(data => {
        if (data) setTmsMetrics(prev => ({ ...prev, ...data }));
      })
      .catch(err => console.error("Failed to fetch TMS metrics:", err));
  }, []);

  const kpis = useMemo(
    () => [
      { 
        label: "Orders Waiting", 
        value: formatNumber(tmsMetrics.ordersWaiting), 
        icon: <PackageSearch className="size-4" />,
        trend: "+2 from yesterday",
        color: "text-amber-400"
      },
      { 
        label: "At-Risk Trips", 
        value: formatNumber(tmsMetrics.atRiskTrips), 
        icon: <AlertTriangle className="size-4" />,
        trend: "Requires attention",
        color: "text-rose-400"
      },
      { 
        label: "Avg Margin", 
        value: `${tmsMetrics.avgMargin.toFixed(1)}%`, 
        icon: <DollarSign className="size-4" />,
        trend: "+1.2% vs last week",
        color: "text-emerald-400"
      },
      { 
        label: "On-Time %", 
        value: `${tmsMetrics.onTimePercent.toFixed(1)}%`, 
        icon: <TrendingUp className="size-4" />,
        trend: "Target: 90%",
        color: tmsMetrics.onTimePercent >= 90 ? "text-emerald-400" : "text-amber-400"
      },
    ],
    [tmsMetrics]
  );

  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-6">
        <SectionBanner title="Network Pulse" subtitle="Key performance indicators for the fleet." aria-live="polite">
          <p className="text-sm text-neutral-400">Unable to load dashboard metrics.</p>
        </SectionBanner>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionBanner title="TMS Command Center" subtitle="Real-time operations & performance metrics" dense aria-live="polite">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="p-4 bg-gray-900/50 backdrop-blur border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-gray-800/50 ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-white">{kpi.value}</p>
                <p className="text-xs text-gray-400">{kpi.trend}</p>
              </div>
            </Card>
          ))}
        </div>
      </SectionBanner>
      
      {/* Revenue & Margin Analytics */}
      <SectionBanner title="Financial Performance" subtitle="Revenue trends and margin analysis" aria-live="polite">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300">Revenue vs Cost</h3>
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Total Revenue</span>
                  <span className="text-white font-semibold">${(tmsMetrics.totalRevenue / 1000).toFixed(1)}k</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-emerald-500 to-emerald-400" style={{ width: "100%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Total Cost</span>
                  <span className="text-white font-semibold">${(tmsMetrics.totalCost / 1000).toFixed(1)}k</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-rose-500 to-rose-400" 
                    style={{ width: `${(tmsMetrics.totalCost / tmsMetrics.totalRevenue) * 100}%` }} 
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Net Margin</span>
                  <span className="text-xl font-bold text-emerald-400">
                    ${((tmsMetrics.totalRevenue - tmsMetrics.totalCost) / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300">Resource Utilization</h3>
              <Truck className="h-5 w-5 text-blue-400" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Active Drivers</span>
                  <span className="text-white font-semibold">{tmsMetrics.activeDrivers} / 30</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-blue-500 to-blue-400" 
                    style={{ width: `${(tmsMetrics.activeDrivers / 30) * 100}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Fleet Utilization</span>
                  <span className="text-white font-semibold">{tmsMetrics.utilizationRate.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-purple-500 to-purple-400" 
                    style={{ width: `${tmsMetrics.utilizationRate}%` }} 
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Efficiency Target</span>
                  <span className={`text-xl font-bold ${tmsMetrics.utilizationRate >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                    {tmsMetrics.utilizationRate >= 80 ? "On Track" : "Below Target"}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </SectionBanner>

      <SectionBanner
        title="Live Network"
        subtitle="Adjust the view and monitor the live map telemetry."
        aria-live="polite"
        footer={
          <div className="flex flex-wrap gap-3">
            <span>Hotspots {data.liveNetwork.mapSummary.hotspots}</span>
            <span>• Dwell alerts {data.liveNetwork.mapSummary.dwellAlerts}</span>
          </div>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4">
            <FilterField label="Date Range">
              <Select defaultValue={data.liveNetwork.filterOptions.dateRanges[0] ?? ""}>
                {data.liveNetwork.filterOptions.dateRanges.map((range) => (
                  <option key={range}>{range}</option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Customer">
              <Select defaultValue={data.liveNetwork.filterOptions.customers[0] ?? ""}>
                {data.liveNetwork.filterOptions.customers.map((customer) => (
                  <option key={customer}>{customer}</option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Lane">
              <Select defaultValue={data.liveNetwork.filterOptions.lanes[0] ?? ""}>
                {data.liveNetwork.filterOptions.lanes.map((lane) => (
                  <option key={lane}>{lane}</option>
                ))}
              </Select>
            </FilterField>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-neutral-800 bg-neutral-900/50 text-sm text-neutral-400">
              Map viewport placeholder
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
      <SectionBanner title="Network Pulse" subtitle="Key performance indicators for the fleet." dense aria-live="polite">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-lg bg-neutral-900/50"
            />
          ))}
        </div>
      </SectionBanner>
      <SectionBanner title="Live Network" subtitle="Adjust the view and monitor the live map telemetry." aria-live="polite">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded-lg bg-neutral-900/50" />
                <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-900/50" />
              </div>
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-lg bg-neutral-900/50" />
        </div>
      </SectionBanner>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs uppercase tracking-wide text-neutral-500">{label}</span>
      {children}
    </label>
  );
}
