"use client";

import { useFieldArray, Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { 
  Plus, X, GripVertical, MapPin, Clock, User, Phone, 
  ChevronUp, ChevronDown, AlertCircle, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { EnterpriseOrderInput, OrderStopInput } from "@/lib/schemas/enterprise-order";

interface StopsTimelineProps {
  control: Control<EnterpriseOrderInput>;
  register: UseFormRegister<EnterpriseOrderInput>;
  errors: FieldErrors<EnterpriseOrderInput>;
  className?: string;
}

const STOP_TYPE_CONFIG = {
  pickup: { 
    label: "Pickup", 
    color: "emerald", 
    bgClass: "bg-emerald-500/20",
    borderClass: "border-emerald-500/40",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-400"
  },
  delivery: { 
    label: "Delivery", 
    color: "rose", 
    bgClass: "bg-rose-500/20",
    borderClass: "border-rose-500/40",
    dotClass: "bg-rose-500",
    textClass: "text-rose-400"
  },
  intermediate: { 
    label: "Stop", 
    color: "blue", 
    bgClass: "bg-blue-500/20",
    borderClass: "border-blue-500/40",
    dotClass: "bg-blue-500",
    textClass: "text-blue-400"
  },
};

const APPOINTMENT_TYPES = [
  { value: "fcfs", label: "FCFS" },
  { value: "firm", label: "Firm Appt" },
  { value: "open", label: "Open" },
];

export function StopsTimeline({ control, register, errors, className = "" }: StopsTimelineProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "stops",
  });

  const addStop = (type: "pickup" | "delivery" | "intermediate") => {
    const newStop: OrderStopInput = {
      id: `stop-${Date.now()}`,
      stopSequence: fields.length,
      stopType: type,
      locationName: null,
      streetAddress: null,
      city: "",
      state: null,
      postalCode: null,
      country: "USA",
      latitude: null,
      longitude: null,
      appointmentType: "fcfs",
      appointmentStart: null,
      appointmentEnd: null,
      contactName: null,
      contactPhone: null,
      contactEmail: null,
      specialInstructions: null,
      driverInstructions: null,
    };
    append(newStop);
  };

  const moveStop = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < fields.length) {
      move(index, targetIndex);
    }
  };

  const canRemove = (index: number, type: string) => {
    // Always keep at least one pickup and one delivery
    const pickups = fields.filter(f => f.stopType === "pickup").length;
    const deliveries = fields.filter(f => f.stopType === "delivery").length;
    
    if (type === "pickup" && pickups <= 1) return false;
    if (type === "delivery" && deliveries <= 1) return false;
    return true;
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex-none flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Route Stops</h3>
          <span className="text-xs text-zinc-500">({fields.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="subtle"
            onClick={() => addStop("intermediate")}
            className="h-7 px-2 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20"
          >
            <Plus className="h-3 w-3 mr-1" />
            Stop
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 min-h-0 pr-1 space-y-0">
        {fields.map((field, index) => {
          const config = STOP_TYPE_CONFIG[field.stopType];
          const stopErrors = errors.stops?.[index];
          const isFirst = index === 0;
          const isLast = index === fields.length - 1;

          return (
            <div key={field.id} className="relative">
              {/* Connector Line */}
              {!isLast && (
                <div className="absolute left-[15px] top-[36px] bottom-0 w-[2px] bg-zinc-800" />
              )}

              {/* Stop Card */}
              <div className="flex gap-2 pb-1">
                {/* Timeline Dot & Controls */}
                <div className="flex-none flex flex-col items-center gap-1 pt-1">
                  {/* Sequence Controls */}
                  <button
                    type="button"
                    onClick={() => moveStop(index, "up")}
                    disabled={isFirst}
                    className="w-5 h-4 flex items-center justify-center text-zinc-600 hover:text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  
                  {/* Dot */}
                  <div className={`w-[10px] h-[10px] rounded-full ${config.dotClass} shadow-[0_0_8px_rgba(255,255,255,0.2)] z-10`} />
                  
                  <button
                    type="button"
                    onClick={() => moveStop(index, "down")}
                    disabled={isLast}
                    className="w-5 h-4 flex items-center justify-center text-zinc-600 hover:text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Stop Content */}
                <div className={`flex-1 rounded-lg border ${config.borderClass} ${config.bgClass} p-2 min-w-0`}>
                  {/* Top Row: Type Badge + Remove */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Select
                        {...register(`stops.${index}.stopType`)}
                        className={`h-7 px-2 text-xs font-medium ${config.bgClass} border-0 ${config.textClass} w-auto`}
                      >
                        <option value="pickup">Pickup</option>
                        <option value="intermediate">Stop</option>
                        <option value="delivery">Delivery</option>
                      </Select>
                      <span className="text-xs text-zinc-500">#{index + 1}</span>
                    </div>
                    
                    {canRemove(index, field.stopType) && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="w-5 h-5 flex items-center justify-center text-zinc-600 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Location Section */}
                  <div className="space-y-2">
                    {/* Facility Name */}
                    <Input
                      {...register(`stops.${index}.locationName`)}
                      placeholder="Facility / Location Name"
                      className="h-8 text-sm bg-black/30 border-white/5 text-zinc-200 placeholder:text-zinc-600"
                    />

                    {/* Address Row */}
                    <Input
                      {...register(`stops.${index}.streetAddress`)}
                      placeholder="Street Address"
                      className="h-8 text-sm bg-black/30 border-white/5 text-zinc-200 placeholder:text-zinc-600"
                    />

                    {/* City, State, Zip */}
                    <div className="flex gap-2">
                      <Input
                        {...register(`stops.${index}.city`)}
                        placeholder="City"
                        className={`flex-1 h-8 text-sm bg-black/30 border-white/5 text-zinc-200 placeholder:text-zinc-600 min-w-[80px] ${
                          stopErrors?.city ? "border-rose-500/50" : ""
                        }`}
                      />
                      <Input
                        {...register(`stops.${index}.state`)}
                        placeholder="ST"
                        className="w-[40px] h-8 text-sm bg-black/30 border-white/5 text-zinc-200 placeholder:text-zinc-600 text-center px-0"
                      />
                      <Input
                        {...register(`stops.${index}.postalCode`)}
                        placeholder="ZIP"
                        className="w-[60px] h-8 text-sm bg-black/30 border-white/5 text-zinc-200 placeholder:text-zinc-600 text-center px-0"
                      />
                    </div>
                  </div>

                  {/* Appointment Section */}
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1 mb-1.5">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Appointment</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Select
                        {...register(`stops.${index}.appointmentType`)}
                        className="h-8 text-sm bg-black/30 border-white/5 text-zinc-300"
                      >
                        {APPOINTMENT_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </Select>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                        <Input
                          type="datetime-local"
                          {...register(`stops.${index}.appointmentStart`)}
                          className="w-full h-8 text-xs bg-black/30 border-white/5 text-zinc-300 min-w-0"
                        />
                        <Input
                          type="datetime-local"
                          {...register(`stops.${index}.appointmentEnd`)}
                          className="w-full h-8 text-xs bg-black/30 border-white/5 text-zinc-300 min-w-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <details className="mt-2 pt-2 border-t border-white/5 group">
                    <summary className="flex items-center gap-1 mb-1.5 cursor-pointer list-none outline-none">
                      <User className="w-3 h-3 text-zinc-500" />
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Contact</span>
                      <ChevronDown className="w-3 h-3 text-zinc-500 ml-auto group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="space-y-2 pb-1">
                      <Input
                        {...register(`stops.${index}.contactName`)}
                        placeholder="Contact Name"
                        className="h-8 text-sm bg-black/30 border-white/5 text-zinc-200 placeholder:text-zinc-600"
                      />
                      <Input
                        {...register(`stops.${index}.contactPhone`)}
                        placeholder="Phone Number"
                        className="h-8 text-sm bg-black/30 border-white/5 text-zinc-200 placeholder:text-zinc-600"
                      />
                    </div>
                  </details>

                  {/* Instructions */}
                  <details className="mt-2 pt-2 border-t border-white/5 group">
                    <summary className="flex items-center gap-1 mb-1.5 cursor-pointer list-none outline-none">
                      <AlertCircle className="w-3 h-3 text-zinc-500" />
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Instructions</span>
                      <ChevronDown className="w-3 h-3 text-zinc-500 ml-auto group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="pb-1">
                      <textarea
                        {...register(`stops.${index}.specialInstructions`)}
                        placeholder="Instructions..."
                        rows={2}
                        className="w-full text-sm bg-black/30 border border-white/5 rounded-md px-2 py-1.5 text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                  </details>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Add Buttons */}
      <div className="flex-none pt-2 border-t border-zinc-800/50 mt-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="subtle"
            onClick={() => addStop("pickup")}
            className="flex-1 h-7 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
          >
            <Plus className="h-3 w-3 mr-1" />
            Pickup
          </Button>
          <Button
            type="button"
            size="sm"
            variant="subtle"
            onClick={() => addStop("delivery")}
            className="flex-1 h-7 text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
          >
            <Plus className="h-3 w-3 mr-1" />
            Delivery
          </Button>
        </div>
      </div>
    </div>
  );
}
