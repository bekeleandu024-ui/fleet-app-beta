"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, PackageSearch, Route, TrendingUp } from "lucide-react";

import { StatChip } from "@/components/stat-chip";
import { HealthDot } from "@/components/health-dot";
import { fetchDashboard } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";
import { queryKeys } from "@/lib/query";

export default function DashboardPage() {
  // 1) HOOKS FIRST
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboard,
  });

  // guard so useMemo doesn't explode if data is undefined
  const metrics = data?.metrics ?? {
    activeOrders: 0,
    inTransit: 0,
    onTimePercent: 0,
    exceptions: 0,
  };

  // 2) DERIVED DATA (still a hook)
  const kpis = useMemo(
    () => [
      {
        label: "Active Orders",
        value: formatNumber(metrics.activeOrders),
        icon: <PackageSearch className="size-4 text-[var(--brand)]" />,
      },
      {
        label: "In Transit",
        value: formatNumber(metrics.inTransit),
        icon: <Route className="size-4 text-[var(--brand)]" />,
      },
      {
        label: "On-Time %",
        value: formatPercent(metrics.onTimePercent),
        icon: <TrendingUp className="size-4 text-[var(--brand)]" />,
      },
      {
        label: "Exceptions",
        value: formatNumber(metrics.exceptions),
        icon: <AlertTriangle className="size-4 text-[var(--brand)]" />,
      },
    ],
    [
      metrics.activeOrders,
      metrics.inTransit,
      metrics.onTimePercent,
      metrics.exceptions,
    ]
  );

  // 3) RENDER – now we can branch safely
  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <section className="col-span-12 rounded-xl border border-subtle bg-surface-1 p-6 text-sm text-muted">
        Unable to load dashboard data. Refresh to try again.
      </section>
    );
  }

  return (
    <>
      {/* KPI row */}
      <section className="col-span-12">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="flex items-center gap-3 rounded-xl border border-subtle bg-surface-2 px-4 py-3 shadow-soft"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--brand)_18%,transparent)] text-[var(--brand)]">
                {kpi.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted">
                  {kpi.label}
                </p>
                <p className="text-lg font-semibold text-[var(--text)]">
                  {kpi.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* service health chips */}
      <section className="col-span-12">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {data.serviceHealth.map((service) => (
            <StatChip
              key={service.name}
              label={service.name}
              value={service.message}
              variant={
                service.status === "ok"
                  ? "ok"
                  : service.status === "warn"
                  ? "warn"
                  : "alert"
              }
            />
          ))}
        </div>
      </section>

      {/* main grid */}
      <section className="col-span-12">
        <article className="flex flex-col gap-4 rounded-xl border border-subtle bg-surface-1 p-4 shadow-soft">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text)]">Live Network</h2>
              <p className="text-xs text-muted">
                Filter the active network and monitor critical movement.
              </p>
            </div>
            <div className="hidden text-xs text-muted lg:flex lg:items-center lg:gap-2">
              <HealthDot status="warn" />
              2 dwell alerts
            </div>
          </header>
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4 space-y-4">
              <div className="grid gap-2 text-xs">
                <label className="text-muted" htmlFor="live-network-date">
                  Date Range
                </label>
                <select
                  id="live-network-date"
                  className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
                  defaultValue={data.liveNetwork.filterOptions.dateRanges[0]}
                  aria-label="Live network date range"
                >
                  {data.liveNetwork.filterOptions.dateRanges.map((range) => (
                    <option key={range}>{range}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 text-xs">
                <label className="text-muted" htmlFor="live-network-customer">
                  Customer
                </label>
                <select
                  id="live-network-customer"
                  className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
                  defaultValue={data.liveNetwork.filterOptions.customers[0]}
                  aria-label="Live network customer filter"
                >
                  {data.liveNetwork.filterOptions.customers.map((customer) => (
                    <option key={customer}>{customer}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 text-xs">
                <label className="text-muted" htmlFor="live-network-lane">
                  Lane
                </label>
                <select
                  id="live-network-lane"
                  className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
                  defaultValue={data.liveNetwork.filterOptions.lanes[0]}
                  aria-label="Live network lane filter"
                >
                  {data.liveNetwork.filterOptions.lanes.map((lane) => (
                    <option key={lane}>{lane}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-xs text-muted">
                Hotspots:{" "}
                <span className="font-semibold text-[var(--text)]">
                  {data.liveNetwork.mapSummary.hotspots}
                </span>
                <br />
                Dwell alerts:{" "}
                <span className="font-semibold text-[var(--text)]">
                  {data.liveNetwork.mapSummary.dwellAlerts}
                </span>
              </div>
            </div>
            <div className="lg:col-span-8">
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-subtle bg-surface-2 text-xs text-muted">
                Map viewport placeholder
              </div>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <section className="col-span-12">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-xl border border-subtle bg-surface-2"
            />
          ))}
        </div>
      </section>
      <section className="col-span-12">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-6 w-32 animate-pulse rounded-xl bg-surface-2"
            />
          ))}
        </div>
      </section>
      <section className="col-span-12">
        <div className="h-80 animate-pulse rounded-xl border border-subtle bg-surface-1" />
      </section>
    </>
  );
}
