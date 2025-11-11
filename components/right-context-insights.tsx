"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { SectionBanner } from "@/components/section-banner";
import { Chip } from "@/components/ui/chip";
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
import type { MasterDataResponse } from "@/lib/types";

export function RightContextInsights() {
  const pathname = usePathname() ?? "/";

  if (pathname === "/" || pathname.startsWith("/dashboard")) {
    return <DashboardRight />;
  }

  if (pathname.startsWith("/orders")) {
    return <OrdersRight />;
  }

  if (pathname.startsWith("/dispatch")) {
    return <DispatchRight />;
  }

  if (pathname.startsWith("/trips")) {
    return <TripsRight />;
  }

  if (pathname.startsWith("/costing")) {
    return <CostingRight />;
  }

  if (pathname.startsWith("/master-data/drivers")) {
    return <MasterDataRight title="Driver Maintenance" queryKey={queryKeys.masterData.drivers} queryFn={fetchDriversMasterData} />;
  }

  if (pathname.startsWith("/master-data/units")) {
    return <MasterDataRight title="Unit Maintenance" queryKey={queryKeys.masterData.units} queryFn={fetchUnitsMasterData} />;
  }

  if (pathname.startsWith("/master-data/rules")) {
    return <MasterDataRight title="Rule Compliance" queryKey={queryKeys.masterData.rules} queryFn={fetchRulesMasterData} />;
  }

  if (pathname.startsWith("/master-data/events")) {
    return <MasterDataRight title="Event Compliance" queryKey={queryKeys.masterData.events} queryFn={fetchEventsMasterData} />;
  }

  if (pathname.startsWith("/map")) {
    return <MapRight />;
  }

  return <GenericRight />;
}

