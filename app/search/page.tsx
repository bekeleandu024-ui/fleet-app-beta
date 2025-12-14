"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Loader2, Search as SearchIcon } from "lucide-react";

import { SectionBanner } from "@/components/section-banner";
import { Badge } from "@/components/ui/badge";
import { fetchGlobalSearch } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import type { GlobalSearchResult } from "@/lib/types";

const typeLabels: Record<GlobalSearchResult["type"], string> = {
  order: "Order",
  trip: "Trip",
  driver: "Driver",
  unit: "Unit",
  customer: "Customer",
};

const typeBadgeClasses: Record<GlobalSearchResult["type"], string> = {
  order: "border-blue-500/50 bg-blue-500/10 text-blue-300",
  trip: "border-cyan-500/50 bg-cyan-500/10 text-cyan-300",
  driver: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  unit: "border-teal-500/50 bg-teal-500/10 text-teal-300",
  customer: "border-purple-500/50 bg-purple-500/10 text-purple-300",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading search results...</div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const hasQuery = query.length > 0;

  const { data, isError, isFetching } = useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => fetchGlobalSearch(query),
    enabled: hasQuery,
  });

  const results = data?.results ?? [];

  const orderedResults = useMemo(() => {
    const order = ["order", "trip", "driver", "unit", "customer"] as const;
    return [...results].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  }, [results]);

  return (
    <SectionBanner
      title="Global search"
      subtitle="Search across orders, trips, drivers, units, and customers."
      aria-live="polite"
    >
      {!hasQuery ? (
        <p className="text-sm text-zinc-400">
          Use the search bar above to look up orders, trips, drivers, units, or customers. Try searching for an ID like
          <span className="text-zinc-200"> TRP-9001</span> or a customer name.
        </p>
      ) : isError ? (
        <p className="text-sm text-rose-400">Unable to load search results. Please try again.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            {isFetching ? (
              <Loader2 className="size-4 animate-spin text-zinc-300" aria-hidden="true" />
            ) : (
              <SearchIcon className="size-4 text-zinc-500" aria-hidden="true" />
            )}
            {results.length === 0 ? (
              <span>
                No results for <span className="text-zinc-100">“{query}”</span>.
              </span>
            ) : (
              <span>
                Showing {results.length} result{results.length === 1 ? "" : "s"} for <span className="text-zinc-100">“{query}”</span>.
              </span>
            )}
          </div>

          {results.length > 0 ? (
            <ul className="space-y-3">
              {orderedResults.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <Link
                    href={result.href}
                    className="block rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 transition hover:border-blue-500/60 hover:bg-zinc-900/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <Badge variant="secondary" className={typeBadgeClasses[result.type]}>
                          {typeLabels[result.type]}
                        </Badge>
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-zinc-100">{result.title}</p>
                          <p className="text-sm text-zinc-400">{result.description}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                    </div>
                    {result.meta.length > 0 ? (
                      <div className="mt-4 grid gap-3 text-xs text-zinc-400 sm:grid-cols-2">
                        {result.meta.map((item) => (
                          <div
                            key={`${result.id}-${item.label}`}
                            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2"
                          >
                            <span className="text-[11px] uppercase tracking-wide text-zinc-500">{item.label}</span>
                            <span className="text-sm text-zinc-200">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </SectionBanner>
  );
}

