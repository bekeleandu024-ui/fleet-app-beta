import { Lightbulb } from "lucide-react";

interface RecommendationCalloutProps {
  title: string;
  description?: string;
  bullets?: string[];
}

export function RecommendationCallout({ title, description, bullets = [] }: RecommendationCalloutProps) {
  return (
    <aside className="rounded-xl border border-subtle bg-surface-2 p-4 text-sm shadow-soft">
      <header className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--brand)_20%,transparent)] text-[var(--brand)]">
          <Lightbulb className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
          {description ? <p className="text-xs text-muted">{description}</p> : null}
        </div>
      </header>
      {bullets.length ? (
        <ul className="mt-3 space-y-2 text-xs text-muted">
          {bullets.map((bullet) => (
            <li key={bullet} className="leading-5">
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}
