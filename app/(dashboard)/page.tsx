"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, PackageSearch, Route, TrendingUp } from "lucide-react";

import { PageSection } from "@/components/page-section";
import { fetchDashboard } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";
import { queryKeys } from "@/lib/query";

const metricIcons = {
  "Active Orders": <PackageSearch className="size-4 text-[var(--accent)]" />,
  "In Transit": <Route className="size-4 text-[var(--accent)]" />,
  "On-Time %": <TrendingUp className="size-4 text-[var(--accent)]" />,
  Exceptions: <AlertTriangle className="size-4 text-[var(--accent)]" />,
};

type MetricKey = keyof typeof metricIcons;

type StatusVariant = "ok" | "warn" | "alert";

const statusClass: Record<StatusVariant, string> = {
  ok: "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]",
  warn: "border-[var(--border)] bg-[var(--surface-2)] text-[var(--warn)]",
  alert: "border-[var(--border)] bg-[var(--surface-2)] text-[var(--alert)]",
};

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageSection title="Dashboard">
          <p className="text-sm text-[var(--muted)]">Unable to load dashboard data. Refresh to try again.</p>
        </PageSection>
      </div>
    );
  }

  const metrics = useMemo(
    () =>
      [
        {
          label: "Active Orders" as MetricKey,
          value: formatNumber(data.metrics.activeOrders),
        },
        {
          label: "In Transit" as MetricKey,
          value: formatNumber(data.metrics.inTransit),
        },
        {
          label: "On-Time %" as MetricKey,
          value: formatPercent(data.metrics.onTimePercent),
        },
        {
          label: "Exceptions" as MetricKey,
          value: formatNumber(data.metrics.exceptions),
        },
      ],
    [data.metrics.activeOrders, data.metrics.inTransit, data.metrics.onTimePercent, data.metrics.exceptions]
  );

  return (
    <div className="space-y-6">
      <PageSection
        title="Network Overview"
        description="Enterprise-wide pulse of orders and live exceptions."
        contentClassName="py-4"
      >
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-center gap-3 border-l border-[var(--border)] pl-4 first:border-l-0 first:pl-0"
            >
              <span className="flex size-9 items-center justify-center rounded-md bg-[var(--surface-2)]">
                {metricIcons[metric.label]}
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{metric.label}</p>
                <p className="text-xl font-semibold text-[var(--text)]">{metric.value}</p>
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection
        title="Connectors & Telemetry"
        description="Status of carrier integrations, sensor feeds, and alerting fabric."
        contentClassName="py-4"
      >
        <div className="flex flex-wrap gap-2">
          {data.serviceHealth.map((service) => {
            const tone: StatusVariant =
              service.status === "error" ? "alert" : service.status === "warn" ? "warn" : "ok";
            return (
              <span
                key={service.name}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-medium ${statusClass[tone]}`}
              >
                <span
                  className={`size-2 rounded-full ${
                    tone === "ok"
                      ? "bg-[var(--ok)]"
                      : tone === "warn"
                      ? "bg-[var(--warn)]"
                      : "bg-[var(--alert)]"
                  }`}
                />
                {service.name}
                <span className="text-[var(--muted)]">{service.message}</span>
              </span>
            );
          })}
        </div>
      </PageSection>

      <PageSection
        title="Network Workspace"
        description="Filter the active network and monitor map viewport telemetry."
        contentClassName="px-0 pb-0"
      >
        <div className="grid gap-0 border-t border-[var(--border)] lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-5 border-b border-[var(--border)] px-6 py-6 lg:border-b-0 lg:border-r">
            <h3 className="text-sm font-semibold text-[var(--text)]">Live Network Filters</h3>
            <form className="grid gap-4 text-sm">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Date Range</span>
                <select
                  className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
                  defaultValue={data.liveNetwork.filterOptions.dateRanges[0]}
                >
                  {data.liveNetwork.filterOptions.dateRanges.map((range) => (
                    <option key={range}>{range}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Customer</span>
                <select
                  className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
                  defaultValue={data.liveNetwork.filterOptions.customers[0]}
                >
                  {data.liveNetwork.filterOptions.customers.map((customer) => (
                    <option key={customer}>{customer}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Lane</span>
                <select
                  className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
                  defaultValue={data.liveNetwork.filterOptions.lanes[0]}
                >
                  {data.liveNetwork.filterOptions.lanes.map((lane) => (
                    <option key={lane}>{lane}</option>
                  ))}
                </select>
              </label>
            </form>
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--muted)]">
              <div className="flex items-center justify-between">
                <span>Hotspots</span>
                <span className="font-semibold text-[var(--text)]">{data.liveNetwork.mapSummary.hotspots}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Dwell alerts</span>
                <span className="font-semibold text-[var(--text)]">{data.liveNetwork.mapSummary.dwellAlerts}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Idle units</span>
                <span className="font-semibold text-[var(--text)]">{data.liveNetwork.mapSummary.idleUnits}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4 px-6 py-6">
            <h3 className="text-sm font-semibold text-[var(--text)]">Map Viewport</h3>
            <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--muted)]">
              Map viewport placeholder
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection
        title="Today at a Glance"
        description="Priority lanes, resource posture, and readiness."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Top Lanes</h3>
            <div className="overflow-hidden rounded-md border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-2)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-2 font-medium">Lane</th>
                    <th className="px-4 py-2 font-medium">Orders</th>
                    <th className="px-4 py-2 font-medium">On-Time %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.glance.topLanes.map((lane) => (
                    <tr key={lane.lane} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2 text-[var(--text)]">{lane.lane}</td>
                      <td className="px-4 py-2 text-[var(--muted)]">{lane.orders}</td>
                      <td className="px-4 py-2 text-[var(--muted)]">{formatPercent(lane.onTimePercent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Drivers</h4>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Available</span>
                  <span className="font-semibold text-[var(--text)]">{data.glance.drivers.available}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Booked</span>
                  <span className="font-semibold text-[var(--text)]">{data.glance.drivers.booked}</span>
                </div>
              </div>
            </div>
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Units</h4>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Available</span>
                  <span className="font-semibold text-[var(--text)]">{data.glance.units.available}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Down</span>
                  <span className="font-semibold text-[var(--text)]">{data.glance.units.down}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageSection>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PageSection title="Network Overview" hideHeader>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-md bg-[var(--surface-2)]" />
          ))}
        </div>
      </PageSection>
      <PageSection title="Connectors & Telemetry" hideHeader>
        <div className="h-10 animate-pulse rounded-md bg-[var(--surface-2)]" />
      </PageSection>
      <PageSection title="Network Workspace" hideHeader>
        <div className="h-72 animate-pulse rounded-md bg-[var(--surface-2)]" />
      </PageSection>
      <PageSection title="Today at a Glance" hideHeader>
        <div className="h-60 animate-pulse rounded-md bg-[var(--surface-2)]" />
      </PageSection>
    </div>
  );
}
