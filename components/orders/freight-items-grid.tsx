"use client";

import { useFieldArray, Control, UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from "react-hook-form";
import { Plus, X, AlertTriangle, Package, Scale, Ruler, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { EnterpriseOrderInput, FreightItemInput } from "@/lib/schemas/enterprise-order";

interface FreightItemsGridProps {
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

export function FreightItemsGrid({ 
  control, 
  register, 
  setValue, 
  watch, 
  errors, 
  className = "" 
}: FreightItemsGridProps) {
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
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex-none flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Freight Items</h3>
          <span className="text-xs text-zinc-500">({fields.length})</span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="subtle"
          onClick={addItem}
          className="h-7 px-2 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Item
        </Button>
      </div>

      {/* Totals Bar */}
      <div className="flex-none grid grid-cols-4 gap-2 mb-2 p-2 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-zinc-500" />
          <div>
            <div className="text-[10px] text-zinc-500 uppercase">Pieces</div>
            <div className="text-sm font-medium text-zinc-200">{totals.pieces}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-zinc-500" />
          <div>
            <div className="text-[10px] text-zinc-500 uppercase">Weight</div>
            <div className="text-sm font-medium text-zinc-200">{totals.weight.toLocaleString()} lbs</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5 text-zinc-500" />
          <div>
            <div className="text-[10px] text-zinc-500 uppercase">Cube</div>
            <div className="text-sm font-medium text-zinc-200">{totals.cube.toFixed(1)} ft³</div>
          </div>
        </div>
        {totals.hasHazmat && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <div>
              <div className="text-[10px] text-amber-500 uppercase">Hazmat</div>
              <div className="text-sm font-medium text-amber-400">Yes</div>
            </div>
          </div>
        )}
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-zinc-950 z-10">
            <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
              <th className="pb-2 pl-1 w-8">#</th>
              <th className="pb-2 min-w-[120px]">Commodity</th>
              <th className="pb-2 w-14">Qty</th>
              <th className="pb-2 w-14">Pcs</th>
              <th className="pb-2 w-20">Pkg</th>
              <th className="pb-2 w-20">Weight</th>
              <th className="pb-2 w-24">L×W×H</th>
              <th className="pb-2 w-16">Class</th>
              <th className="pb-2 w-10 text-center">HM</th>
              <th className="pb-2 w-10 text-center">ST</th>
              <th className="pb-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const itemErrors = errors.freightItems?.[index];
              const item = watchedItems?.[index];

              return (
                <tr 
                  key={field.id} 
                  className={`border-b border-zinc-800/50 hover:bg-zinc-900/30 ${
                    item?.isHazmat ? "bg-amber-500/5" : ""
                  }`}
                >
                  {/* Line Number */}
                  <td className="py-1.5 pl-1 text-zinc-500 font-mono">{index + 1}</td>
                  
                  {/* Commodity */}
                  <td className="py-1.5 pr-1">
                    <Input
                      {...register(`freightItems.${index}.commodity`)}
                      placeholder="Commodity *"
                      className={`h-7 text-xs bg-black/30 border-white/5 text-zinc-200 placeholder:text-zinc-600 ${
                        itemErrors?.commodity ? "border-rose-500/50" : ""
                      }`}
                    />
                  </td>
                  
                  {/* Quantity */}
                  <td className="py-1.5 pr-1">
                    <Input
                      type="number"
                      {...register(`freightItems.${index}.quantity`, { valueAsNumber: true })}
                      placeholder="1"
                      min={1}
                      className="h-7 text-xs bg-black/30 border-white/5 text-zinc-200 text-center"
                    />
                  </td>
                  
                  {/* Pieces */}
                  <td className="py-1.5 pr-1">
                    <Input
                      type="number"
                      {...register(`freightItems.${index}.pieces`, { valueAsNumber: true })}
                      placeholder="1"
                      min={1}
                      className="h-7 text-xs bg-black/30 border-white/5 text-zinc-200 text-center"
                    />
                  </td>
                  
                  {/* Packaging Type */}
                  <td className="py-1.5 pr-1">
                    <Select
                      {...register(`freightItems.${index}.packagingType`)}
                      className="h-7 text-xs bg-black/30 border-white/5 text-zinc-300"
                    >
                      {PACKAGING_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </Select>
                  </td>
                  
                  {/* Weight */}
                  <td className="py-1.5 pr-1">
                    <Input
                      type="number"
                      {...register(`freightItems.${index}.weightLbs`, { valueAsNumber: true })}
                      placeholder="lbs"
                      min={0}
                      className="h-7 text-xs bg-black/30 border-white/5 text-zinc-200"
                    />
                  </td>
                  
                  {/* Dimensions (L×W×H) */}
                  <td className="py-1.5 pr-1">
                    <div className="flex items-center gap-0.5">
                      <Input
                        type="number"
                        {...register(`freightItems.${index}.lengthIn`, { valueAsNumber: true })}
                        placeholder="L"
                        min={0}
                        className="h-7 w-7 text-xs bg-black/30 border-white/5 text-zinc-200 text-center px-1"
                      />
                      <span className="text-zinc-600">×</span>
                      <Input
                        type="number"
                        {...register(`freightItems.${index}.widthIn`, { valueAsNumber: true })}
                        placeholder="W"
                        min={0}
                        className="h-7 w-7 text-xs bg-black/30 border-white/5 text-zinc-200 text-center px-1"
                      />
                      <span className="text-zinc-600">×</span>
                      <Input
                        type="number"
                        {...register(`freightItems.${index}.heightIn`, { valueAsNumber: true })}
                        placeholder="H"
                        min={0}
                        className="h-7 w-7 text-xs bg-black/30 border-white/5 text-zinc-200 text-center px-1"
                      />
                    </div>
                  </td>
                  
                  {/* Freight Class */}
                  <td className="py-1.5 pr-1">
                    <Select
                      {...register(`freightItems.${index}.freightClass`)}
                      className="h-7 text-xs bg-black/30 border-white/5 text-zinc-300"
                    >
                      <option value="">—</option>
                      {FREIGHT_CLASSES.map(fc => (
                        <option key={fc} value={fc}>{fc}</option>
                      ))}
                    </Select>
                  </td>
                  
                  {/* Hazmat Toggle */}
                  <td className="py-1.5 pr-1 text-center">
                    <input
                      type="checkbox"
                      {...register(`freightItems.${index}.isHazmat`)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/30"
                    />
                  </td>
                  
                  {/* Stackable Toggle */}
                  <td className="py-1.5 pr-1 text-center">
                    <input
                      type="checkbox"
                      {...register(`freightItems.${index}.stackable`)}
                      defaultChecked={true}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/30"
                    />
                  </td>
                  
                  {/* Remove */}
                  <td className="py-1.5 text-center">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Hazmat Details (shown when any item has hazmat) */}
      {totals.hasHazmat && (
        <div className="flex-none mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-400">Hazmat Details Required</span>
          </div>
          <div className="space-y-2">
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
