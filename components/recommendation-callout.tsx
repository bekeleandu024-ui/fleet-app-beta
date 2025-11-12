import { Lightbulb } from "lucide-react";

interface RecommendationCalloutProps {
  title: string;
  description?: string;
  bullets?: string[];
}

export function RecommendationCallout({ title, description, bullets = [] }: RecommendationCalloutProps) {
  return (
    <aside className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 text-sm text-neutral-300 shadow-lg shadow-black/40">
      <header className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
          <Lightbulb className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
          {description ? <p className="text-xs text-neutral-400">{description}</p> : null}
        </div>
      </header>
      {bullets.length ? (
        <ul className="mt-4 space-y-2 text-xs text-neutral-400">
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
