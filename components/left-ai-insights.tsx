"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { SectionBanner } from "@/components/section-banner";
import { Select } from "@/components/ui/select";
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

export function LeftAiInsights() {
  const pathname = usePathname() ?? "/";

  if (pathname.startsWith("/orders")) {
    return <OrdersLeft />;
  }

  if (pathname.startsWith("/dispatch")) {
    return <DispatchLeft />;
  }

  if (pathname.startsWith("/trips")) {
    return <TripsLeft />;
  }

  if (pathname.startsWith("/costing")) {
    return <CostingLeft />;
  }

  if (pathname.startsWith("/master-data/drivers")) {
    return (
      <MasterDataLeft
        title="Driver Filters"
        subtitle="Focus roster segments before drilling into the directory."
        queryKey={queryKeys.masterData.drivers}
        queryFn={fetchDriversMasterData}
      />
    );
  }

  if (pathname.startsWith("/master-data/units")) {
    return (
      <MasterDataLeft
        title="Unit Filters"
        subtitle="Filter by region and status to surface availability."
        queryKey={queryKeys.masterData.units}
        queryFn={fetchUnitsMasterData}
      />
    );
  }

  if (pathname.startsWith("/master-data/rules")) {
    return (
      <MasterDataLeft
        title="Rule Filters"
        subtitle="Dial in policy regions and activation state."
        queryKey={queryKeys.masterData.rules}
        queryFn={fetchRulesMasterData}
      />
    );
  }

  if (pathname.startsWith("/master-data/events")) {
    return (
      <MasterDataLeft
        title="Event Filters"
        subtitle="Scope automation coverage by region and status."
        queryKey={queryKeys.masterData.events}
        queryFn={fetchEventsMasterData}
      />
    );
  }

  if (pathname.startsWith("/map")) {
    return <MapLeft />;
  }

  return <DashboardLeft />;
}

function DashboardLeft() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.dashboard, queryFn: fetchDashboard });

  if (isLoading && !data) {
    return (
      <SectionBanner title="AI Operations Briefing" subtitle="Synthesizing telemetry for quick triage." aria-live="polite">
        <LoadingParagraph lines={4} />
      </SectionBanner>
    );
  }

  if (isError || !data) {
    return (
      <SectionBanner title="AI Operations Briefing" aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">
          Unable to surface the latest network insights. Refresh to try again.
        </p>
      </SectionBanner>
    );
  }

  const healthCounts = data.serviceHealth.reduce(
    (acc, service) => {
      acc[service.status] += 1;
      return acc;
    },
    { ok: 0, warn: 0, alert: 0 }
  );

  const primaryLane = data.glance.topLanes[0];

  return (
    <SectionBanner
      title="AI Operations Briefing"
      subtitle="Network pulse with forward-looking risk markers."
      aria-live="polite"
    >
      <ul className="space-y-3 text-sm leading-6">
        <li>
          <strong className="font-semibold text-[var(--text)]">{formatNumber(data.metrics.activeOrders)}</strong> active orders
          with <strong className="font-semibold text-[var(--text)]">{formatNumber(data.metrics.inTransit)}</strong> currently in
          motion.
        </li>
        <li>
          On-time performance holding at {formatPercent(data.metrics.onTimePercent)} with {" "}
          <strong className="font-semibold text-[var(--text)]">{formatNumber(data.metrics.exceptions)}</strong> exceptions on
          deck.
        </li>
        {primaryLane ? (
          <li>
            Watch lane <strong className="font-semibold text-[var(--text)]">{primaryLane.lane}</strong> ({primaryLane.orders} loads)
            trending {formatPercent(primaryLane.onTimePercent)} on-time.
          </li>
        ) : null}
      </ul>
      <div className="flex flex-wrap gap-2 text-xs text-[color-mix(in_srgb,var(--muted)_80%,transparent)]">
        <span>{healthCounts.ok} stable</span>
        <span>• {healthCounts.warn} watch</span>
        <span>• {healthCounts.alert} alerts</span>
      </div>
    </SectionBanner>
  );
}

