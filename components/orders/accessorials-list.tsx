"use client";

import { useFieldArray, Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Plus, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { EnterpriseOrderInput, OrderAccessorialInput, AccessorialCode } from "@/lib/schemas/enterprise-order";

interface AccessorialsListProps {
  control: Control<EnterpriseOrderInput>;
  register: UseFormRegister<EnterpriseOrderInput>;
  errors: FieldErrors<EnterpriseOrderInput>;
  className?: string;
}

const ACCESSORIALS: { code: AccessorialCode; name: string; category: string; defaultPrice: number }[] = [
  { code: "LIFTGATE_PU", name: "Liftgate - Pickup", category: "Equipment", defaultPrice: 75 },
  { code: "LIFTGATE_DEL", name: "Liftgate - Delivery", category: "Equipment", defaultPrice: 75 },
  { code: "INSIDE_PU", name: "Inside Pickup", category: "Service", defaultPrice: 100 },
  { code: "INSIDE_DEL", name: "Inside Delivery", category: "Service", defaultPrice: 100 },
  { code: "RESIDENTIAL", name: "Residential", category: "Service", defaultPrice: 85 },
  { code: "LIMITED_ACCESS", name: "Limited Access", category: "Service", defaultPrice: 95 },
  { code: "APPOINTMENT", name: "Appointment", category: "Service", defaultPrice: 50 },
  { code: "DETENTION_PU", name: "Detention - Pickup", category: "Time", defaultPrice: 75 },
  { code: "DETENTION_DEL", name: "Detention - Delivery", category: "Time", defaultPrice: 75 },
  { code: "LAYOVER", name: "Layover", category: "Time", defaultPrice: 350 },
  { code: "TARP", name: "Tarping", category: "Equipment", defaultPrice: 125 },
  { code: "TEAM", name: "Team Service", category: "Service", defaultPrice: 0 },
  { code: "HAZMAT", name: "Hazmat Handling", category: "Handling", defaultPrice: 250 },
  { code: "REEFER_PROTECTION", name: "Protect From Freeze", category: "Temperature", defaultPrice: 150 },
  { code: "TEMP_CONTROLLED", name: "Temperature Control", category: "Temperature", defaultPrice: 200 },
  { code: "SORT_SEGREGATE", name: "Sort & Segregate", category: "Handling", defaultPrice: 125 },
  { code: "SCALE_TICKET", name: "Scale Ticket", category: "Documentation", defaultPrice: 25 },
  { code: "EXTRA_STOP", name: "Extra Stop", category: "Routing", defaultPrice: 150 },
  { code: "BORDER_CROSSING", name: "Border Crossing", category: "Routing", defaultPrice: 175 },
  { code: "BLIND_SHIPMENT", name: "Blind Shipment", category: "Documentation", defaultPrice: 50 },
];

const CATEGORY_COLORS: Record<string, string> = {
  Equipment: "text-blue-400",
  Service: "text-emerald-400",
  Time: "text-amber-400",
  Handling: "text-purple-400",
  Temperature: "text-cyan-400",
  Documentation: "text-zinc-400",
  Routing: "text-rose-400",
};

export function AccessorialsList({ control, register, errors, className = "" }: AccessorialsListProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "accessorials",
  });

  const usedCodes = fields.map(f => f.accessorialCode);
  const availableAccessorials = ACCESSORIALS.filter(a => !usedCodes.includes(a.code));

  const addAccessorial = (code: AccessorialCode) => {
    const acc = ACCESSORIALS.find(a => a.code === code);
    if (acc) {
      const newAcc: OrderAccessorialInput = {
        id: `acc-${Date.now()}`,
        accessorialCode: code,
        quantity: 1,
        unitPrice: acc.defaultPrice,
        notes: null,
      };
      append(newAcc);
    }
  };

  const totalAccessorials = fields.reduce((sum, field, index) => {
    const acc = ACCESSORIALS.find(a => a.code === field.accessorialCode);
    const qty = field.quantity || 1;
    const price = field.unitPrice ?? acc?.defaultPrice ?? 0;
    return sum + (qty * price);
  }, 0);

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Accessorials</h3>
          {fields.length > 0 && (
            <span className="text-xs text-emerald-400">${totalAccessorials.toFixed(0)}</span>
          )}
        </div>
      </div>

      {/* Selected Accessorials */}
      {fields.length > 0 && (
        <div className="space-y-1 mb-2">
          {fields.map((field, index) => {
            const acc = ACCESSORIALS.find(a => a.code === field.accessorialCode);
            const categoryColor = CATEGORY_COLORS[acc?.category || ""] || "text-zinc-400";
            
            return (
              <div 
                key={field.id} 
                className="flex items-center gap-2 p-1.5 rounded bg-zinc-900/50 border border-zinc-800"
              >
                <span className={`text-[10px] uppercase w-14 ${categoryColor}`}>
                  {acc?.category?.slice(0, 5)}
                </span>
                <span className="flex-1 text-xs text-zinc-300">{acc?.name}</span>
                <Input
                  type="number"
                  {...register(`accessorials.${index}.quantity`, { valueAsNumber: true })}
                  min={1}
                  className="w-12 h-6 text-xs text-center bg-black/30 border-white/5"
                />
                <span className="text-[10px] text-zinc-500">×</span>
                <Input
                  type="number"
                  {...register(`accessorials.${index}.unitPrice`, { valueAsNumber: true })}
                  min={0}
                  step={0.01}
                  className="w-16 h-6 text-xs bg-black/30 border-white/5"
                  placeholder="$"
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="w-5 h-5 flex items-center justify-center text-zinc-600 hover:text-rose-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add Dropdown */}
      {availableAccessorials.length > 0 && (
        <Select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              addAccessorial(e.target.value as AccessorialCode);
            }
          }}
          className="h-7 text-xs bg-black/30 border-zinc-800 text-zinc-400"
        >
          <option value="">+ Add accessorial...</option>
          {Object.entries(
            availableAccessorials.reduce((groups, acc) => {
              const cat = acc.category;
              if (!groups[cat]) groups[cat] = [];
              groups[cat].push(acc);
              return groups;
            }, {} as Record<string, typeof ACCESSORIALS>)
          ).map(([category, items]) => (
            <optgroup key={category} label={category}>
              {items.map(acc => (
                <option key={acc.code} value={acc.code}>
                  {acc.name} (${acc.defaultPrice})
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      )}

      {/* Common Quick Add */}
      {fields.length === 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-[10px] text-zinc-600 mr-1">Common:</span>
          {["LIFTGATE_DEL", "RESIDENTIAL", "APPOINTMENT", "INSIDE_DEL"].map((code) => {
            const acc = ACCESSORIALS.find(a => a.code === code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => addAccessorial(code as AccessorialCode)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-700 transition-colors"
              >
                + {acc?.name.split(" - ")[0] || code}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
