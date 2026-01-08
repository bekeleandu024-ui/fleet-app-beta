"use client";

import { useFieldArray, Control, UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from "react-hook-form";
import { Plus, X, AlertTriangle, Package, Scale, Ruler, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { EnterpriseOrderInput, FreightItemInput } from "@/lib/schemas/enterprise-order";

interface CompactFreightRowProps {
  control: Control<EnterpriseOrderInput>;
  register: UseFormRegister<EnterpriseOrderInput>;
  setValue: UseFormSetValue<EnterpriseOrderInput>;
  watch: UseFormWatch<EnterpriseOrderInput>;
  errors: FieldErrors<EnterpriseOrderInput>;
  className?: string;
}

const PACKAGING_TYPES = [
  { value: "pallet", label: "Pallet" },
  { value: "crate", label: "Crate" },
  { value: "drum", label: "Drum" },
  { value: "bag", label: "Bag" },
  { value: "bundle", label: "Bundle" },
  { value: "roll", label: "Roll" },
  { value: "box", label: "Box" },
  { value: "carton", label: "Carton" },
  { value: "loose", label: "Loose" },
  { value: "container", label: "Container" },
];

const FREIGHT_CLASSES = [
  "50", "55", "60", "65", "70", "77.5", "85", "92.5", "100", 
  "110", "125", "150", "175", "200", "250", "300", "400", "500"
];

export function CompactFreightRow({ 
  control, 
  register, 
  setValue, 
  watch, 
  errors, 
  className = "" 
}: CompactFreightRowProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "freightItems",
  });

  const watchedItems = watch("freightItems");

  const addItem = () => {
    const newItem: FreightItemInput = {
      id: `item-${Date.now()}`,
      lineNumber: fields.length + 1,
      commodity: "",
      description: null,
      quantity: 1,
      pieces: 1,
      packagingType: "pallet",
      weightLbs: null,
      lengthIn: null,
      widthIn: null,
      heightIn: null,
      cubicFeet: null,
      freightClass: null,
      nmfcCode: null,
      isHazmat: false,
      hazmatClass: null,
      hazmatUnNumber: null,
      hazmatPackingGroup: null,
      hazmatProperName: null,
      stackable: true,
      temperatureControlled: false,
      tempMinF: null,
      tempMaxF: null,
      declaredValue: null,
      currency: "USD",
    };
    append(newItem);
  };

  // Parse dimension string like "48×40×48" or "48x40x48"
  const parseDimensions = (dimString: string, index: number) => {
    const cleaned = dimString.replace(/\s/g, '').replace(/[xX×]/g, '×');
    const parts = cleaned.split('×');
    if (parts.length === 3) {
      const l = parseInt(parts[0]) || null;
      const w = parseInt(parts[1]) || null;
      const h = parseInt(parts[2]) || null;
      setValue(`freightItems.${index}.lengthIn`, l);
      setValue(`freightItems.${index}.widthIn`, w);
      setValue(`freightItems.${index}.heightIn`, h);
    }
  };

  // Format dimensions for display
  const formatDimensions = (item: FreightItemInput | undefined) => {
    if (!item) return "";
    const l = item.lengthIn;
    const w = item.widthIn;
    const h = item.heightIn;
    if (l && w && h) return `${l}×${w}×${h}`;
    if (l || w || h) return `${l || ''}×${w || ''}×${h || ''}`;
    return "";
  };

  // Calculate totals
  const totals = {
    pieces: watchedItems?.reduce((sum, item) => sum + (item?.pieces || 0) * (item?.quantity || 1), 0) || 0,
    weight: watchedItems?.reduce((sum, item) => sum + (item?.weightLbs || 0) * (item?.quantity || 1), 0) || 0,
    cube: watchedItems?.reduce((sum, item) => {
      if (item?.lengthIn && item?.widthIn && item?.heightIn) {
        const cubeFt = (item.lengthIn * item.widthIn * item.heightIn) / 1728 * (item.quantity || 1);
        return sum + cubeFt;
      }
      return sum + (item?.cubicFeet || 0) * (item?.quantity || 1);
    }, 0) || 0,
    hasHazmat: watchedItems?.some(item => item?.isHazmat) || false,
  };

  return (
    <div className={`rounded-lg border border-zinc-800 bg-zinc-900/30 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-200">Freight Items</h3>
        <Button
          type="button"
          size="sm"
          variant="subtle"
          onClick={addItem}
          className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Item
        </Button>
      </div>

      {/* Items Table */}
      <div className="p-2 space-y-1.5">
        {fields.map((field, index) => {
          const itemErrors = errors.freightItems?.[index];
          const item = watchedItems?.[index];
          const isHazmat = item?.isHazmat;

          return (
            <div 
              key={field.id} 
              className={`flex items-center gap-2 p-2 rounded-md bg-black/20 border transition-colors ${
                isHazmat ? "border-amber-500/30" : "border-zinc-800/50"
              }`}
            >
              {/* Commodity Description - flexible width */}
              <div className="flex-1 min-w-0">
                <Input
                  {...register(`freightItems.${index}.commodity`)}
                  placeholder="Commodity Description *"
                  className={`h-8 text-sm bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 ${
                    itemErrors?.commodity ? "border-rose-500/50" : ""
                  }`}
                />
              </div>

              {/* Qty - narrow */}
              <div className="w-16 flex-none">
                <Input
                  type="number"
                  {...register(`freightItems.${index}.quantity`, { valueAsNumber: true })}
                  placeholder="Qty"
                  min={1}
                  className="h-8 text-xs bg-zinc-900/50 border-zinc-800 text-zinc-200 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Pieces - narrow */}
              <div className="w-16 flex-none">
                <Input
                  type="number"
                  {...register(`freightItems.${index}.pieces`, { valueAsNumber: true })}
                  placeholder="Pcs"
                  min={1}
                  className="h-8 text-xs bg-zinc-900/50 border-zinc-800 text-zinc-200 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Type - dropdown */}
              <div className="w-24 flex-none">
                <Select
                  {...register(`freightItems.${index}.packagingType`)}
                  className="h-8 text-xs bg-zinc-900/50 border-zinc-800 text-zinc-300"
                >
                  {PACKAGING_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </Select>
              </div>

              {/* Weight with lb suffix */}
              <div className="w-24 flex-none relative">
                <Input
                  type="number"
                  {...register(`freightItems.${index}.weightLbs`, { valueAsNumber: true })}
                  placeholder="Weight"
                  min={0}
                  className="h-8 text-xs bg-zinc-900/50 border-zinc-800 text-zinc-200 pr-6 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 pointer-events-none">lb</span>
              </div>

              {/* Consolidated Dimensions L×W×H */}
              <div className="w-28 flex-none">
                <Input
                  type="text"
                  placeholder="L×W×H"
                  defaultValue={formatDimensions(item)}
                  onChange={(e) => parseDimensions(e.target.value, index)}
                  className="h-8 text-xs bg-zinc-900/50 border-zinc-800 text-zinc-200 text-center font-mono"
                />
              </div>

              {/* Class - narrow dropdown */}
              <div className="w-16 flex-none">
                <Select
                  {...register(`freightItems.${index}.freightClass`)}
                  className="h-8 text-xs bg-zinc-900/50 border-zinc-800 text-zinc-300"
                >
                  <option value="">—</option>
                  {FREIGHT_CLASSES.map(fc => (
                    <option key={fc} value={fc}>{fc}</option>
                  ))}
                </Select>
              </div>

              {/* HM/STK toggles inline */}
              <div className="flex items-center gap-2 flex-none">
                <label className="flex items-center gap-1 cursor-pointer group/hazmat">
                  <input
                    type="checkbox"
                    {...register(`freightItems.${index}.isHazmat`)}
                    className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/30 cursor-pointer"
                  />
                  <span className="text-[10px] font-medium text-zinc-500 group-hover/hazmat:text-amber-400">HM</span>
                </label>
                
                <label className="flex items-center gap-1 cursor-pointer group/stack">
                  <input
                    type="checkbox"
                    {...register(`freightItems.${index}.stackable`)}
                    defaultChecked={true}
                    className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/30 cursor-pointer"
                  />
                  <span className="text-[10px] font-medium text-zinc-500 group-hover/stack:text-blue-400">STK</span>
                </label>
              </div>

              {/* Remove button */}
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="flex-none w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-rose-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Hazmat Details (shown when any item has hazmat) */}
      {totals.hasHazmat && (
        <div className="mx-2 mb-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-amber-400">Hazmat Details Required</span>
          </div>
          <div className="space-y-1.5">
            {watchedItems?.map((item, index) => {
              if (!item?.isHazmat) return null;
              return (
                <div key={index} className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase">Class</label>
                    <Input
                      {...register(`freightItems.${index}.hazmatClass`)}
                      placeholder="e.g., 3"
                      className="h-7 text-xs bg-black/30 border-amber-500/20 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase">UN Number</label>
                    <Input
                      {...register(`freightItems.${index}.hazmatUnNumber`)}
                      placeholder="e.g., UN1203"
                      className="h-7 text-xs bg-black/30 border-amber-500/20 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase">Packing Group</label>
                    <Select
                      {...register(`freightItems.${index}.hazmatPackingGroup`)}
                      className="h-7 text-xs bg-black/30 border-amber-500/20 text-zinc-300"
                    >
                      <option value="">—</option>
                      <option value="I">I</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase">Proper Name</label>
                    <Input
                      {...register(`freightItems.${index}.hazmatProperName`)}
                      placeholder="Shipping name"
                      className="h-7 text-xs bg-black/30 border-amber-500/20 text-zinc-200"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
