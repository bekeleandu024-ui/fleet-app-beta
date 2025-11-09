"use client";

import { useState } from "react";
import { X } from "lucide-react";

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
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          {activeFilters.map((filter) => (
            <div
              key={filter.id}
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200"
            >
              <span>
                {filter.label}: {filter.value}
              </span>
              <button
                onClick={() => removeFilter(filter.id)}
                className="hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setActiveFilters([])}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Add filter button */}
      <button
        onClick={() => setShowFilterMenu(!showFilterMenu)}
        className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
      >
        + Add filter
      </button>
    </div>
  );
}