function OrdersLeft() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.orders(), queryFn: fetchOrders });

  const loading = isLoading && !data;

  return (
    <div className="flex flex-col gap-6">
      <SectionBanner
        title="Orders Filters"
        subtitle="Focus customers, status mix, and lanes for action."
        aria-live="polite"
      >
        {loading ? (
          <LoadingForm />
        ) : isError || !data ? (
          <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">
            Filters unavailable right now. Reload to continue.
          </p>
        ) : (
          <div className="space-y-4">
            <Field label="Customer">
              <Select defaultValue={data.filters.customers[0] ?? ""}>
                {data.filters.customers.map((customer) => (
                  <option key={customer}>{customer}</option>
                ))}
              </Select>
            </Field>
            <Field label="Status (multi-select)">
              <div className="space-y-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
                {data.filters.statuses.slice(0, 4).map((status) => (
                  <label key={status} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked className="size-4 accent-[var(--brand)]" />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Date Range">
              <Select defaultValue={data.filters.dateRanges[0] ?? ""}>
                {data.filters.dateRanges.map((range) => (
                  <option key={range}>{range}</option>
                ))}
              </Select>
            </Field>
            <Field label="Lane">
              <Select defaultValue={data.filters.lanes[0] ?? ""}>
                {data.filters.lanes.map((lane) => (
                  <option key={lane}>{lane}</option>
                ))}
              </Select>
            </Field>
          </div>
        )}
      </SectionBanner>

      <SectionBanner
        title="AI Order Guidance"
        subtitle="Prioritization and risk notes from the planner."
        aria-live="polite"
      >
        {loading ? (
          <LoadingParagraph lines={3} />
        ) : isError || !data ? (
          <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">
            Unable to synthesize order guidance at the moment.
          </p>
        ) : (
          <ul className="space-y-3 text-sm leading-6">
            <li>
              Queue size <strong className="font-semibold text-[var(--text)]">{formatNumber(data.stats.total)}</strong> orders with
              {" "}
              <strong className="font-semibold text-[var(--text)]">{formatNumber(data.stats.new)}</strong> new today.
            </li>
            <li>
              <strong className="font-semibold text-[var(--text)]">{formatNumber(data.stats.delayed)}</strong> delayed loads require
              escalation; maintain {formatNumber(data.stats.inProgress)} in motion.
            </li>
            <li>Focus statuses: {data.filters.statuses.slice(0, 3).join(", ")}.</li>
          </ul>
        )}
        {!loading && data ? (
          <div className="text-xs text-[color-mix(in_srgb,var(--muted)_80%,transparent)]">
            Filters span {data.filters.customers.length} customers across {data.filters.lanes.length} lanes.
          </div>
        ) : null}
      </SectionBanner>
    </div>
  );
}

function DispatchLeft() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.dispatch, queryFn: fetchDispatch });

  if (isLoading && !data) {
    return (
      <SectionBanner title="AI Launch Recommendation" subtitle="Pre-flight readiness summary." aria-live="polite">
        <LoadingParagraph lines={4} />
      </SectionBanner>
    );
  }

  if (isError || !data) {
    return (
      <SectionBanner title="AI Launch Recommendation" aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">
          Dispatch signals unavailable. Check connectivity and refresh.
        </p>
      </SectionBanner>
    );
  }

  const primary = data.qualifiedOrders[0];

  return (
    <SectionBanner
      title="AI Launch Recommendation"
      subtitle="Guardrail-aware callouts before confirming assignments."
      aria-live="polite"
    >
      {primary ? (
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_80%,transparent)]">Primary candidate</p>
          <p className="text-sm font-semibold">{primary.reference}</p>
          <p className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">
            {primary.customer} • {primary.lane} • {primary.priority} priority
          </p>
        </div>
      ) : null}
      <div className="space-y-2 text-sm leading-6">
        <p className="font-semibold">{data.recommendation.title}</p>
        <p className="text-[color-mix(in_srgb,var(--muted)_88%,transparent)]">{data.recommendation.description}</p>
        <ul className="list-disc space-y-1 pl-4 text-[color-mix(in_srgb,var(--muted)_88%,transparent)]">
          {data.recommendation.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
      <div className="text-xs text-[color-mix(in_srgb,var(--muted)_80%,transparent)]">
        {data.qualifiedOrders.length} qualified orders in scope for assignment.
      </div>
    </SectionBanner>
  );
}

function TripsLeft() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.trips(), queryFn: fetchTrips });

  if (isLoading && !data) {
    return (
      <SectionBanner title="AI Trip Monitor" subtitle="Exception patterns across the network." aria-live="polite">
        <LoadingParagraph lines={4} />
      </SectionBanner>
    );
  }

  if (isError || !data) {
    return (
      <SectionBanner title="AI Trip Monitor" aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">
          Trip telemetry unavailable right now. Refresh to continue.
        </p>
      </SectionBanner>
    );
  }

  const exceptionTrip = data.data.find((trip) => trip.exceptions > 0);

  return (
    <SectionBanner
      title="AI Trip Monitor"
      subtitle="Targets trips with potential dwell or service risk."
      aria-live="polite"
    >
      <ul className="space-y-3 text-sm leading-6">
        <li>
          <strong className="font-semibold text-[var(--text)]">{formatNumber(data.stats.active)}</strong> active trips with
          {" "}
          <strong className="font-semibold text-[var(--text)]">{formatNumber(data.stats.late)}</strong> running late.
        </li>
        <li>
          Exceptions in flight: <strong className="font-semibold text-[var(--text)]">{formatNumber(data.stats.exception)}</strong>.
        </li>
        {exceptionTrip ? (
          <li>
            Focus {exceptionTrip.tripNumber} ({exceptionTrip.driver}) holding {exceptionTrip.exceptions} open exception
            {exceptionTrip.exceptions === 1 ? "" : "s"}.
          </li>
        ) : null}
      </ul>
      <div className="text-xs text-[color-mix(in_srgb,var(--muted)_80%,transparent)]">
        Last ping sample: {exceptionTrip ? new Date(exceptionTrip.lastPing).toLocaleString() : "All trips healthy"}
      </div>
    </SectionBanner>
  );
}

