"use client";

import { Search, X } from "lucide-react";
import { OrderStatus, OrderType, ProfitabilityFilter } from "../types";

interface FiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilters: OrderStatus[];
  onStatusFiltersChange: (values: OrderStatus[]) => void;
  typeFilter: OrderType | "all";
  onTypeFilterChange: (value: OrderType | "all") => void;
  profitabilityFilter: ProfitabilityFilter;
  onProfitabilityFilterChange: (value: ProfitabilityFilter) => void;
  aiAttentionOnly: boolean;
  onAiAttentionOnlyChange: (value: boolean) => void;
  onClearFilters: () => void;
}

export function FiltersBar({
  searchQuery,
  onSearchChange,
  statusFilters,
  onStatusFiltersChange,
  typeFilter,
  onTypeFilterChange,
  profitabilityFilter,
  onProfitabilityFilterChange,
  aiAttentionOnly,
  onAiAttentionOnlyChange,
  onClearFilters,
}: FiltersBarProps) {
  const statusOptions: OrderStatus[] = ["pending", "assigned", "in_progress", "completed", "canceled"];
  const typeOptions: Array<{ value: OrderType | "all"; label: string }> = [
    { value: "all", label: "All Types" },
    { value: "pickup", label: "Pickup" },
    { value: "delivery", label: "Delivery" },
    { value: "round_trip", label: "Round-Trip" },
  ];
  const profitabilityOptions: Array<{ value: ProfitabilityFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "profitable", label: "Profitable" },
    { value: "breakeven", label: "Break-even" },
    { value: "losing", label: "Losing" },
  ];

  const hasActiveFilters =
    searchQuery ||
    statusFilters.length > 0 ||
    typeFilter !== "all" ||
    profitabilityFilter !== "all" ||
    aiAttentionOnly;

  return (
    <div className="bg-[#121826] border border-[#1E2638] rounded-lg p-4">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C7484]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by Order ID, customer, origin/destination…"
            className="w-full h-9 pl-10 pr-3 bg-[#0B1020] border border-[#1E2638] rounded-md text-sm text-[#E6EAF2] placeholder:text-[#6C7484] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA]"
          />
        </div>

        {/* Status Multi-select */}
        <div className="relative">
          <select
            multiple
            value={statusFilters}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value as OrderStatus);
              onStatusFiltersChange(selected);
            }}
            className="hidden"
          />
          <div className="relative">
            <button
              type="button"
              className="h-9 px-3 bg-[#0B1020] border border-[#1E2638] rounded-md text-sm text-[#E6EAF2] hover:border-[#60A5FA]/40 focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA] flex items-center gap-2 min-w-[120px]"
            >
              <span className="text-[#9AA4B2] text-xs">Status:</span>
              <span>{statusFilters.length ? `${statusFilters.length} selected` : "All"}</span>
            </button>
            {/* Simplified for demo - in production use a proper dropdown component */}
          </div>
        </div>

        {/* Order Type */}
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value as OrderType | "all")}
          className="h-9 px-3 bg-[#0B1020] border border-[#1E2638] rounded-md text-sm text-[#E6EAF2] hover:border-[#60A5FA]/40 focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA] min-w-[140px]"
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#121826]">
              {opt.label}
            </option>
          ))}
        </select>

        {/* Profitability */}
        <select
          value={profitabilityFilter}
          onChange={(e) => onProfitabilityFilterChange(e.target.value as ProfitabilityFilter)}
          className="h-9 px-3 bg-[#0B1020] border border-[#1E2638] rounded-md text-sm text-[#E6EAF2] hover:border-[#60A5FA]/40 focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA] min-w-[140px]"
        >
          {profitabilityOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#121826]">
              {opt.label}
            </option>
          ))}
        </select>

        {/* AI Attention Filter */}
        <button
          type="button"
          onClick={() => onAiAttentionOnlyChange(!aiAttentionOnly)}
          className={`h-9 px-3 border rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            aiAttentionOnly
              ? "bg-[#60A5FA]/10 border-[#60A5FA] text-[#60A5FA]"
              : "bg-[#0B1020] border-[#1E2638] text-[#9AA4B2] hover:border-[#60A5FA]/40"
          }`}
        >
          <span>🤖</span>
          <span>Needs Attention</span>
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="h-9 px-3 text-sm text-[#9AA4B2] hover:text-[#E6EAF2] transition-colors flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
