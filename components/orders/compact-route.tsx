"use client";

import { useFieldArray, Control, UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";
import { Plus, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { EnterpriseOrderInput, OrderStopInput } from "@/lib/schemas/enterprise-order";

interface CompactRouteProps {
  control: Control<EnterpriseOrderInput>;
  register: UseFormRegister<EnterpriseOrderInput>;
  watch: UseFormWatch<EnterpriseOrderInput>;
  errors: FieldErrors<EnterpriseOrderInput>;
  onAddStop: (type: "pickup" | "delivery" | "intermediate") => void;
  className?: string;
}

const APPOINTMENT_TYPES = [
  { value: "fcfs", label: "FCFS" },
  { value: "firm", label: "Firm" },
  { value: "open", label: "Open" },
];

export function CompactRoute({ control, register, watch, errors, onAddStop, className = "" }: CompactRouteProps) {
  const watchedStops = watch("stops") || [];
  
  // Separate pickups and deliveries
  const pickups = watchedStops.map((stop, idx) => ({ stop, idx })).filter(s => s.stop.stopType === "pickup");
  const deliveries = watchedStops.map((stop, idx) => ({ stop, idx })).filter(s => s.stop.stopType === "delivery");
  const intermediates = watchedStops.map((stop, idx) => ({ stop, idx })).filter(s => s.stop.stopType === "intermediate");

  // Get the primary pickup and delivery (first of each)
  const primaryPickup = pickups[0];
  const primaryDelivery = deliveries[deliveries.length - 1]; // Last delivery is final destination

  return (
    <div className={`rounded-lg border border-zinc-800 bg-zinc-900/30 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-200">Route</h3>
        <Button
          type="button"
          variant="subtle"
          size="sm"
          onClick={() => onAddStop("intermediate")}
          className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Stop
        </Button>
      </div>

      {/* Route Visualization */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Pickup */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              <span className="text-xs font-medium text-emerald-400 uppercase">Pickup</span>
              {pickups.length > 1 && (
                <span className="text-[10px] text-zinc-500">+{pickups.length - 1} more</span>
              )}
            </div>
            {primaryPickup && (
              <div className="space-y-1.5">
                <Input
                  {...register(`stops.${primaryPickup.idx}.locationName`)}
                  placeholder="Facility Name"
                  className="h-8 text-sm bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
                />
                <div className="grid grid-cols-3 gap-1.5">
                  <Input
                    {...register(`stops.${primaryPickup.idx}.city`)}
                    placeholder="City *"
                    className={`h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 ${
                      errors.stops?.[primaryPickup.idx]?.city ? "border-rose-500/50" : ""
                    }`}
                  />
                  <Input
                    {...register(`stops.${primaryPickup.idx}.state`)}
                    placeholder="ST"
                    className="h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 text-center"
                  />
                  <Input
                    {...register(`stops.${primaryPickup.idx}.postalCode`)}
                    placeholder="ZIP"
                    className="h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 text-center"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    {...register(`stops.${primaryPickup.idx}.contactName`)}
                    placeholder="Contact Name"
                    className="h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
                  />
                  <Input
                    {...register(`stops.${primaryPickup.idx}.contactPhone`)}
                    placeholder="Phone"
                    className="h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="flex-none flex items-center justify-center pt-8">
            <ArrowRight className="w-5 h-5 text-zinc-600" />
          </div>

          {/* Delivery */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
              <span className="text-xs font-medium text-rose-400 uppercase">Delivery</span>
              {deliveries.length > 1 && (
                <span className="text-[10px] text-zinc-500">+{deliveries.length - 1} more</span>
              )}
            </div>
            {primaryDelivery && (
              <div className="space-y-1.5">
                <Input
                  {...register(`stops.${primaryDelivery.idx}.locationName`)}
                  placeholder="Facility Name"
                  className="h-8 text-sm bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
                />
                <div className="grid grid-cols-3 gap-1.5">
                  <Input
                    {...register(`stops.${primaryDelivery.idx}.city`)}
                    placeholder="City *"
                    className={`h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 ${
                      errors.stops?.[primaryDelivery.idx]?.city ? "border-rose-500/50" : ""
                    }`}
                  />
                  <Input
                    {...register(`stops.${primaryDelivery.idx}.state`)}
                    placeholder="ST"
                    className="h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 text-center"
                  />
                  <Input
                    {...register(`stops.${primaryDelivery.idx}.postalCode`)}
                    placeholder="ZIP"
                    className="h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 text-center"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    {...register(`stops.${primaryDelivery.idx}.contactName`)}
                    placeholder="Contact Name"
                    className="h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
                  />
                  <Input
                    {...register(`stops.${primaryDelivery.idx}.contactPhone`)}
                    placeholder="Phone"
                    className="h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Intermediate stops (if any) */}
        {intermediates.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">Intermediate Stops ({intermediates.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {intermediates.map(({ stop, idx }) => (
                <div key={idx} className="text-xs bg-blue-500/10 text-blue-300 px-2 py-1 rounded">
                  {stop.city || `Stop ${idx + 1}`}{stop.state ? `, ${stop.state}` : ''}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multi-pickup/delivery indicators */}
        {(pickups.length > 1 || deliveries.length > 1) && (
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <div className="flex gap-4 text-[10px] text-zinc-500">
              {pickups.length > 1 && (
                <span>{pickups.length} pickups</span>
              )}
              {deliveries.length > 1 && (
                <span>{deliveries.length} deliveries</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