function CostingLeft() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.costing, queryFn: fetchCostingDefaults });

  if (isLoading && !data) {
    return (
      <SectionBanner title="AI Pricing Guardrails" subtitle="Finance-aligned recommendations." aria-live="polite">
        <LoadingParagraph lines={4} />
      </SectionBanner>
    );
  }

  if (isError || !data) {
    return (
      <SectionBanner title="AI Pricing Guardrails" aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">
          Pricing guardrails unavailable. Reopen after refreshing the costing data.
        </p>
      </SectionBanner>
    );
  }

  return (
    <SectionBanner
      title="AI Pricing Guardrails"
      subtitle="Targets to anchor RPM, revenue, and break-even."
      aria-live="polite"
    >
      <ul className="space-y-3 text-sm leading-6">
        <li>
          Recommended RPM: <strong className="font-semibold text-[var(--text)]">{data.targets.recommendedRPM}</strong> with
          revenue target {data.targets.revenue}.
        </li>
        <li>
          Break-even RPM sits at <strong className="font-semibold text-[var(--text)]">{data.targets.breakEven}</strong>.
        </li>
        <li>
          Base scenario assumes {formatNumber(data.form.miles)} mi, {data.form.pickups} pickups, {data.form.deliveries} deliveries.
        </li>
      </ul>
      <div className="text-xs text-[color-mix(in_srgb,var(--muted)_80%,transparent)]">Total cost benchmark: {data.breakdown.totalValue}</div>
    </SectionBanner>
  );
}

function MasterDataLeft({
  title,
  subtitle,
  queryKey,
  queryFn,
}: {
  title: string;
  subtitle: string;
  queryKey: readonly unknown[];
  queryFn: () => Promise<MasterDataResponse>;
}) {
  const { data, isLoading, isError } = useQuery({ queryKey, queryFn });

  if (isLoading && !data) {
    return (
      <SectionBanner title={title} subtitle={subtitle} aria-live="polite">
        <LoadingForm />
      </SectionBanner>
    );
  }

  if (isError || !data) {
    return (
      <SectionBanner title={title} subtitle={subtitle} aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">
          Filters unavailable right now. Refresh to continue.
        </p>
      </SectionBanner>
    );
  }

  const statusCounts = data.data.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <SectionBanner title={title} subtitle={subtitle} aria-live="polite">
      <div className="space-y-4">
        <Field label="Region">
          <Select defaultValue={data.filters.regions[0] ?? ""}>
            {data.filters.regions.map((region) => (
              <option key={region}>{region}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <div className="space-y-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            {data.filters.statuses.map((status) => (
              <label key={status} className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked className="size-4 accent-[var(--brand)]" />
                <span>{status}</span>
              </label>
            ))}
          </div>
        </Field>
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
          Catalog size <strong className="font-semibold text-[var(--text)]">{formatNumber(data.data.length)}</strong> entries •
          tracking {Object.keys(statusCounts).length} statuses.
        </div>
      </div>
    </SectionBanner>
  );
}

function MapLeft() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.map, queryFn: fetchMapPlan });

  if (isLoading && !data) {
    return (
      <SectionBanner title="AI Route Notes" subtitle="Planner evaluation of the proposed route." aria-live="polite">
        <LoadingParagraph lines={4} />
      </SectionBanner>
    );
  }

  if (isError || !data) {
    return (
      <SectionBanner title="AI Route Notes" aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">
          Unable to score the proposed route. Try again shortly.
        </p>
      </SectionBanner>
    );
  }

  return (
    <SectionBanner
      title="AI Route Notes"
      subtitle="Highlights ETA, distance, and cost classification."
      aria-live="polite"
    >
      <ul className="space-y-3 text-sm leading-6">
        <li>
          Estimated distance <strong className="font-semibold text-[var(--text)]">{data.summary.distance}</strong> with ETA
          {" "}
          <strong className="font-semibold text-[var(--text)]">{data.summary.eta}</strong>.
        </li>
        <li>Cost band classified as {data.summary.costBand}.</li>
        <li>Vehicle profiles: {data.options.vehicleProfiles.join(", ")}.</li>
      </ul>
      <div className="text-xs text-[color-mix(in_srgb,var(--muted)_80%,transparent)]">Route steps evaluated: {data.steps.length}</div>
    </SectionBanner>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{label}</span>
      {children}
    </label>
  );
}

function LoadingParagraph({ lines }: { lines: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="h-3 w-full animate-pulse rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)]" />
      ))}
    </div>
  );
}

function LoadingForm() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)]" />
          <div className="h-11 w-full animate-pulse rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)]" />
        </div>
      ))}
    </div>
  );
}
