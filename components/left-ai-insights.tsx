"use client";

import { type ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { SectionBanner } from "@/components/section-banner";
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
import { formatNumber, formatPercent } from "@/lib/format";
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
  build: (data: unknown) => BannerProps;
  loading: BannerProps;
  error: BannerProps;
}

type LeftConfig = StaticConfig | AsyncConfig;

function loadingState(title: string): BannerProps {
  return {
    title,
    description: "Loading the latest insight.",
    children: (
      <div className="space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--surface-3)]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--surface-3)]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--surface-3)]" />
      </div>
    ),
  };
}

function errorState(title: string): BannerProps {
  return {
    title,
    description: "Unable to surface contextual guidance right now.",
    children: (
      <p className="text-xs text-[var(--muted)]">
        Refresh the view to try again. If the issue persists, contact support.
      </p>
    ),
  };
}

function buildDashboardConfig(): AsyncConfig {
  return {
    type: "async",
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboard,
    loading: loadingState("AI Operations Briefing"),
    error: errorState("AI Operations Briefing"),
    build: (raw) => {
      const data = raw as DashboardResponse;
      const primaryLane = data.glance.topLanes[0];
      const health = data.serviceHealth.reduce(
        (acc, service) => {
          acc[service.status] += 1;
          return acc;
        },
        { ok: 0, warn: 0, alert: 0 }
      );

      return {
        title: "AI Operations Briefing",
        description: "Network-level insights synthesized from live telemetry.",
        children: (
          <ul className="space-y-3 text-sm leading-5">
            <li>
              <span className="font-semibold">{formatNumber(data.metrics.activeOrders)}</span> active orders with
              {" "}
              <span className="font-semibold">{formatNumber(data.metrics.inTransit)}</span> currently moving.
            </li>
            <li>
              On-time performance is holding at {formatPercent(data.metrics.onTimePercent)} with
              {" "}
              <span className="font-semibold">{formatNumber(data.metrics.exceptions)}</span> exceptions requiring follow-up.
            </li>
            {primaryLane ? (
              <li>
                Lane to monitor: <span className="font-semibold">{primaryLane.lane}</span> • {primaryLane.orders} loads •
                {" "}
                {formatPercent(primaryLane.onTimePercent)} on-time.
              </li>
            ) : null}
          </ul>
        ),
        footer: (
          <div className="flex flex-wrap gap-2">
            <span>Health: {health.ok} stable</span>
            <span>• {health.warn} watch</span>
            <span>• {health.alert} alerts</span>
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
    loading: loadingState("AI Order Guidance"),
    error: errorState("AI Order Guidance"),
    build: (raw) => {
      const data = raw as OrdersResponse;
      const delayedShare = data.stats.total
        ? Math.round((data.stats.delayed / data.stats.total) * 100)
        : 0;
      const focusStatuses = data.filters.statuses.slice(0, 3).join(", ");

      return {
        title: "AI Order Guidance",
        description: "Backlog pressure and prioritization hints from the AI planner.",
        children: (
          <ul className="space-y-3 text-sm leading-5">
            <li>
              Queue size: <span className="font-semibold">{formatNumber(data.stats.total)}</span> orders with
              {" "}
              <span className="font-semibold">{formatNumber(data.stats.new)}</span> new in the last cycle.
            </li>
            <li>
              <span className="font-semibold">{formatNumber(data.stats.delayed)}</span> delayed loads ({delayedShare}% of the stack)
              should be escalated.
            </li>
            <li>
              Monitor statuses: <span className="font-semibold">{focusStatuses}</span>.
            </li>
          </ul>
        ),
        footer: (
          <div className="text-xs text-[var(--muted)]">
            Filters cover {data.filters.customers.length} customers across {data.filters.lanes.length} lanes.
          </div>
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
    loading: loadingState("AI Launch Recommendation"),
    error: errorState("AI Launch Recommendation"),
    build: (raw) => {
      const data = raw as DispatchResponse;
      const focusOrder = data.qualifiedOrders[0];

      return {
        title: "AI Launch Recommendation",
        description: "Guardrail-aware summary before confirming launch.",
        children: (
          <div className="space-y-4">
            {focusOrder ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Primary candidate</p>
                <p className="text-sm font-semibold text-[var(--text)]">{focusOrder.reference}</p>
                <p className="text-xs text-[var(--muted)]">{focusOrder.customer} • {focusOrder.lane}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">{focusOrder.priority} priority • {focusOrder.miles} mi projected</p>
              </div>
            ) : null}
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">{data.recommendation.title}</p>
              <p className="text-xs text-[var(--muted)]">{data.recommendation.description}</p>
              <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-[var(--muted)]">
                {data.recommendation.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          </div>
        ),
        footer: (
          <div>
            {data.qualifiedOrders.length} qualified orders ready for assignment.
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
    loading: loadingState("AI Trip Monitor"),
    error: errorState("AI Trip Monitor"),
    build: (raw) => {
      const data = raw as TripsResponse;
      const exceptionTrip = data.data.find((trip) => trip.exceptions > 0);
      const lastPing = exceptionTrip ? new Date(exceptionTrip.lastPing).toLocaleString() : "All trips healthy";

      return {
        title: "AI Trip Monitor",
        description: "Live run-time exceptions and health signals.",
        children: (
          <ul className="space-y-3 text-sm leading-5">
            <li>
              <span className="font-semibold">{formatNumber(data.stats.active)}</span> active trips with
              {" "}
              <span className="font-semibold">{formatNumber(data.stats.late)}</span> running late.
            </li>
            <li>
              Exceptions in flight: <span className="font-semibold">{formatNumber(data.stats.exception)}</span>.
            </li>
            {exceptionTrip ? (
              <li>
                Focus trip {exceptionTrip.tripNumber} ({exceptionTrip.driver}) holding {exceptionTrip.exceptions} open exception
                {exceptionTrip.exceptions === 1 ? "" : "s"}.
              </li>
            ) : null}
          </ul>
        ),
        footer: <div>Last ping sample: {lastPing}</div>,
      };
    },
  };
}

function buildCostingConfig(): AsyncConfig {
  return {
    type: "async",
    queryKey: queryKeys.costing,
    queryFn: fetchCostingDefaults,
    loading: loadingState("AI Pricing Guardrails"),
    error: errorState("AI Pricing Guardrails"),
    build: (raw) => {
      const data = raw as CostingDefaults;

      return {
        title: "AI Pricing Guardrails",
        description: "Guardrails aligned to finance targets before submitting pricing.",
        children: (
          <div className="space-y-3 text-sm leading-5">
            <p>
              Recommended RPM target: <span className="font-semibold">{data.targets.recommendedRPM}</span> with expected revenue of
              {" "}
              <span className="font-semibold">{data.targets.revenue}</span>.
            </p>
            <p>
              Break-even RPM: <span className="font-semibold">{data.targets.breakEven}</span>. Adjust assumptions before locking in
              rate.
            </p>
            <p>
              Base modeling uses {formatNumber(data.form.miles)} mi, {data.form.pickups} pickups, {data.form.deliveries} deliveries.
            </p>
          </div>
        ),
        footer: <div>Total cost benchmark: {data.breakdown.totalValue}</div>,
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
      const totalRecords = data.data.length;
      const statusCounts = data.data.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = (acc[row.status] ?? 0) + 1;
        return acc;
      }, {});
      const topStatuses = Object.entries(statusCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2);

      return {
        title,
        description,
        children: (
          <ul className="space-y-3 text-sm leading-5">
            <li>
              Catalog size: <span className="font-semibold">{formatNumber(totalRecords)}</span> records.
            </li>
            <li>
              Regions covered: <span className="font-semibold">{data.filters.regions.length}</span>.
            </li>
            {topStatuses.map(([status, count]) => (
              <li key={status}>
                {status}: <span className="font-semibold">{formatNumber(count)}</span> records.
              </li>
            ))}
          </ul>
        ),
        footer: <div>Statuses tracked: {Object.keys(statusCounts).length}</div>,
      };
    },
  };
}

function buildMapConfig(): AsyncConfig {
  return {
    type: "async",
    queryKey: queryKeys.map,
    queryFn: fetchMapPlan,
    loading: loadingState("AI Route Notes"),
    error: errorState("AI Route Notes"),
    build: (raw) => {
      const data = raw as MapPlanResponse;

      return {
        title: "AI Route Notes",
        description: "Planner evaluation of the proposed route.",
        children: (
          <div className="space-y-3 text-sm leading-5">
            <p>
              Estimated distance <span className="font-semibold">{data.summary.distance}</span> with ETA
              {" "}
              <span className="font-semibold">{data.summary.eta}</span>.
            </p>
            <p>
              Cost band classified as <span className="font-semibold">{data.summary.costBand}</span>.
            </p>
            <p>
              Vehicle profiles available: {data.options.vehicleProfiles.join(", ")}.
            </p>
          </div>
        ),
        footer: <div>Route steps evaluated: {data.steps.length}</div>,
      };
    },
  };
}

function getLeftConfig(pathname: string): LeftConfig {
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
      "AI Driver Signals",
      "Roster segmentation and regional coverage from the driver catalog.",
      queryKeys.masterData.drivers,
      fetchDriversMasterData
    );
  }

  if (pathname.startsWith("/master-data/units")) {
    return buildMasterDataConfig(
      "AI Asset Signals",
      "Utilization guardrails across the unit inventory.",
      queryKeys.masterData.units,
      fetchUnitsMasterData
    );
  }

  if (pathname.startsWith("/master-data/rules")) {
    return buildMasterDataConfig(
      "AI Policy Signals",
      "Activation health across pricing and compliance rules.",
      queryKeys.masterData.rules,
      fetchRulesMasterData
    );
  }

  if (pathname.startsWith("/master-data/events")) {
    return buildMasterDataConfig(
      "AI Event Signals",
      "Exception mix and automation coverage across event definitions.",
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
      title: "AI Insights",
      description: "Contextual guidance populates as you navigate core workspaces.",
      children: <p className="text-xs text-[var(--muted)]">No insights available for this view yet.</p>,
    },
  };
}

export function LeftAiInsights() {
  const pathname = usePathname() ?? "/";
  const config = useMemo(() => getLeftConfig(pathname), [pathname]);

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
