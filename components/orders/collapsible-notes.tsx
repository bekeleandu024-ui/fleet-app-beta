"use client";

import { useState } from "react";
import { UseFormRegister } from "react-hook-form";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import type { EnterpriseOrderInput } from "@/lib/schemas/enterprise-order";

interface CollapsibleNotesProps {
  register: UseFormRegister<EnterpriseOrderInput>;
  className?: string;
  defaultExpanded?: boolean;
}

export function CollapsibleNotes({ register, className = "", defaultExpanded = false }: CollapsibleNotesProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`rounded-lg border border-zinc-800 bg-zinc-900/30 ${className}`}>
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800/30 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          )}
          <FileText className="w-4 h-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-200">Instructions & Notes</h3>
        </div>
        <span className="text-xs text-zinc-500">
          {isExpanded ? "collapse" : "expand"}
        </span>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium uppercase text-zinc-500 mb-1 block">
                Special Instructions
              </label>
              <textarea
                {...register("specialInstructions")}
                rows={3}
                placeholder="Customer/driver instructions..."
                className="w-full text-sm bg-black/30 border border-zinc-800 rounded-md px-3 py-2 text-zinc-300 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-zinc-500 mb-1 block">
                Internal Notes
              </label>
              <textarea
                {...register("internalNotes")}
                rows={3}
                placeholder="Internal notes (not shared)..."
                className="w-full text-sm bg-black/30 border border-zinc-800 rounded-md px-3 py-2 text-zinc-300 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
