"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info, Route } from "lucide-react";

import { SectionBanner } from "@/components/section-banner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fetchDispatch } from "@/lib/api";
import { queryKeys } from "@/lib/query";

export default function DispatchPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.dispatch, queryFn: fetchDispatch });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const activeOrder = useMemo(() => {
    if (!data) return null;
    const found = data.qualifiedOrders.find((item) => item.id === selectedOrderId);
    return found ?? data.qualifiedOrders[0] ?? null;
  }, [data, selectedOrderId]);

  if (isLoading && !data) {
    return <DispatchSkeleton />;
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Dispatch Control" subtitle="Queue and assign qualified orders." aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">Dispatch data unavailable.</p>
      </SectionBanner>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <QualifiedOrdersBanner
        data={data}
        activeOrder={activeOrder}
        onSelect={(id) => setSelectedOrderId(id)}
      />
      <AssignmentBanner data={data} activeOrder={activeOrder} />
    </div>
  );
}

function QualifiedOrdersBanner({
  data,
  activeOrder,
  onSelect,
}: {
  data: Awaited<ReturnType<typeof fetchDispatch>>;
  activeOrder: Awaited<ReturnType<typeof fetchDispatch>>["qualifiedOrders"][number] | null;
  onSelect: (id: string) => void;
}) {
  return (
    <SectionBanner
      title="Qualified Orders"
      subtitle="Sequenced work items ready for dispatch confirmation."
      aria-live="polite"
      actions={
        <div className="flex flex-wrap items-center gap-2 text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">
          {data.filters.priorities.map((priority) => (
            <Chip key={priority} className="text-xs" tone="default">
              {priority}
            </Chip>
          ))}
        </div>
      }
    >
      <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
        {data.qualifiedOrders.map((order) => {
          const isActive = activeOrder?.id === order.id;
          return (
            <button
              key={order.id}
              type="button"
              onClick={() => onSelect(order.id)}
              className={`w-full rounded-[var(--radius)] border px-4 py-3 text-left transition-colors ${
                isActive
                  ? "border-[color-mix(in_srgb,var(--brand)_60%,transparent)] bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] hover:bg-[color-mix(in_srgb,var(--surface-2)_85%,black_15%)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">
                <span>{order.priority}</span>
                <span>{order.status}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">{order.reference}</p>
              <p className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{order.customer}</p>
              <p className="mt-2 text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{order.lane}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[color-mix(in_srgb,var(--muted)_80%,transparent)]">
                <Chip tone="default" className="text-xs">Miles {order.miles}</Chip>
                <Chip tone="default" className="text-xs">
                  Window {order.pickupWindow} → {order.deliveryWindow}
                </Chip>
              </div>
            </button>
          );
        })}
      </div>
    </SectionBanner>
  );
}

function AssignmentBanner({
  data,
  activeOrder,
}: {
  data: Awaited<ReturnType<typeof fetchDispatch>>;
  activeOrder: Awaited<ReturnType<typeof fetchDispatch>>["qualifiedOrders"][number] | null;
}) {
  return (
    <SectionBanner
      title="Assignment & Guardrails"
      subtitle="Pair the right crew and confirm financial guardrails."
      aria-live="polite"
      footer={
        <div className="flex flex-wrap items-center gap-2 text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">
          <Info className="size-4" /> Ensure guardrails satisfied before launch.
        </div>
      }
    >
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Route className="size-4 text-[var(--brand)]" /> Recommended pairing
        </h3>
        <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{data.recommendation.description}</p>
        <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">
          {data.recommendation.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>

      <form className="grid gap-4 text-sm">
        <Field label="Driver">
          <Select defaultValue={data.crew.drivers[0]?.id ?? ""}>
            {data.crew.drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name} • {driver.status} ({driver.hoursAvailable}h)
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Unit">
          <Select defaultValue={data.crew.units[0]?.id ?? ""}>
            {data.crew.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.id} • {unit.type} ({unit.status})
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Trip Type">
            <Select defaultValue={data.tripForm.tripTypes[0] ?? ""}>
              {data.tripForm.tripTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </Select>
          </Field>
          <Field label="Rate">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(120px,160px)] gap-2">
              <Input
                type="number"
                defaultValue={activeOrder?.miles ? Math.round(activeOrder.miles * 3.9) : 0}
                min={0}
              />
              <Select defaultValue={data.tripForm.rateUnits[0] ?? ""}>
                {data.tripForm.rateUnits.map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </Select>
            </div>
          </Field>
        </div>
        <Field label="Projected Miles">
          <Input type="number" defaultValue={activeOrder?.miles ?? 0} min={0} />
        </Field>
        <Field label="Notes">
          <textarea
            rows={4}
            className="min-h-[120px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-0"
            placeholder="Add assignment notes or guardrails"
          />
        </Field>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button size="sm" variant="subtle">
            Save Draft
          </Button>
          <Button size="sm" variant="primary">
            Launch Trip
          </Button>
        </div>
      </form>
    </SectionBanner>
  );
}

function DispatchSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <SectionBanner title="Qualified Orders" subtitle="Sequenced work items ready for dispatch confirmation." aria-live="polite">
        <div className="h-72 animate-pulse rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)]" />
      </SectionBanner>
      <SectionBanner title="Assignment & Guardrails" subtitle="Pair the right crew and confirm financial guardrails." aria-live="polite">
        <div className="h-80 animate-pulse rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)]" />
      </SectionBanner>
    </div>
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
