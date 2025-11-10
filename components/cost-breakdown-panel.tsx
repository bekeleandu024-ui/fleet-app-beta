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
    <section className="col-span-12 flex h-full flex-col gap-4 rounded-xl border border-subtle bg-surface-1 p-4 shadow-soft">
      <header>
        <h3 className="text-sm font-semibold text-[var(--text)]">Breakdown</h3>
        <p className="text-xs text-muted">Cost groupings aligned with pricing guardrails.</p>
      </header>
      <div className="grid flex-1 gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article key={section.title} className="flex flex-col gap-3 rounded-xl border border-subtle bg-surface-2 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">{section.title}</h4>
            <dl className="space-y-2 text-sm">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <div className="text-muted">
                    <dt className="font-medium text-[var(--text)]/90">{item.label}</dt>
                    {item.helper ? <dd className="text-xs text-muted">{item.helper}</dd> : null}
                  </div>
                  <dd className="text-sm font-semibold text-[var(--text)]">{item.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <footer className="flex items-center justify-between rounded-xl border border-subtle bg-surface-2 px-4 py-3 text-sm font-semibold text-[var(--text)]">
        <span className="text-muted">{totalLabel}</span>
        <span>{totalValue}</span>
      </footer>
    </section>
  );
}
