"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, Send, Sparkles, Upload, AlertTriangle, 
  Building2, Truck, CreditCard, FileText, Settings2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Chip } from "@/components/ui/chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { StopsTimeline } from "@/components/orders/stops-timeline";
import { FreightItemsGrid } from "@/components/orders/freight-items-grid";
import { ReferenceTags } from "@/components/orders/reference-tags";
import { AccessorialsList } from "@/components/orders/accessorials-list";

import { 
  enterpriseOrderInputSchema, 
  createDefaultOrderInput,
  mapAIExtractionToFormInput,
  type EnterpriseOrderInput,
  type AIOrderExtraction,
} from "@/lib/schemas/enterprise-order";
import { fetchAdminCustomers } from "@/lib/api";

// Equipment options
const EQUIPMENT_TYPES = [
  "Dry Van", "Flatbed", "Reefer", "Step Deck", "Box Truck", 
  "Tanker", "Lowboy", "Double Drop", "Conestoga", "Power Only"
];

const EQUIPMENT_LENGTHS = [26, 48, 53];

const PAYMENT_TERMS = [
  { value: "PREPAID", label: "Prepaid" },
  { value: "COD", label: "COD" },
  { value: "NET15", label: "Net 15" },
  { value: "NET30", label: "Net 30" },
  { value: "NET45", label: "Net 45" },
  { value: "NET60", label: "Net 60" },
];

