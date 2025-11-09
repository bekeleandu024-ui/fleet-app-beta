"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { darkERPTheme } from "@/app/lib/theme-config";

interface FilterChip {
  id: string;
  label: string;
  value: string;
}

export default function GlobalFilters() {
  const [activeFilters, setActiveFilters] = useState<FilterChip[]>([
    { id: "1", label: "Region", value: "Ontario" },
    { id: "2", label: "Customer", value: "Acme Corp" },
  ]);

  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const availableFilters = [
    { key: "date", label: "Date Range", options: ["Today", "This Week", "This Month"] },
    { key: "region", label: "Region", options: ["Ontario", "Quebec", "BC", "Alberta"] },
    { key: "customer", label: "Customer", options: ["Acme Corp", "Global Shipping", "FastFreight"] },
    { key: "lane", label: "Lane", options: ["Toronto-Chicago", "Montreal-NYC", "Vancouver-Seattle"] },
    { key: "equipment", label: "Equipment", options: ["Dry Van", "Reefer", "Flatbed"] },
  ];

  const removeFilter = (id: string) => {
    setActiveFilters(activeFilters.filter((f) => f.id !== id));
  };

  return (
    <div className="mb-6">
      {/* Active filters as chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-sm font-medium" style={{ color: darkERPTheme.textMuted }}>
            Active filters:
          </span>
          {activeFilters.map((filter) => (
            <div
              key={filter.id}
              className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full"
              style={{
                backgroundColor: darkERPTheme.surface2,
                color: darkERPTheme.brandAccent,
                border: `1px solid ${darkERPTheme.border}`,
              }}
            >
              <span>
                {filter.label}: {filter.value}
              </span>
              <button onClick={() => removeFilter(filter.id)} className="hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setActiveFilters([])}
            className="text-sm underline hover:opacity-70"
            style={{ color: darkERPTheme.textMuted }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Add filter button */}
      <button
        onClick={() => setShowFilterMenu(!showFilterMenu)}
        className="px-3 py-1.5 text-sm font-medium rounded transition-colors hover:opacity-90"
        style={{
          color: darkERPTheme.textPrimary,
          border: `1px solid ${darkERPTheme.border}`,
          backgroundColor: darkERPTheme.surface2,
        }}
      >
        + Add filter
      </button>
    </div>
  );
}
