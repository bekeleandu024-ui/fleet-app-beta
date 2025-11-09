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
      <header
        className="sticky top-0 z-40"
        style={{
          backgroundColor: darkERPTheme.surface,
          borderBottom: `1px solid ${darkERPTheme.border}`,
          height: "72px",
        }}
      >
        <div className="h-full px-6 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm" style={{ color: darkERPTheme.textMuted }}>
              <span className="font-medium" style={{ color: darkERPTheme.textPrimary }}>
                Operations
              </span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium" style={{ color: darkERPTheme.textPrimary }}>
                Dashboard
              </span>
              <span className="ml-4 inline-flex items-center gap-2 text-xs uppercase tracking-wide" style={{ color: darkERPTheme.textMuted }}>
                <RefreshCw className="h-3.5 w-3.5" />
                Updated 2m ago
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="relative p-2 rounded"
                style={{
                  color: darkERPTheme.textMuted,
                  border: `1px solid ${darkERPTheme.border}`,
                  backgroundColor: darkERPTheme.surface2,
                }}
                aria-label="View notifications"
              >
                <Bell className="h-4 w-4" />
                <span
                  className="absolute top-1 right-1 h-2 w-2 rounded-full"
                  style={{ backgroundColor: darkERPTheme.severity.breach }}
                />
              </button>

              <button
                className="flex items-center gap-2 px-4 py-2 rounded"
                style={{
                  backgroundColor: darkERPTheme.surface2,
                  border: `1px solid ${darkERPTheme.border}`,
                  color: darkERPTheme.textPrimary,
                }}
                aria-label="Open user menu"
              >
                <div
                  className="h-8 w-8 rounded"
                  style={{
                    backgroundColor: darkERPTheme.surface,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <User className="h-4 w-4" style={{ color: darkERPTheme.textMuted }} />
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium">John Doe</div>
                  <div className="text-xs" style={{ color: darkERPTheme.textMuted }}>
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
                    className="inline-flex items-center gap-2 text-sm font-medium"
                    style={{
                      padding: "8px 16px",
                      borderRadius: darkERPTheme.radius.lg,
                      backgroundColor: darkERPTheme.surface2,
                      border: `1px solid ${darkERPTheme.border}`,
                      color: darkERPTheme.textPrimary,
                    }}
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
                <span className="text-xs uppercase tracking-wide" style={{ color: darkERPTheme.textMuted }}>
                  No active filters
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold tracking-wide uppercase"
                style={{ color: darkERPTheme.textMuted }}
              >
                Reset
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs" style={{ color: darkERPTheme.textMuted }}>
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
