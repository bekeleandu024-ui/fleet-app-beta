"use client";

import { Control, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Truck, Package, Zap } from "lucide-react";
import type { EnterpriseOrderInput } from "@/lib/schemas/enterprise-order";

interface ServiceTypeCardsProps {
  control: Control<EnterpriseOrderInput>;
  watch: UseFormWatch<EnterpriseOrderInput>;
  setValue: UseFormSetValue<EnterpriseOrderInput>;
  className?: string;
}

const SERVICE_TYPES = [
  {
    value: "standard",
    label: "Standard",
    description: "Can consolidate with other orders",
    icon: Package,
    isDirect: false,
  },
  {
    value: "direct",
    label: "Direct",
    description: "Dedicated truck, no consolidation",
    icon: Truck,
    isDirect: true,
  },
  {
    value: "expedited",
    label: "Expedited",
    description: "Priority handling & routing",
    icon: Zap,
    isDirect: true, // Expedited is always direct
  },
];

export function ServiceTypeCards({ watch, setValue, className = "" }: ServiceTypeCardsProps) {
  const isDirect = watch("isDirect");
  const priority = watch("priority");
  
  // Determine current service type from form state
  const currentServiceType = priority === "critical" || priority === "high" 
    ? "expedited" 
    : isDirect 
      ? "direct" 
      : "standard";

  const handleSelect = (serviceType: string) => {
    const service = SERVICE_TYPES.find(s => s.value === serviceType);
    if (!service) return;

    // Set isDirect based on service type
    setValue("isDirect", service.isDirect);
    
    // Set priority for expedited
    if (serviceType === "expedited") {
      setValue("priority", "high");
    } else if (currentServiceType === "expedited" && serviceType !== "expedited") {
      // If switching from expedited, reset priority to normal
      setValue("priority", "normal");
    }
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-2">
        {SERVICE_TYPES.map((service) => {
          const isSelected = currentServiceType === service.value;
          const Icon = service.icon;

          return (
            <button
              key={service.value}
              type="button"
              onClick={() => handleSelect(service.value)}
              className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50"
              }`}
            >
              {/* Radio indicator */}
              <div className={`absolute top-2 left-2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                isSelected ? "border-blue-500" : "border-zinc-600"
              }`}>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>

              <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? "text-blue-400" : "text-zinc-500"}`} />
              <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-zinc-300"}`}>
                {service.label}
              </span>
              <span className="text-[10px] text-zinc-500 text-center mt-0.5 leading-tight">
                {service.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
