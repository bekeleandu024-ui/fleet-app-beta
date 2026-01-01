"use client";

import { useState, KeyboardEvent } from "react";
import { useFieldArray, Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { X, Plus, Tag, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { EnterpriseOrderInput, OrderReferenceInput, ReferenceType } from "@/lib/schemas/enterprise-order";

interface ReferenceTagsProps {
  control: Control<EnterpriseOrderInput>;
  register: UseFormRegister<EnterpriseOrderInput>;
  errors: FieldErrors<EnterpriseOrderInput>;
  className?: string;
}

const REFERENCE_TYPES: { value: ReferenceType; label: string; icon?: string }[] = [
  { value: "PO", label: "PO #" },
  { value: "BOL", label: "BOL #" },
  { value: "SEAL", label: "Seal #" },
  { value: "PRO", label: "PRO #" },
  { value: "QUOTE", label: "Quote #" },
  { value: "SO", label: "SO #" },
  { value: "INV", label: "Invoice #" },
  { value: "REF", label: "Reference" },
  { value: "BOOKING", label: "Booking #" },
  { value: "CONTAINER", label: "Container #" },
  { value: "TRAILER", label: "Trailer #" },
  { value: "LOAD", label: "Load #" },
  { value: "ASN", label: "ASN #" },
  { value: "CUSTOMS", label: "Customs #" },
  { value: "PARS", label: "PARS #" },
];

const REFERENCE_COLORS: Record<ReferenceType, string> = {
  PO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  BOL: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  SEAL: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  PRO: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  QUOTE: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  SO: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  INV: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  REF: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  BOOKING: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  CONTAINER: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  TRAILER: "bg-lime-500/20 text-lime-400 border-lime-500/30",
  LOAD: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  ASN: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  CUSTOMS: "bg-red-500/20 text-red-400 border-red-500/30",
  PARS: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

export function ReferenceTags({ control, register, errors, className = "" }: ReferenceTagsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "references",
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<ReferenceType>("PO");
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (newValue.trim()) {
      const newRef: OrderReferenceInput = {
        id: `ref-${Date.now()}`,
        referenceType: newType,
        referenceValue: newValue.trim(),
        description: null,
      };
      append(newRef);
      setNewValue("");
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === "Escape") {
      setIsAdding(false);
      setNewValue("");
    }
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-200">References</h3>
          <span className="text-xs text-zinc-500">({fields.length})</span>
        </div>
      </div>

      {/* Tags Display */}
      <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg bg-zinc-900/50 border border-zinc-800">
        {fields.map((field, index) => {
          const colorClass = REFERENCE_COLORS[field.referenceType as ReferenceType] || REFERENCE_COLORS.REF;
          const typeLabel = REFERENCE_TYPES.find(t => t.value === field.referenceType)?.label || field.referenceType;
          
          return (
            <div
              key={field.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium ${colorClass}`}
            >
              <span className="opacity-70">{typeLabel}</span>
              <span>{field.referenceValue}</span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="ml-0.5 hover:opacity-70 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Add Button / Input */}
        {isAdding ? (
          <div className="inline-flex items-center gap-1">
            <Select
              value={newType}
              onChange={(e) => setNewType(e.target.value as ReferenceType)}
              className="h-6 w-20 text-xs bg-black/30 border-white/10 text-zinc-300"
            >
              {REFERENCE_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter value..."
              autoFocus
              className="h-6 w-24 text-xs bg-black/30 border-white/10 text-zinc-200"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="h-6 w-6 flex items-center justify-center text-emerald-400 hover:text-emerald-300"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { setIsAdding(false); setNewValue(""); }}
              className="h-6 w-6 flex items-center justify-center text-zinc-500 hover:text-zinc-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-dashed border-zinc-700 text-xs text-zinc-500 hover:text-zinc-400 hover:border-zinc-600 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      </div>

      {/* Common Reference Quick Add */}
      {fields.length === 0 && !isAdding && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-[10px] text-zinc-600 mr-1">Quick add:</span>
          {["PO", "BOL", "SEAL", "PRO"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => { setNewType(type as ReferenceType); setIsAdding(true); }}
              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-700 transition-colors"
            >
              + {type}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
