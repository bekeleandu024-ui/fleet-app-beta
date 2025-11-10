"use client";

import { type ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { SectionBanner } from "@/components/section-banner";
import { HealthDot } from "@/components/health-dot";
import {
  fetchCostingDefaults,
  fetchDashboard,
  fetchDispatch,
  fetchDriversMasterData,
  fetchEventsMasterData,
  fetchMapPlan,
  fetchOrders,
  fetchRulesMasterData,
  fetchTrips,
  fetchUnitsMasterData,
} from "@/lib/api";
import { formatPercent } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type {
  CostingDefaults,
  DashboardResponse,
  DispatchResponse,
  MasterDataResponse,
  MapPlanResponse,
  OrdersResponse,
  TripsResponse,
} from "@/lib/types";

interface BannerProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

interface StaticConfig {
  type: "static";
  content: BannerProps;
}

interface AsyncConfig {
  type: "async";
  queryKey: readonly unknown[];
  queryFn: () => Promise<unknown>;
  loading: BannerProps;
  error: BannerProps;
  build: (data: unknown) => BannerProps;
}

type RightConfig = StaticConfig | AsyncConfig;

function loadingState(title: string): BannerProps {
  return {
    title,
    description: "Loading contextual insights...",
    children: (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-3 w-full animate-pulse rounded bg-[var(--surface-3)]" />
        ))}
      </div>
    ),
  };
}

function errorState(title: string): BannerProps {
  return {
    title,
    description: "We couldn't load the supporting context.",
    children: <p className="text-xs text-[var(--muted)]">Retry shortly or refresh the page.</p>,
  };
}

