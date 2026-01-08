"use client";

import { useState } from "react";
import { useFieldArray, Control, UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";
import { Plus, ArrowRight, MapPin, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
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
  { value: "window", label: "Window" },
  { value: "firm", label: "Firm" },
  { value: "open", label: "Open" },
];

// Reusable stop form component
function StopForm({ 
  stopIdx, 
  stopNumber,
  stopType,
  register, 
  watch, 
  errors,
  onRemove,
  showRemove = false,
}: { 
  stopIdx: number;
  stopNumber: number;
  stopType: "pickup" | "delivery";
  register: UseFormRegister<EnterpriseOrderInput>;
  watch: UseFormWatch<EnterpriseOrderInput>;
  errors: FieldErrors<EnterpriseOrderInput>;
  onRemove?: () => void;
  showRemove?: boolean;
}) {
  const colorClass = stopType === "pickup" ? "emerald" : "rose";
  
  return (
    <div className="space-y-1.5 p-2 rounded bg-zinc-900/50 border border-zinc-800/50">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-medium text-${colorClass}-400/70 uppercase`}>
          {stopType} #{stopNumber}
        </span>
        {showRemove && onRemove && (
          <Button
            type="button"
            variant="plain"
            size="sm"
            onClick={onRemove}
            className="h-5 w-5 p-0 text-zinc-500 hover:text-rose-400"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
      <Input
        {...register(`stops.${stopIdx}.locationName`)}
        placeholder="Facility Name"
        className="h-8 text-sm bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
      />
      <div className="grid grid-cols-3 gap-1.5">
        <Input
          {...register(`stops.${stopIdx}.city`)}
          placeholder="City *"
          className={`h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 ${
            errors.stops?.[stopIdx]?.city ? "border-rose-500/50" : ""
          }`}
        />
        <Input
          {...register(`stops.${stopIdx}.state`)}
          placeholder="ST"
          className="h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 text-center"
        />
        <Input
          {...register(`stops.${stopIdx}.postalCode`)}
          placeholder="ZIP"
          className="h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 text-center"
        />
      </div>
      {/* Appointment Type */}
      <div className="flex gap-1.5 items-center">
        <Select
          {...register(`stops.${stopIdx}.appointmentType`)}
          className="w-[120px] h-7 text-xs bg-black/30 border-zinc-800 text-zinc-300"
        >
          {APPOINTMENT_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </Select>
        {watch(`stops.${stopIdx}.appointmentType`) === "firm" && (
          <Input
            type="datetime-local"
            {...register(`stops.${stopIdx}.appointmentStart`)}
            className="flex-1 h-7 text-xs bg-black/30 border-zinc-800 text-zinc-300"
          />
        )}
        {watch(`stops.${stopIdx}.appointmentType`) === "window" && (
          <>
            <Input
              type="datetime-local"
              {...register(`stops.${stopIdx}.appointmentStart`)}
              className="flex-1 h-7 text-xs bg-black/30 border-zinc-800 text-zinc-300"
            />
            <Input
              type="datetime-local"
              {...register(`stops.${stopIdx}.appointmentEnd`)}
              className="flex-1 h-7 text-xs bg-black/30 border-zinc-800 text-zinc-300"
            />
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Input
          {...register(`stops.${stopIdx}.contactName`)}
          placeholder="Contact Name"
          className="h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
        />
        <Input
          {...register(`stops.${stopIdx}.contactPhone`)}
          placeholder="Phone"
          className="h-7 text-xs bg-black/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
        />
      </div>
    </div>
  );
}

export function CompactRoute({ control, register, watch, errors, onAddStop, className = "" }: CompactRouteProps) {
  const { fields, remove } = useFieldArray({ control, name: "stops" });
  const watchedStops = watch("stops") || [];
  
  // Separate pickups and deliveries
  const pickups = watchedStops.map((stop, idx) => ({ stop, idx })).filter(s => s.stop.stopType === "pickup");
  const deliveries = watchedStops.map((stop, idx) => ({ stop, idx })).filter(s => s.stop.stopType === "delivery");
  const intermediates = watchedStops.map((stop, idx) => ({ stop, idx })).filter(s => s.stop.stopType === "intermediate");

  return (
    <div className={`rounded-lg border border-zinc-800 bg-zinc-900/30 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-200">Route</h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={() => onAddStop("pickup")}
            className="h-6 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
          >
            <Plus className="w-3 h-3 mr-1" />
            Pickup
          </Button>
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={() => onAddStop("delivery")}
            className="h-6 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
          >
            <Plus className="w-3 h-3 mr-1" />
            Delivery
          </Button>
        </div>
      </div>

      {/* Route Visualization */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Pickups Column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              <span className="text-xs font-medium text-emerald-400 uppercase">
                {pickups.length === 1 ? "Pickup" : `Pickups (${pickups.length})`}
              </span>
            </div>
            <div className="space-y-2">
              {pickups.map(({ stop, idx }, i) => (
                <StopForm
                  key={idx}
                  stopIdx={idx}
                  stopNumber={i + 1}
                  stopType="pickup"
                  register={register}
                  watch={watch}
                  errors={errors}
                  showRemove={pickups.length > 1}
                  onRemove={() => remove(idx)}
                />
              ))}
              {pickups.length === 0 && (
                <div className="text-xs text-zinc-500 italic p-2 border border-dashed border-zinc-800 rounded">
                  No pickup stops added
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-none flex items-center justify-center pt-8">
            <ArrowRight className="w-5 h-5 text-zinc-600" />
          </div>

          {/* Deliveries Column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
              <span className="text-xs font-medium text-rose-400 uppercase">
                {deliveries.length === 1 ? "Delivery" : `Deliveries (${deliveries.length})`}
              </span>
            </div>
            <div className="space-y-2">
              {deliveries.map(({ stop, idx }, i) => (
                <StopForm
                  key={idx}
                  stopIdx={idx}
                  stopNumber={i + 1}
                  stopType="delivery"
                  register={register}
                  watch={watch}
                  errors={errors}
                  showRemove={deliveries.length > 1}
                  onRemove={() => remove(idx)}
                />
              ))}
              {deliveries.length === 0 && (
                <div className="text-xs text-zinc-500 italic p-2 border border-dashed border-zinc-800 rounded">
                  No delivery stops added
                </div>
              )}
            </div>
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
                <div key={idx} className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-300 px-2 py-1 rounded">
                  <span>{stop.city || `Stop ${idx + 1}`}{stop.state ? `, ${stop.state}` : ''}</span>
                  <Button
                    type="button"
                    variant="plain"
                    size="sm"
                    onClick={() => remove(idx)}
                    className="h-4 w-4 p-0 ml-1 text-blue-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <div className="flex gap-4 text-[10px] text-zinc-500">
            <span>{pickups.length} pickup{pickups.length !== 1 ? 's' : ''}</span>
            <span>{deliveries.length} deliver{deliveries.length !== 1 ? 'ies' : 'y'}</span>
            {intermediates.length > 0 && (
              <span>{intermediates.length} intermediate stop{intermediates.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
