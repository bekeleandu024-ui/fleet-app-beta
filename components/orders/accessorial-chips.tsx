"use client";

import { useFieldArray, Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Plus, Check } from "lucide-react";
import type { EnterpriseOrderInput, OrderAccessorialInput, AccessorialCode } from "@/lib/schemas/enterprise-order";

interface AccessorialChipsProps {
  control: Control<EnterpriseOrderInput>;
  register: UseFormRegister<EnterpriseOrderInput>;
  errors: FieldErrors<EnterpriseOrderInput>;
  className?: string;
}

// Common/frequently used accessorials shown by default
const COMMON_ACCESSORIALS: { code: AccessorialCode; name: string; defaultPrice: number }[] = [
  { code: "LIFTGATE_DEL", name: "Liftgate", defaultPrice: 75 },
  { code: "RESIDENTIAL", name: "Residential", defaultPrice: 85 },
  { code: "APPOINTMENT", name: "Appointment", defaultPrice: 50 },
  { code: "INSIDE_DEL", name: "Inside Delivery", defaultPrice: 100 },
  { code: "LIMITED_ACCESS", name: "Limited Access", defaultPrice: 95 },
];

// All accessorials for the expanded view
const ALL_ACCESSORIALS: { code: AccessorialCode; name: string; defaultPrice: number; category: string }[] = [
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

export function AccessorialChips({ control, register, errors, className = "" }: AccessorialChipsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "accessorials",
  });

  const selectedCodes = fields.map(f => f.accessorialCode);

  const toggleAccessorial = (code: AccessorialCode) => {
    const existingIndex = fields.findIndex(f => f.accessorialCode === code);
    
    if (existingIndex >= 0) {
      // Remove it
      remove(existingIndex);
    } else {
      // Add it
      const acc = ALL_ACCESSORIALS.find(a => a.code === code);
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
    }
  };

  // Show only common accessorials
  const displayAccessorials = COMMON_ACCESSORIALS;

  // Calculate total
  const totalAccessorials = fields.reduce((sum, field) => {
    const acc = ALL_ACCESSORIALS.find(a => a.code === field.accessorialCode);
    const qty = field.quantity || 1;
    const price = field.unitPrice ?? acc?.defaultPrice ?? 0;
    return sum + (qty * price);
  }, 0);

  return (
    <div className={className}>
      {/* Chip Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {displayAccessorials.map((acc) => {
          const isSelected = selectedCodes.includes(acc.code);
          
          return (
            <button
              key={acc.code}
              type="button"
              onClick={() => toggleAccessorial(acc.code)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                  : "bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              {isSelected ? (
                <Check className="w-3 h-3" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
              {acc.name}
            </button>
          );
        })}

        {/* More button for additional accessorials */}
        <details className="relative group">
          <summary className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-800/30 text-zinc-500 border border-zinc-700/50 hover:text-zinc-400 cursor-pointer list-none">
            More...
          </summary>
          <div className="absolute top-full left-0 mt-1 z-50 w-64 p-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl">
            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
              {ALL_ACCESSORIALS.filter(a => !COMMON_ACCESSORIALS.find(c => c.code === a.code)).map((acc) => {
                const isSelected = selectedCodes.includes(acc.code);
                
                return (
                  <button
                    key={acc.code}
                    type="button"
                    onClick={() => toggleAccessorial(acc.code)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-colors text-left ${
                      isSelected
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-2.5 h-2.5 flex-none" />
                    ) : (
                      <Plus className="w-2.5 h-2.5 flex-none" />
                    )}
                    <span className="truncate">{acc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </details>
      </div>

      {/* Selected accessorials summary with pricing */}
      {fields.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {fields.map((field, index) => {
            const acc = ALL_ACCESSORIALS.find(a => a.code === field.accessorialCode);
            if (!acc) return null;
            
            return (
              <div
                key={field.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/50 text-[10px] text-zinc-400"
              >
                <span>{acc.name}</span>
                <span className="text-zinc-500">·</span>
                <span className="text-emerald-400">${field.unitPrice || acc.defaultPrice}</span>
              </div>
            );
          })}
          <div className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] font-medium text-emerald-400">
            Total: ${totalAccessorials}
          </div>
        </div>
      )}
    </div>
  );
}