function buildDashboardConfig(): AsyncConfig {
  return {
    type: "async",
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboard,
    loading: loadingState("Today at a Glance"),
    error: errorState("Today at a Glance"),
    build: (raw) => {
      const data = raw as DashboardResponse;

      return {
        title: "Today at a Glance",
        description: "Lane performance and resource readiness pulled into one brief.",
        children: (
          <div className="space-y-5">
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Top Lanes</h3>
              <ul className="space-y-2 text-sm">
                {data.glance.topLanes.map((lane) => (
                  <li key={lane.lane} className="flex items-center justify-between">
                    <span className="font-medium text-[var(--text)]">{lane.lane}</span>
                    <span className="text-xs text-[var(--muted)]">
                      {lane.orders} loads • {formatPercent(lane.onTimePercent)} on-time
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Resources</h3>
              <div className="grid gap-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Drivers available</span>
                    <span className="font-semibold text-[var(--text)]">{data.glance.drivers.available}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Drivers booked</span>
                    <span className="font-semibold text-[var(--text)]">{data.glance.drivers.booked}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Units available</span>
                    <span className="font-semibold text-[var(--text)]">{data.glance.units.available}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Units down</span>
                    <span className="font-semibold text-[var(--text)]">{data.glance.units.down}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ),
      };
    },
  };
}

function buildOrdersConfig(): AsyncConfig {
  return {
    type: "async",
    queryKey: queryKeys.orders(),
    queryFn: fetchOrders,
    loading: loadingState("Order Filters"),
    error: errorState("Order Filters"),
    build: (raw) => {
      const data = raw as OrdersResponse;

      return {
        title: "Order Filters",
        description: "Target the backlog by customer, status, and service window.",
        children: (
          <form className="grid gap-4 text-sm">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Customer</span>
              <select className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                {data.filters.customers.map((customer) => (
                  <option key={customer}>{customer}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Status</span>
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <div className="grid gap-2">
                  {data.filters.statuses.map((status) => (
                    <label key={status} className="flex items-center gap-2 text-sm text-[var(--text)]">
                      <input type="checkbox" className="size-3 accent-[var(--accent)]" defaultChecked={status !== "Delivered"} />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Date Range</span>
              <select className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                {data.filters.dateRanges.map((range) => (
                  <option key={range}>{range}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Lane</span>
              <select className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                {data.filters.lanes.map((lane) => (
                  <option key={lane}>{lane}</option>
                ))}
              </select>
            </label>
          </form>
        ),
      };
    },
  };
}

function buildDispatchConfig(): AsyncConfig {
  return {
    type: "async",
    queryKey: queryKeys.dispatch,
    queryFn: fetchDispatch,
    loading: loadingState("Crew & Assets"),
    error: errorState("Crew & Assets"),
    build: (raw) => {
      const data = raw as DispatchResponse;

      const driverStatus = (status: string) => {
        if (status === "Ready") return "ok" as const;
        if (status === "Off Duty" || status === "Standby") return "warn" as const;
        return "alert" as const;
      };

      const unitStatus = (status: string) => {
        if (status === "Available" || status === "Ready") return "ok" as const;
        if (status === "Maintenance" || status === "Inspection") return "alert" as const;
        return "warn" as const;
      };

      return {
        title: "Crew & Assets",
        description: "Live roster health to confirm launch readiness.",
        children: (
          <div className="space-y-4">
            <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Drivers</h3>
                <span className="text-xs text-[var(--muted)]">{data.crew.drivers.length} on roster</span>
              </div>
              <ul className="space-y-2 text-sm">
                {data.crew.drivers.map((driver) => (
                  <li key={driver.id} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2">
                    <div>
                      <p className="font-medium text-[var(--text)]">{driver.name}</p>
                      <p className="text-xs text-[var(--muted)]">{driver.hoursAvailable} hrs available</p>
                    </div>
                    <HealthDot status={driverStatus(driver.status)} />
                  </li>
                ))}
              </ul>
            </section>
            <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Units</h3>
                <span className="text-xs text-[var(--muted)]">{data.crew.units.length} available</span>
              </div>
              <ul className="space-y-2 text-sm">
                {data.crew.units.map((unit) => (
                  <li key={unit.id} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2">
                    <div>
                      <p className="font-medium text-[var(--text)]">{unit.id}</p>
                      <p className="text-xs text-[var(--muted)]">{unit.type} • {unit.location}</p>
                    </div>
                    <HealthDot status={unitStatus(unit.status)} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ),
      };
    },
  };
}

function buildTripsConfig(): AsyncConfig {
  return {
    type: "async",
    queryKey: queryKeys.trips(),
    queryFn: fetchTrips,
    loading: loadingState("Trip Filters"),
    error: errorState("Trip Filters"),
    build: (raw) => {
      const data = raw as TripsResponse;

      return {
        title: "Trip Filters",
        description: "Refine the live grid by status, exception, and time horizon.",
        children: (
          <form className="grid gap-4 text-sm">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Status</span>
              <select className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                {data.filters.statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Exception Type</span>
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <div className="grid gap-2">
                  {data.filters.exceptions.map((exception) => (
                    <label key={exception} className="flex items-center gap-2 text-sm text-[var(--text)]">
                      <input type="checkbox" className="size-3 accent-[var(--brand)]" />
                      <span>{exception}</span>
                    </label>
                  ))}
                </div>
              </div>
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Date Range</span>
              <select className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                {data.filters.dateRanges.map((range) => (
                  <option key={range}>{range}</option>
                ))}
              </select>
            </label>
          </form>
        ),
      };
    },
  };
}

function buildCostingConfig(): AsyncConfig {
  return {
    type: "async",
    queryKey: queryKeys.costing,
    queryFn: fetchCostingDefaults,
    loading: loadingState("Cost Targets"),
    error: errorState("Cost Targets"),
    build: (raw) => {
      const data = raw as CostingDefaults;

      return {
        title: "Cost Targets",
        description: "Guardrail metrics to validate before submitting the quote.",
        children: (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span>Total Cost Benchmark</span>
                <span>{data.breakdown.totalValue}</span>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <p className="text-xs text-[var(--muted)]">Recommended RPM</p>
                <p className="text-sm font-semibold text-[var(--text)]">{data.targets.recommendedRPM}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <p className="text-xs text-[var(--muted)]">Target Revenue</p>
                <p className="text-sm font-semibold text-[var(--text)]">{data.targets.revenue}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <p className="text-xs text-[var(--muted)]">Break-even RPM</p>
                <p className="text-sm font-semibold text-[var(--text)]">{data.targets.breakEven}</p>
              </div>
            </div>
          </div>
        ),
      };
    },
  };
}

function buildMasterDataConfig(title: string, description: string, queryKey: readonly unknown[], queryFn: () => Promise<MasterDataResponse>): AsyncConfig {
  return {
    type: "async",
    queryKey,
    queryFn,
    loading: loadingState(title),
    error: errorState(title),
    build: (raw) => {
      const data = raw as MasterDataResponse;

      return {
        title,
        description,
        children: (
          <form className="grid gap-4 text-sm">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Region</span>
              <select className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                {data.filters.regions.map((region) => (
                  <option key={region}>{region}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Status</span>
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <div className="grid gap-2">
                  {data.filters.statuses.map((status) => (
                    <label key={status} className="flex items-center gap-2 text-sm text-[var(--text)]">
                      <input type="checkbox" className="size-3 accent-[var(--accent)]" defaultChecked />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </label>
          </form>
        ),
      };
    },
  };
}

function buildMapConfig(): AsyncConfig {
  return {
    type: "async",
    queryKey: queryKeys.map,
    queryFn: fetchMapPlan,
    loading: loadingState("Route Controls"),
    error: errorState("Route Controls"),
    build: (raw) => {
      const data = raw as MapPlanResponse;

      return {
        title: "Route Controls",
        description: "Adjust vehicle profile, avoidances, and review the step-by-step plan.",
        children: (
          <div className="space-y-5">
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Vehicle Profile</h3>
              <select className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                {data.options.vehicleProfiles.map((profile) => (
                  <option key={profile}>{profile}</option>
                ))}
              </select>
            </section>
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Avoidances</h3>
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                <div className="grid gap-2">
                  {data.options.avoidances.map((item) => (
                    <label key={item} className="flex items-center gap-2">
                      <input type="checkbox" className="size-3 accent-[var(--accent)]" />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Steps</h3>
              <ul className="space-y-2 text-sm">
                {data.steps.map((step) => (
                  <li key={step.id} className="flex items-start gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                    <span className="mt-1 flex size-6 items-center justify-center rounded-md bg-[var(--surface-3)] text-xs text-[var(--muted)]">
                      {step.sequence}
                    </span>
                    <div>
                      <p className="font-semibold text-[var(--text)]">{step.action}</p>
                      <p className="text-xs text-[var(--muted)]">{step.location}</p>
                      <p className="text-xs text-[var(--muted)]">ETA {new Date(step.eta).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ),
      };
    },
  };
}

function getRightConfig(pathname: string): RightConfig {
  if (pathname === "/" || pathname.startsWith("/dashboard")) {
    return buildDashboardConfig();
  }

  if (pathname.startsWith("/orders")) {
    return buildOrdersConfig();
  }

  if (pathname.startsWith("/dispatch")) {
    return buildDispatchConfig();
  }

  if (pathname.startsWith("/trips")) {
    return buildTripsConfig();
  }

  if (pathname.startsWith("/costing")) {
    return buildCostingConfig();
  }

  if (pathname.startsWith("/master-data/drivers")) {
    return buildMasterDataConfig(
      "Driver Filters",
      "Narrow the roster by coverage region and readiness status.",
      queryKeys.masterData.drivers,
      fetchDriversMasterData
    );
  }

  if (pathname.startsWith("/master-data/units")) {
    return buildMasterDataConfig(
      "Unit Filters",
      "Segment tractors and trailers by location and availability.",
      queryKeys.masterData.units,
      fetchUnitsMasterData
    );
  }

  if (pathname.startsWith("/master-data/rules")) {
    return buildMasterDataConfig(
      "Rule Filters",
      "Segment policies by region and activation state.",
      queryKeys.masterData.rules,
      fetchRulesMasterData
    );
  }

  if (pathname.startsWith("/master-data/events")) {
    return buildMasterDataConfig(
      "Event Filters",
      "Focus on the event definitions and rule triggers that matter most.",
      queryKeys.masterData.events,
      fetchEventsMasterData
    );
  }

  if (pathname.startsWith("/map")) {
    return buildMapConfig();
  }

  return {
    type: "static",
    content: {
      title: "Workspace Context",
      description: "Navigate to a core workspace to load contextual guidance.",
      children: <p className="text-xs text-[var(--muted)]">No additional context for this view.</p>,
    },
  };
}

export function RightContextInsights() {
  const pathname = usePathname() ?? "/";
  const config = useMemo(() => getRightConfig(pathname), [pathname]);

  if (config.type === "static") {
    return <SectionBanner {...config.content} />;
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: config.queryKey,
    queryFn: config.queryFn,
  });

  if (isLoading && !data) {
    return <SectionBanner {...config.loading} />;
  }

  if (isError || !data) {
    return <SectionBanner {...config.error} />;
  }

  return <SectionBanner {...config.build(data)} />;
}
