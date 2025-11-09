"use client";

import { useState } from "react";
import { Bell, ChevronRight, RefreshCw, User, X } from "lucide-react";
import { darkERPTheme } from "@/app/lib/theme-config";

interface FilterChip {
  id: string;
  label: string;
  value: string;
}

const DEFAULT_FILTERS: FilterChip[] = [
  { id: "region", label: "Region", value: "Ontario" },
  { id: "customer", label: "Customer", value: "Acme Corp" },
  { id: "date", label: "Date", value: "This Week" },
];

export default function TopBar() {
  const [filters, setFilters] = useState<FilterChip[]>(DEFAULT_FILTERS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasFilters = filters.length > 0;

  const handleRemoveFilter = (id: string) => {
    setFilters((previous) => previous.filter((chip) => chip.id !== id));
    triggerRefresh();
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    triggerRefresh();
  };

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 900);
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-[72px] border-b border-border bg-card">
        <div className="flex h-full flex-col justify-center px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Operations
              </span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground">
                Dashboard
              </span>
              <span className="ml-4 inline-flex items-center gap-2 text-xs uppercase tracking-wide">
                <RefreshCw className="h-3.5 w-3.5" />
                Updated 2m ago
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="relative rounded border border-border bg-card/80 p-2 text-muted-foreground"
                aria-label="View notifications"
              >
                <Bell className="h-4 w-4" />
                <span
                  className="absolute top-1 right-1 h-2 w-2 rounded-full"
                  style={{ backgroundColor: darkERPTheme.severity.breach }}
                />
              </button>

              <button
                className="flex items-center gap-2 rounded border border-border bg-card px-4 py-2 text-foreground"
                aria-label="Open user menu"
              >
                <div className="grid h-8 w-8 place-items-center rounded border border-border bg-background text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-foreground">John Doe</div>
                  <div className="text-xs text-muted-foreground">
                    Operations Lead
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {hasFilters ? (
                filters.map((filter) => (
                  <div
                    key={filter.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
                  >
                    <span>
                      {filter.label}: {filter.value}
                    </span>
                    <button
                      onClick={() => handleRemoveFilter(filter.id)}
                      className="opacity-70 hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${filter.label} filter`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  No active filters
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Filters apply to dashboard-wide metrics and insights.</span>
            </div>
          </div>
        </div>
      </header>

      {isRefreshing && (
        <div className="h-0.5 w-full overflow-hidden">
          <div
            className="h-full w-full animate-pulse"
            style={{ backgroundColor: darkERPTheme.hoverAccent, opacity: 0.65 }}
          />
        </div>
      )}
    </>
  );
}
