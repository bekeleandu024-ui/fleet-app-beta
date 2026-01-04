"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  X, DollarSign, Plus, Trash2, CheckCircle2, 
  AlertTriangle, FileText, Clock, Truck 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface FinalizeLoadModalProps {
  orderId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Accessorial {
  type: string;
  description: string;
  quantity: number;
  unit_price: number;
}

const ACCESSORIAL_TYPES = [
  { value: "DETENTION_PU", label: "Detention (Pickup)", defaultRate: 75 },
  { value: "DETENTION_DEL", label: "Detention (Delivery)", defaultRate: 75 },
  { value: "LUMPER", label: "Lumper Fee", defaultRate: 0 },
  { value: "LAYOVER", label: "Layover", defaultRate: 250 },
  { value: "TONU", label: "Truck Order Not Used", defaultRate: 250 },
  { value: "DRIVER_ASSIST", label: "Driver Assist", defaultRate: 50 },
  { value: "REDELIVERY", label: "Redelivery", defaultRate: 150 },
  { value: "STOP_CHARGE", label: "Extra Stop", defaultRate: 50 },
  { value: "FUEL_SURCHARGE", label: "Fuel Surcharge", defaultRate: 0 },
  { value: "ADJUSTMENT", label: "Rate Adjustment", defaultRate: 0 },
  { value: "OTHER", label: "Other", defaultRate: 0 },
];

export function FinalizeLoadModal({ orderId, onClose, onSuccess }: FinalizeLoadModalProps) {
  const queryClient = useQueryClient();
  
  // Fetch current billing status
  const { data, isLoading } = useQuery({
    queryKey: ["order-billing", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/finalize`);
      if (!res.ok) throw new Error("Failed to load billing data");
      return res.json();
    },
  });
  
  const [accessorials, setAccessorials] = useState<Accessorial[]>([]);
  const [billingNotes, setBillingNotes] = useState("");
  
  // Initialize from existing data
  useEffect(() => {
    if (data?.data?.accessorials?.length > 0) {
      setAccessorials(data.data.accessorials.map((a: any) => ({
        type: a.accessorial_type,
        description: a.description || "",
        quantity: parseFloat(a.quantity) || 1,
        unit_price: parseFloat(a.unit_price) || 0,
      })));
    }
    if (data?.data?.billing_notes) {
      setBillingNotes(data.data.billing_notes);
    }
  }, [data]);
  
  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: async (payload: { accessorials: Accessorial[]; billing_notes: string }) => {
      const res = await fetch(`/api/orders/${orderId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessorials: payload.accessorials.map(a => ({
            type: a.type,
            description: a.description,
            quantity: a.quantity,
            unit_price: a.unit_price,
          })),
          billing_notes: payload.billing_notes,
          finalized_by: "system", // TODO: Use actual user
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to finalize");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-billing", orderId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      onSuccess?.();
      onClose();
    },
  });
  
  const addAccessorial = () => {
    setAccessorials([...accessorials, {
      type: "DETENTION_DEL",
      description: "",
      quantity: 1,
      unit_price: 75,
    }]);
  };
  
  const removeAccessorial = (index: number) => {
    setAccessorials(accessorials.filter((_, i) => i !== index));
  };
  
  const updateAccessorial = (index: number, field: keyof Accessorial, value: any) => {
    const updated = [...accessorials];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill default rate when type changes
    if (field === "type") {
      const preset = ACCESSORIAL_TYPES.find(t => t.value === value);
      if (preset && preset.defaultRate > 0) {
        updated[index].unit_price = preset.defaultRate;
      }
    }
    
    setAccessorials(updated);
  };
  
  const quotedRate = data?.data?.quoted_rate || 0;
  const accessorialTotal = accessorials.reduce(
    (sum, a) => sum + (a.quantity * a.unit_price), 
    0
  );
  const finalAmount = quotedRate + accessorialTotal;
  const variance = accessorialTotal;
  const variancePct = quotedRate > 0 ? ((variance / quotedRate) * 100).toFixed(1) : 0;
  
  const isAlreadyFinalized = data?.data?.billing_status === "AUDITED" || 
                             data?.data?.billing_status === "INVOICED" ||
                             data?.data?.billing_status === "PAID";
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="rounded-lg bg-zinc-900 p-8">
          <div className="text-zinc-400">Loading billing data...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Finalize Billing</h2>
            <p className="text-sm text-zinc-500">
              Order {data?.data?.order_number} • {data?.data?.customer_name || "Unknown Customer"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Already Finalized Warning */}
        {isAlreadyFinalized && (
          <div className="mx-5 mt-4 rounded-lg border border-amber-800/30 bg-amber-950/20 p-3">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                This order has already been finalized ({data?.data?.billing_status})
              </span>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {/* Route Info */}
          <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-zinc-400">
                <Truck className="h-4 w-4" />
                <span>{data?.data?.pickup_location}</span>
              </div>
              <span className="text-zinc-600">→</span>
              <span className="text-zinc-400">{data?.data?.dropoff_location}</span>
            </div>
          </div>
          
          {/* Quoted Rate */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-zinc-800 bg-black/30 p-4">
              <div className="text-xs font-medium uppercase text-zinc-500 mb-1">Quoted Rate</div>
              <div className="text-2xl font-bold text-white">
                ${quotedRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Stage 1 (Estimate)</div>
            </div>
            <div className="rounded-lg border border-emerald-800/30 bg-emerald-950/20 p-4">
              <div className="text-xs font-medium uppercase text-emerald-500 mb-1">Final Amount</div>
              <div className="text-2xl font-bold text-emerald-400">
                ${finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {variance >= 0 ? "+" : ""}{variancePct}% variance
              </div>
            </div>
          </div>
          
          {/* Accessorials */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-200">Accessorials</h3>
              {!isAlreadyFinalized && (
                <Button
                  type="button"
                  size="sm"
                  variant="subtle"
                  onClick={addAccessorial}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Charge
                </Button>
              )}
            </div>
            
            {accessorials.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-800 p-4 text-center text-sm text-zinc-500">
                No accessorials added. Click "Add Charge" to add detention, lumper fees, etc.
              </div>
            ) : (
              <div className="space-y-2">
                {accessorials.map((acc, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-black/30 p-2"
                  >
                    <Select
                      value={acc.type}
                      onChange={(e) => updateAccessorial(idx, "type", e.target.value)}
                      className="h-8 text-xs bg-zinc-900 border-zinc-700 w-40"
                      disabled={isAlreadyFinalized}
                    >
                      {ACCESSORIAL_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </Select>
                    
                    <Input
                      type="text"
                      placeholder="Description"
                      value={acc.description}
                      onChange={(e) => updateAccessorial(idx, "description", e.target.value)}
                      className="h-8 text-xs bg-zinc-900 border-zinc-700 flex-1"
                      disabled={isAlreadyFinalized}
                    />
                    
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={acc.quantity}
                        onChange={(e) => updateAccessorial(idx, "quantity", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-zinc-900 border-zinc-700 w-16 text-center"
                        disabled={isAlreadyFinalized}
                      />
                      <span className="text-xs text-zinc-500">×</span>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={acc.unit_price}
                          onChange={(e) => updateAccessorial(idx, "unit_price", parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs bg-zinc-900 border-zinc-700 w-20 pl-5"
                          disabled={isAlreadyFinalized}
                        />
                      </div>
                    </div>
                    
                    <div className="w-20 text-right text-sm font-medium text-zinc-300">
                      ${(acc.quantity * acc.unit_price).toFixed(2)}
                    </div>
                    
                    {!isAlreadyFinalized && (
                      <button
                        type="button"
                        onClick={() => removeAccessorial(idx)}
                        className="p-1 text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                {/* Accessorial Total */}
                <div className="flex items-center justify-end gap-4 pt-2 border-t border-zinc-800">
                  <span className="text-sm text-zinc-500">Accessorial Total:</span>
                  <span className="text-sm font-bold text-white">
                    ${accessorialTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Billing Notes */}
          <div className="mb-4">
            <label className="text-xs font-medium uppercase text-zinc-500 mb-1 block">
              Billing Notes
            </label>
            <textarea
              value={billingNotes}
              onChange={(e) => setBillingNotes(e.target.value)}
              placeholder="POD verified, charges confirmed..."
              className="w-full h-20 rounded-lg border border-zinc-800 bg-black/30 px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 resize-none"
              disabled={isAlreadyFinalized}
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-4">
          <div className="text-sm text-zinc-500">
            <FileText className="h-4 w-4 inline mr-1" />
            Status: <span className="text-zinc-400">{data?.data?.billing_status || "PENDING"}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="subtle"
              onClick={onClose}
            >
              Cancel
            </Button>
            
            {!isAlreadyFinalized && (
              <Button
                variant="primary"
                onClick={() => finalizeMutation.mutate({ accessorials, billing_notes: billingNotes })}
                disabled={finalizeMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {finalizeMutation.isPending ? "Finalizing..." : "Finalize Billing"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