function DashboardRight() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.dashboard, queryFn: fetchDashboard });

  if (isLoading && !data) {
    return (
      <SectionBanner title="Today at a Glance" subtitle="Lane and resource signal recap." aria-live="polite">
        <LoadingBlock />
      </SectionBanner>
    );
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Today at a Glance" aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">Context unavailable. Refresh shortly.</p>
      </SectionBanner>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionBanner
        title="Today at a Glance"
        subtitle="Performance anchors for the live network."
        aria-live="polite"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Top lanes</h3>
            <ul className="space-y-2 text-sm">
              {data.glance.topLanes.map((lane) => (
                <li key={lane.lane} className="flex items-center justify-between gap-2">
                  <span className="font-medium">{lane.lane}</span>
                  <span className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">
                    {lane.orders} loads • {formatPercent(lane.onTimePercent)} on-time
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Resources</h3>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Drivers available</span>
                <span className="font-semibold">{data.glance.drivers.available}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Drivers booked</span>
                <span className="font-semibold">{data.glance.drivers.booked}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Units available</span>
                <span className="font-semibold">{data.glance.units.available}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Units down</span>
                <span className="font-semibold">{data.glance.units.down}</span>
              </div>
            </div>
          </div>
        </div>
      </SectionBanner>
    </div>
  );
}

function OrdersRight() {
  const costing = useQuery({ queryKey: queryKeys.costing, queryFn: fetchCostingDefaults });
  const drivers = useQuery({ queryKey: queryKeys.masterData.drivers, queryFn: fetchDriversMasterData });

  const loading = costing.isLoading || drivers.isLoading;

  return (
    <SectionBanner
      title="Pricing & Assignment Hints"
      subtitle="Finance and roster markers that influence orders."
      aria-live="polite"
    >
      {loading ? (
        <LoadingBlock />
      ) : costing.isError || !costing.data || drivers.isError || !drivers.data ? (
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">
          Unable to surface pricing hints. Refresh to try again.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Chip tone="brand">Recommended RPM {costing.data.targets.recommendedRPM}</Chip>
            <Chip tone="ok">Target revenue {costing.data.targets.revenue}</Chip>
            <Chip tone="warn">Break-even {costing.data.targets.breakEven}</Chip>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm">
            <h3 className="text-xs uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Margin bands</h3>
            <ul className="mt-2 space-y-2">
              {costing.data.breakdown.sections[0]?.items.slice(0, 3).map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-3">
                  <span>{item.label}</span>
                  <span className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Recommended drivers</h3>
            <ul className="space-y-2 text-sm">
              {drivers.data.data.slice(0, 3).map((driver) => (
                <li key={driver.id} className="flex items-center justify-between">
                  <span>{driver.name}</span>
                  <span className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{driver.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </SectionBanner>
  );
}

function DispatchRight() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.dispatch, queryFn: fetchDispatch });

  if (isLoading && !data) {
    return (
      <SectionBanner title="Crew & Assets" subtitle="Roster readiness for assignment." aria-live="polite">
        <LoadingBlock />
      </SectionBanner>
    );
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Crew & Assets" aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">Unable to load crew roster.</p>
      </SectionBanner>
    );
  }

  return (
    <SectionBanner title="Crew & Assets" subtitle="Live roster mix supporting dispatch." aria-live="polite">
      <div className="space-y-4 text-sm">
        <div>
          <h3 className="text-xs uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Drivers</h3>
          <ul className="mt-2 space-y-2">
            {data.crew.drivers.slice(0, 4).map((driver) => (
              <li key={driver.id} className="flex items-center justify-between">
                <span>{driver.name}</span>
                <span className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{driver.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Units</h3>
          <ul className="mt-2 space-y-2">
            {data.crew.units.slice(0, 4).map((unit) => (
              <li key={unit.id} className="flex items-center justify-between">
                <span>{unit.id}</span>
                <span className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{unit.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionBanner>
  );
}

function TripsRight() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.trips(), queryFn: fetchTrips });

  if (isLoading && !data) {
    return (
      <SectionBanner title="Trip Insights" subtitle="Exception filters and callouts." aria-live="polite">
        <LoadingBlock />
      </SectionBanner>
    );
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Trip Insights" aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">Unable to load trip summaries.</p>
      </SectionBanner>
    );
  }

  return (
    <SectionBanner title="Trip Insights" subtitle="Exception mix by type." aria-live="polite">
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2">
          {data.filters.exceptions.slice(0, 3).map((exception) => (
            <Chip key={exception} tone="warn">
              {exception}
            </Chip>
          ))}
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <h3 className="text-xs uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Status mix</h3>
          <ul className="mt-2 space-y-2">
            {data.filters.statuses.slice(0, 4).map((status) => (
              <li key={status} className="flex items-center justify-between">
                <span>{status}</span>
                <span className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">
                  {formatNumber(data.data.filter((trip) => trip.status === status).length)} trips
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionBanner>
  );
}

function CostingRight() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.costing, queryFn: fetchCostingDefaults });

  if (isLoading && !data) {
    return (
      <SectionBanner title="Recent Calculations" subtitle="Latest costing work." aria-live="polite">
        <LoadingBlock />
      </SectionBanner>
    );
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Recent Calculations" aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">Unable to load costing summaries.</p>
      </SectionBanner>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionBanner title="Recent Calculations" subtitle="Form defaults and quick recalls." aria-live="polite">
        <ul className="space-y-3 text-sm">
          <li>Last scenario miles: {formatNumber(data.form.miles)}</li>
          <li>
            Route: {data.form.origin} → {data.form.destination}
          </li>
          <li>Order type: {data.form.orderType}</li>
        </ul>
      </SectionBanner>
      <SectionBanner title="Anomalies" subtitle="Cost bands to monitor." aria-live="polite">
        <ul className="space-y-2 text-sm">
          {data.breakdown.sections.flatMap((section) => section.items.slice(0, 2)).map((item) => (
            <li key={`${item.label}-${item.value}`} className="flex items-center justify-between">
              <span>{item.label}</span>
              <span className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{item.value}</span>
            </li>
          ))}
        </ul>
        <div className="text-xs text-[color-mix(in_srgb,var(--muted)_80%,transparent)]">Total {data.breakdown.totalValue}</div>
      </SectionBanner>
    </div>
  );
}

function MasterDataRight({
  title,
  queryKey,
  queryFn,
}: {
  title: string;
  queryKey: readonly unknown[];
  queryFn: () => Promise<MasterDataResponse>;
}) {
  const { data, isLoading, isError } = useQuery({ queryKey, queryFn });

  if (isLoading && !data) {
    return (
      <SectionBanner title={title} subtitle="Upcoming compliance checkpoints." aria-live="polite">
        <LoadingBlock />
      </SectionBanner>
    );
  }

  if (isError || !data) {
    return (
      <SectionBanner title={title} aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">Unable to load upcoming maintenance.</p>
      </SectionBanner>
    );
  }

  return (
    <SectionBanner title={title} subtitle="Due soon items across the catalog." aria-live="polite">
      <ul className="space-y-3 text-sm">
        {data.data.slice(0, 4).map((row) => (
          <li key={row.id} className="flex items-center justify-between">
            <span>{row.name}</span>
            <span className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{row.updated}</span>
          </li>
        ))}
      </ul>
    </SectionBanner>
  );
}

function MapRight() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.map, queryFn: fetchMapPlan });

  if (isLoading && !data) {
    return (
      <SectionBanner title="Route KPI Band" subtitle="Projected outcomes." aria-live="polite">
        <LoadingBlock />
      </SectionBanner>
    );
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Route KPI Band" aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">Unable to load route KPIs.</p>
      </SectionBanner>
    );
  }

  return (
    <SectionBanner title="Route KPI Band" subtitle="Quick conversion metrics." aria-live="polite">
      <div className="flex flex-col gap-2 text-sm">
        <Chip tone="brand">Distance {data.summary.distance}</Chip>
        <Chip tone="ok">ETA {data.summary.eta}</Chip>
        <Chip tone="warn">Cost band {data.summary.costBand}</Chip>
      </div>
    </SectionBanner>
  );
}

function GenericRight() {
  const orders = useQuery({ queryKey: queryKeys.orders(), queryFn: fetchOrders });

  if (orders.isLoading && !orders.data) {
    return (
      <SectionBanner title="Context Insights" subtitle="Supporting metrics for the workspace." aria-live="polite">
        <LoadingBlock />
      </SectionBanner>
    );
  }

  if (orders.isError || !orders.data) {
    return (
      <SectionBanner title="Context Insights" aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">No supporting insights available.</p>
      </SectionBanner>
    );
  }

  return (
    <SectionBanner title="Context Insights" subtitle="Order mix snapshot." aria-live="polite">
      <ul className="space-y-2 text-sm">
        <li>Total orders: {formatNumber(orders.data.stats.total)}</li>
        <li>Delayed: {formatNumber(orders.data.stats.delayed)}</li>
        <li>Active lanes: {orders.data.filters.lanes.length}</li>
      </ul>
    </SectionBanner>
  );
}

function LoadingBlock() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-3 w-full animate-pulse rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)]" />
      ))}
    </div>
  );
}
