interface CostBreakdownItem {
  label: string;
  value: string;
  helper?: string;
}

export interface CostBreakdownSection {
  title: string;
  items: CostBreakdownItem[];
}

interface CostBreakdownPanelProps {
  sections: CostBreakdownSection[];
  totalLabel: string;
  totalValue: string;
}

export function CostBreakdownPanel({ sections, totalLabel, totalValue }: CostBreakdownPanelProps) {
  return (
    <section className="col-span-12 flex h-full flex-col gap-5 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 text-neutral-200 shadow-lg shadow-black/40">
      <header>
        <h3 className="text-sm font-semibold text-neutral-100">Breakdown</h3>
        <p className="text-xs text-neutral-400">Cost groupings aligned with pricing guardrails.</p>
      </header>
      <div className="grid flex-1 gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article key={section.title} className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{section.title}</h4>
            <dl className="space-y-2 text-sm">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <div className="text-neutral-400">
                    <dt className="font-medium text-neutral-100/90">{item.label}</dt>
                    {item.helper ? <dd className="text-xs text-neutral-500">{item.helper}</dd> : null}
                  </div>
                  <dd className="text-sm font-semibold text-neutral-100">{item.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <footer className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm font-semibold text-neutral-100">
        <span className="text-neutral-400">{totalLabel}</span>
        <span>{totalValue}</span>
      </footer>
    </section>
  );
}