const BILL_TO_TYPES = [
  { value: "customer", label: "Customer (Shipper)" },
  { value: "consignee", label: "Consignee" },
  { value: "third_party", label: "Third Party" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-zinc-400" },
  { value: "normal", label: "Normal", color: "text-blue-400" },
  { value: "high", label: "High", color: "text-amber-400" },
  { value: "critical", label: "Critical", color: "text-rose-400" },
];

export default function EnterpriseOrderPage() {
  const router = useRouter();
  
  // Form setup with Zod validation
  const form = useForm<EnterpriseOrderInput>({
    resolver: zodResolver(enterpriseOrderInputSchema),
    defaultValues: createDefaultOrderInput(),
    mode: "onChange",
  });

  const { 
    register, 
    control, 
    handleSubmit, 
    watch, 
    setValue, 
    reset,
    formState: { errors, isValid, isDirty } 
  } = form;

  // Watchers
  const watchedEquipment = watch("equipmentType");
  const watchedPriority = watch("priority");
  const watchedStatus = watch("status");
  const watchedItems = watch("freightItems");
  const watchedStops = watch("stops");

  // State
  const [ocrText, setOcrText] = useState("");
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<AIOrderExtraction["confidence"]>({});
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: fetchAdminCustomers,
  });

  // Create order mutation
  const createMutation = useMutation({
    mutationFn: async (data: EnterpriseOrderInput) => {
      const response = await fetch("/api/admin/orders/enterprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create order");
      return response.json();
    },
    onSuccess: (data) => {
      reset(createDefaultOrderInput());
      setAiWarnings([]);
      setAiConfidence({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  // OCR Handlers
  const handleOcrPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          e.preventDefault();
          await processOCR(undefined, blob);
          return;
        }
      }
    }
    const text = e.clipboardData.getData("text");
    if (text) {
      setOcrText(text);
      await processOCR(text);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      await processOCR(undefined, files[0]);
      return;
    }
    
    const text = e.dataTransfer.getData("text");
    if (text) {
      setOcrText(text);
      await processOCR(text);
    }
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await processOCR(undefined, file);
    }
  };

  const processOCR = async (text?: string, imageFile?: File) => {
    setIsProcessingOCR(true);
    try {
      let payload: any = { action: "parse-ocr-enterprise", data: {} };
      
      if (imageFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(imageFile);
        });
        payload.data.image = base64;
      } else if (text) {
        payload.data.text = text;
      }

      const response = await fetch("/api/ai/order-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success && result.data) {
        const extraction = result.data as AIOrderExtraction;
        const formData = mapAIExtractionToFormInput(extraction, form.getValues());
        
        // FIX: Match customer by name if ID is missing
        if (formData.customerName && !formData.customerId && customers) {
          const normalizedSearch = formData.customerName.toLowerCase();
          const matched = customers.find(c => 
            c.name.toLowerCase().includes(normalizedSearch) || 
            normalizedSearch.includes(c.name.toLowerCase())
          );
          
          if (matched) {
            formData.customerId = matched.id;
            formData.customerName = matched.name;
            
            // Update billing if needed
            if (formData.billing && formData.billing.billToType === "customer") {
              formData.billing.billToName = matched.name;
            }
          }
        }

        // FIX: Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
        if (formData.stops) {
          const formatDateTime = (dateStr: string | null | undefined) => {
            if (!dateStr) return null;
            try {
              const date = new Date(dateStr);
              if (isNaN(date.getTime())) return dateStr;
              
              // Adjust to local ISO string without seconds/ms
              const offset = date.getTimezoneOffset() * 60000;
              const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
              return localISOTime;
            } catch (e) {
              return dateStr;
            }
          };

          formData.stops = formData.stops.map(stop => ({
            ...stop,
            appointmentStart: formatDateTime(stop.appointmentStart),
            appointmentEnd: formatDateTime(stop.appointmentEnd),
          }));
        }

        // Apply extracted data to form
        Object.entries(formData).forEach(([key, value]) => {
          setValue(key as keyof EnterpriseOrderInput, value as any, { 
            shouldValidate: true,
            shouldDirty: true,
          });
        });

        setAiConfidence(extraction.confidence || {});
        setAiWarnings(extraction.warnings || []);
      }
    } catch (error) {
      console.error("OCR processing error:", error);
      setAiWarnings(["Failed to process OCR. Please try again."]);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  // Customer selection handler
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers?.find((c) => c.id === customerId);
    if (customer) {
      setValue("customerId", customer.id);
      setValue("customerName", customer.name);
      // Auto-set billing if not already set
      const currentBilling = watch("billing");
      if (currentBilling.billToType === "customer" && !currentBilling.billToName) {
        setValue("billing.billToName", customer.name);
      }
    }
  };

  // Calculate totals from freight items
  useEffect(() => {
    if (watchedItems) {
      const totals = watchedItems.reduce((acc, item) => {
        const qty = item.quantity || 1;
        return {
          weight: acc.weight + ((item.weightLbs || 0) * qty),
          pieces: acc.pieces + ((item.pieces || 1) * qty),
          pallets: item.packagingType === "pallet" ? acc.pallets + qty : acc.pallets,
          cube: acc.cube + (item.cubicFeet || 0) * qty,
          hasHazmat: acc.hasHazmat || item.isHazmat,
        };
      }, { weight: 0, pieces: 0, pallets: 0, cube: 0, hasHazmat: false });

      setValue("totalWeightLbs", totals.weight || null);
      setValue("totalPieces", totals.pieces || null);
      setValue("totalPallets", totals.pallets || null);
      setValue("totalCubicFeet", totals.cube || null);
      setValue("isHazmat", totals.hasHazmat);
    }
  }, [watchedItems, setValue]);

  const onSubmit = (data: EnterpriseOrderInput) => {
    createMutation.mutate(data);
  };

  const priorityConfig = PRIORITIES.find(p => p.value === watchedPriority);

  return (
    <div className="h-screen flex flex-col bg-black text-zinc-300 overflow-hidden">
      {/* Header */}
      <div className="flex-none border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              size="sm" 
              variant="subtle" 
              onClick={() => router.back()} 
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-white">New Order</h1>
              <p className="text-xs text-zinc-500">Enterprise Order Entry</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Priority */}
            <Select
              value={watchedPriority}
              onChange={(e) => setValue("priority", e.target.value as any)}
              className={`h-8 w-28 text-xs bg-zinc-900 border-zinc-800 ${priorityConfig?.color}`}
            >
              {PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>

            {/* Status */}
            <Chip 
              tone={watchedStatus === "Qualified" ? "ok" : "default"} 
              className="bg-zinc-800 text-zinc-300 border-zinc-700 h-8 px-3 text-xs"
            >
              {watchedStatus}
            </Chip>

            {/* Submit */}
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={!isValid || createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white h-8 text-xs"
            >
              <Send className="w-3 h-3 mr-2" />
              {createMutation.isPending ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </div>
      </div>

      {/* AI Warnings Banner */}
      {aiWarnings.length > 0 && (
        <div className="flex-none border-b border-amber-500/20 bg-amber-500/10">
          <div className="max-w-[1800px] mx-auto px-4 py-2 flex items-center gap-2 text-xs text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">AI Parsing Warnings:</span>
            {aiWarnings.map((w, i) => (
              <span key={i} className="text-amber-300">{w}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Layout */}
      <Tabs defaultValue="main" className="flex-1 flex flex-col min-h-0">
        <div className="flex-none border-b border-zinc-800 bg-zinc-950/50">
          <div className="max-w-[1800px] mx-auto px-4">
            <TabsList className="w-full justify-start gap-3 bg-transparent p-0 h-12 border-0">
              <TabsTrigger 
                value="main" 
                className="rounded-md px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-none border-0 transition-all"
              >
                Main
              </TabsTrigger>
              <TabsTrigger 
                value="other" 
                className="rounded-md px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-none border-0 transition-all"
              >
                Other Details
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="main" className="flex-1 min-h-0 m-0 p-0 data-[state=active]:flex flex-col items-center bg-black">
          <div className="w-full max-w-[1800px] flex-1 grid grid-cols-12 gap-0 min-h-0 border-x border-zinc-800/50">
            
            {/* COLUMN 1: THE ROUTE (Stops Timeline) */}
            <div className="col-span-3 flex flex-col border-r border-zinc-800/50 min-h-0">
              <div className="flex-1 overflow-y-auto p-3">
                <StopsTimeline
                  control={control}
                  register={register}
                  errors={errors}
                />
              </div>
            </div>

            {/* COLUMN 2: THE LOAD (Freight Items + Intake) */}
            <div className="col-span-6 flex flex-col border-r border-zinc-800/50 min-h-0">
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* OCR Intake */}
                <Card className="flex-none bg-[#0a0d12] border-zinc-800/50">
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <h3 className="text-xs font-semibold text-zinc-200">AI Order Intake</h3>
                      {isProcessingOCR && (
                        <span className="text-[10px] text-indigo-400 animate-pulse">Processing...</span>
                      )}
                      {aiConfidence.overall && (
                        <span className="text-[10px] text-emerald-400">{aiConfidence.overall}% confidence</span>
                      )}
                    </div>
                    <div
                      className={`relative rounded-lg border border-dashed transition-colors ${
                        isDragging ? "border-indigo-500/50 bg-indigo-500/10" : "border-zinc-800 bg-black/30"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <textarea
                        rows={2}
                        className="w-full bg-transparent px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none resize-none"
                        placeholder="Paste email text..."
                        value={ocrText}
                        onChange={(e) => setOcrText(e.target.value)}
                        onPaste={handleOcrPaste}
                      />
                      <div className="absolute bottom-1.5 right-2 flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileInput}
                          className="hidden"
                          id="ocr-upload"
                        />
                        <label
                          htmlFor="ocr-upload"
                          className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-indigo-400 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          Upload
                        </label>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Freight Items Grid */}
                <Card className="flex-1 bg-[#0a0d12] border-zinc-800/50 min-h-[300px]">
                  <div className="h-full p-3">
                    <FreightItemsGrid
                      control={control}
                      register={register}
                      setValue={setValue}
                      watch={watch}
                      errors={errors}
                      className="h-full flex flex-col"
                    />
                  </div>
                </Card>
              </div>
            </div>

            {/* COLUMN 3: DETAILS & SUMMARY */}
            <div className="col-span-3 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Customer Section */}
                <Card className="flex-none bg-[#0a0d12] border-zinc-800/50">
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-3 h-3 text-zinc-400" />
                      <h3 className="text-xs font-semibold text-zinc-200">Customer</h3>
                    </div>
                    <Select
                      value={watch("customerId") || ""}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="h-8 text-xs bg-black/30 border-zinc-800 text-zinc-300"
                    >
                      <option value="">Select Customer...</option>
                      {customers?.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                    {errors.customerName && (
                      <p className="mt-1 text-[10px] text-rose-400">{errors.customerName.message}</p>
                    )}
                  </div>
                </Card>

                {/* Equipment Section */}
                <Card className="flex-none bg-[#0a0d12] border-zinc-800/50">
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-3 h-3 text-zinc-400" />
                      <h3 className="text-xs font-semibold text-zinc-200">Equipment</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-medium uppercase text-zinc-500 mb-1 block">Type</label>
                        <Select
                          {...register("equipmentType")}
                          className="h-8 text-xs bg-black/30 border-zinc-800 text-zinc-300"
                        >
                          {EQUIPMENT_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium uppercase text-zinc-500 mb-1 block">Length</label>
                        <Select
                          {...register("equipmentLength", { valueAsNumber: true })}
                          className="h-8 text-xs bg-black/30 border-zinc-800 text-zinc-300"
                        >
                          {EQUIPMENT_LENGTHS.map(len => (
                            <option key={len} value={len}>{len} ft</option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    {watchedEquipment === "Reefer" && (
                      <div className="mt-2">
                        <label className="text-[10px] font-medium uppercase text-zinc-500 mb-1 block">Temperature</label>
                        <Input
                          {...register("temperatureSetting")}
                          placeholder="e.g., 34°F"
                          className="h-8 text-xs bg-black/30 border-zinc-800 text-zinc-300"
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Order Summary */}
                <Card className="flex-none bg-[#0a0d12] border-zinc-800/50">
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings2 className="w-3 h-3 text-zinc-400" />
                      <h3 className="text-xs font-semibold text-zinc-200">Summary</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-black/30 border border-zinc-800/50">
                        <div className="text-zinc-500 text-[10px] uppercase mb-0.5">Stops</div>
                        <div className="text-zinc-200 font-medium">{watchedStops?.length || 0}</div>
                      </div>
                      <div className="p-2 rounded bg-black/30 border border-zinc-800/50">
                        <div className="text-zinc-500 text-[10px] uppercase mb-0.5">Items</div>
                        <div className="text-zinc-200 font-medium">{watchedItems?.length || 0}</div>
                      </div>
                      <div className="p-2 rounded bg-black/30 border border-zinc-800/50">
                        <div className="text-zinc-500 text-[10px] uppercase mb-0.5">Weight</div>
                        <div className="text-zinc-200 font-medium">
                          {(watch("totalWeightLbs") || 0).toLocaleString()} <span className="text-[10px] text-zinc-500">lbs</span>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-black/30 border border-zinc-800/50">
                        <div className="text-zinc-500 text-[10px] uppercase mb-0.5">Pallets</div>
                        <div className="text-zinc-200 font-medium">{watch("totalPallets") || 0}</div>
                      </div>
                    </div>
                    
                    {/* Validation Status */}
                    <div className="mt-3 pt-3 border-t border-zinc-800/50">
                      {isValid ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Ready to create
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-amber-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Complete required fields
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="other" className="flex-1 min-h-0 m-0 p-0 data-[state=active]:flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Billing Section */}
              <Card className="flex-none bg-[#0a0d12] border-zinc-800/50">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-sm font-semibold text-zinc-200">Billing</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium uppercase text-zinc-500 mb-1 block">Bill To</label>
                      <Select
                        {...register("billing.billToType")}
                        className="h-9 text-sm bg-black/30 border-zinc-800 text-zinc-300"
                      >
                        {BILL_TO_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </Select>
                    </div>
                    {watch("billing.billToType") === "third_party" && (
                      <div>
                        <label className="text-xs font-medium uppercase text-zinc-500 mb-1 block">Third Party Name</label>
                        <Input
                          {...register("billing.billToName")}
                          placeholder="Company name"
                          className="h-9 text-sm bg-black/30 border-zinc-800 text-zinc-300"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium uppercase text-zinc-500 mb-1 block">Payment Terms</label>
                      <Select
                        {...register("billing.paymentTerms")}
                        className="h-9 text-sm bg-black/30 border-zinc-800 text-zinc-300"
                      >
                        {PAYMENT_TERMS.map(term => (
                          <option key={term.value} value={term.value}>{term.label}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("billing.requirePod")}
                          className="rounded border-zinc-700 bg-zinc-900 text-blue-600 w-4 h-4"
                        />
                        Require POD
                      </label>
                      <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("billing.requireBol")}
                          className="rounded border-zinc-700 bg-zinc-900 text-blue-600 w-4 h-4"
                        />
                        Require BOL
                      </label>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Instructions & Notes */}
              <Card className="flex-none bg-[#0a0d12] border-zinc-800/50">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-sm font-semibold text-zinc-200">Instructions</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium uppercase text-zinc-500 mb-1 block">Special Instructions</label>
                      <textarea
                        {...register("specialInstructions")}
                        rows={3}
                        placeholder="Customer/driver instructions..."
                        className="w-full text-sm bg-black/30 border border-zinc-800 rounded px-3 py-2 text-zinc-300 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase text-zinc-500 mb-1 block">Internal Notes</label>
                      <textarea
                        {...register("internalNotes")}
                        rows={3}
                        placeholder="Internal notes (not shared)..."
                        className="w-full text-sm bg-black/30 border border-zinc-800 rounded px-3 py-2 text-zinc-300 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* References */}
              <Card className="bg-[#0a0d12] border-zinc-800/50">
                <div className="p-4">
                  <ReferenceTags
                    control={control}
                    register={register}
                    errors={errors}
                  />
                </div>
              </Card>

              {/* Accessorials */}
              <Card className="bg-[#0a0d12] border-zinc-800/50">
                <div className="p-4">
                  <AccessorialsList
                    control={control}
                    register={register}
                    errors={errors}
                  />
                </div>
              </Card>

            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
