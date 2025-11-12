"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, PackageSearch, Route, TrendingUp } from "lucide-react";

import { SectionBanner } from "@/components/section-banner";
import { Chip } from "@/components/ui/chip";
import { Select } from "@/components/ui/select";
import { fetchDashboard } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";
import { queryKeys } from "@/lib/query";

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.dashboard, queryFn: fetchDashboard });

  const metrics = data?.metrics ?? {
    activeOrders: 0,
    inTransit: 0,
    onTimePercent: 0,
    exceptions: 0,
  };

  const kpis = useMemo(
    () => [
      { label: "Active Orders", value: formatNumber(metrics.activeOrders), icon: <PackageSearch className="size-4" /> },
      { label: "In Transit", value: formatNumber(metrics.inTransit), icon: <Route className="size-4" /> },
      { label: "On-Time %", value: formatPercent(metrics.onTimePercent), icon: <TrendingUp className="size-4" /> },
      { label: "Exceptions", value: formatNumber(metrics.exceptions), icon: <AlertTriangle className="size-4" /> },
    ],
    [metrics.activeOrders, metrics.inTransit, metrics.onTimePercent, metrics.exceptions]
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
      <SectionBanner title="Network Pulse" subtitle="Key performance indicators for the fleet." dense aria-live="polite">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <Chip key={kpi.label} tone="brand" leadingIcon={kpi.icon} className="justify-between">
              <span className="text-xs uppercase tracking-wide text-neutral-500">
                {kpi.label}
              </span>
              <span className="text-base font-semibold text-neutral-200">{kpi.value}</span>
            </Chip>
          ))}
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
