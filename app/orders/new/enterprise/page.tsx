"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, Send, Sparkles, Upload, AlertTriangle, 
  Building2, Truck, CreditCard, FileText, Settings2,
  CheckCircle2, ArrowRight, Plus
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
  type OrderStopInput,
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

  // Field array for stops - used to add stops from header
  const { fields: stopsFields, append: appendStop } = useFieldArray({
    control,
    name: "stops",
  });

  const addStop = (type: "pickup" | "delivery" | "intermediate") => {
    const newStop: OrderStopInput = {
      id: `stop-${Date.now()}`,
      stopSequence: stopsFields.length,
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
    appendStop(newStop);
  };

  // State
  const [ocrText, setOcrText] = useState("");
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<AIOrderExtraction["confidence"]>({});
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);

  // Estimated rate suggestion
  const [suggestedRate, setSuggestedRate] = useState<{
    rate: number;
    rpm: number;
    miles: number;
  } | null>(null);
  const [isFetchingRate, setIsFetchingRate] = useState(false);

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
      // Show success state - data contains the created order
      setCreatedOrder(data.data);
    },
  });

  // State for created order success
  const [createdOrder, setCreatedOrder] = useState<{ id: string; order_number: string } | null>(null);

  const handleCreateAnother = () => {
    setCreatedOrder(null);
    reset(createDefaultOrderInput());
    setAiWarnings([]);
    setAiConfidence({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // OCR Handlers
  const handleOcrPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
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

  // Fetch estimated rate based on origin/destination
  const fetchEstimatedRate = async () => {
    const stops = watch("stops");
    const pickups = stops.filter(s => s.stopType === "pickup");
    const deliveries = stops.filter(s => s.stopType === "delivery");
    
    if (pickups.length === 0 || deliveries.length === 0) return;
    
    const origin = pickups[0].city + (pickups[0].state ? ", " + pickups[0].state : "");
    const destination = deliveries[deliveries.length - 1].city + 
      (deliveries[deliveries.length - 1].state ? ", " + deliveries[deliveries.length - 1].state : "");
    
    if (!origin || !destination) return;
    
    setIsFetchingRate(true);
    try {
      // Get distance
      const distRes = await fetch(`/api/maps/distance?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
      const distData = await distRes.json();
      const miles = distData.distance || 500; // Fallback
      
      // Calculate suggested rate based on equipment and distance
      const equipmentType = watch("equipmentType");
      const baseCPM = 2.50;
      const multiplier = equipmentType === "Reefer" ? 1.3 : 
                         equipmentType === "Flatbed" ? 1.2 : 1.0;
      const rpm = baseCPM * multiplier;
      const rate = Math.round(miles * rpm * 100) / 100;
      
      setSuggestedRate({ rate, rpm, miles });
    } catch (error) {
      console.error("Failed to fetch estimated rate:", error);
    } finally {
      setIsFetchingRate(false);
    }
  };

  const acceptSuggestedRate = () => {
    if (suggestedRate) {
      setValue("quotedRate", suggestedRate.rate);
      setValue("ratePerMile", suggestedRate.rpm);
      setValue("totalMiles", suggestedRate.miles);
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

  // Success screen after order creation
  if (createdOrder) {
    return (
      <div className="h-screen flex flex-col bg-black text-zinc-300">
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-lg w-full mx-4">
            <Card className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Order Created!</h2>
              <p className="text-zinc-400 mb-6">
                Order <span className="font-mono text-emerald-400">{createdOrder.order_number}</span> has been created
                and is now ready for dispatch.
              </p>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">What happens next?</h3>
                <div className="text-xs text-zinc-500 text-left space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">1.</span>
                    <span>Order appears in <strong className="text-emerald-400">Fleet Ops</strong> panel</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">2.</span>
                    <span>Dispatcher assigns a driver or kicks to brokerage</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">3.</span>
                    <span>If brokered, post to carriers and collect bids</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/dispatch" className="block">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Go to Dispatch Command Center
                  </Button>
                </Link>
                <Button
                  variant="subtle"
                  className="w-full border-zinc-700"
                  onClick={handleCreateAnother}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Another Order
                </Button>
                <Link href="/orders" className="block">
                  <Button variant="plain" className="w-full text-zinc-400">
                    View All Orders
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black text-zinc-300">
      {/* STICKY HEADER */}
      <div className="flex-none border-b border-zinc-800 bg-zinc-950 px-4 py-2">
        <div className="flex items-center gap-4">
          {/* Back + Title */}
          <Button 
            size="sm" 
            variant="subtle" 
            onClick={() => router.back()} 
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="mr-4">
            <h1 className="text-base font-semibold text-white">New Order</h1>
          </div>

          {/* Customer */}
          <Select
            value={watch("customerId") || ""}
            onChange={(e) => handleCustomerSelect(e.target.value)}
            className="h-8 text-sm bg-zinc-900 border-zinc-700 text-zinc-200 w-44"
          >
            <option value="">Customer...</option>
            {customers?.map((c, idx) => (
              <option key={`${c.id}-${idx}`} value={c.id}>{c.name}</option>
            ))}
          </Select>

          {/* Equipment */}
          <Select
            {...register("equipmentType")}
            className="h-8 text-sm bg-zinc-900 border-zinc-700 text-zinc-200 w-28"
          >
            {EQUIPMENT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
          <Select
            {...register("equipmentLength", { valueAsNumber: true })}
            className="h-8 text-sm bg-zinc-900 border-zinc-700 text-zinc-200 w-20"
          >
            {EQUIPMENT_LENGTHS.map(len => (
              <option key={len} value={len}>{len}'</option>
            ))}
          </Select>

          {/* AI Paste Input */}
          <div
            className={`flex-1 relative rounded border transition-colors ${
              isDragging ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-700 bg-zinc-900"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Sparkles className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
            <input
              type="text"
              className="w-full h-8 bg-transparent pl-8 pr-8 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none"
              placeholder="Paste rate con or drag image..."
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              onPaste={handleOcrPaste}
            />
            <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" id="ocr-upload" />
            <label htmlFor="ocr-upload" className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-indigo-400 cursor-pointer">
              <Upload className="w-4 h-4" />
            </label>
          </div>
          {isProcessingOCR && <span className="text-xs text-indigo-400 animate-pulse">Processing...</span>}

          {/* Priority */}
          <Select
            value={watchedPriority}
            onChange={(e) => setValue("priority", e.target.value as any)}
            className={`h-8 w-24 text-xs bg-zinc-900 border-zinc-800 ${priorityConfig?.color}`}
          >
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* AI Warnings Banner */}
      {aiWarnings.length > 0 && (
        <div className="flex-none border-b border-amber-500/20 bg-amber-500/10 px-4 py-1.5">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            <span className="font-medium">AI Warnings:</span>
            {aiWarnings.map((w, i) => (
              <span key={i} className="text-amber-300">{w}</span>
            ))}
          </div>
        </div>
      )}

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <Tabs defaultValue="main" className="h-full flex flex-col">
          <div className="flex-none border-b border-zinc-800 bg-zinc-950/80 px-4 sticky top-0 z-10">
            <div className="flex items-center justify-between h-10">
              {/* Tabs on the left */}
              <TabsList className="justify-start gap-2 bg-transparent p-0 h-10 border-0">
                <TabsTrigger 
                  value="main" 
                  className="rounded px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 data-[state=active]:bg-zinc-800 data-[state=active]:text-white border-0"
                >
                  Main
                </TabsTrigger>
                <TabsTrigger 
                  value="other" 
                  className="rounded px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 data-[state=active]:bg-zinc-800 data-[state=active]:text-white border-0"
                >
                  Other Details
                </TabsTrigger>
              </TabsList>

              {/* Summary + Create Button on the right */}
              <div className="flex items-center gap-4">
                {/* Summary Stats */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-400">{watchedStops?.length || 0}</span>
                    <span className="text-zinc-600">stops</span>
                  </div>
                  <span className="text-zinc-700">•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-400">{watchedItems?.length || 0}</span>
                    <span className="text-zinc-600">items</span>
                  </div>
                  <span className="text-zinc-700">•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-400">{(watch("totalWeightLbs") || 0).toLocaleString()}</span>
                    <span className="text-zinc-600">lbs</span>
                  </div>
                  <span className="text-zinc-700">•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-400">{watch("totalPallets") || 0}</span>
                    <span className="text-zinc-600">pallets</span>
                  </div>
                </div>

                {/* Validation Status */}
                {isValid ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ready to create</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>
                      {!watch("customerId") && "Select customer"}
                      {watch("customerId") && Object.keys(errors).length > 0 && "Complete required fields"}
                    </span>
                  </div>
                )}

                {/* Create Button */}
                <Button
                  onClick={handleSubmit(onSubmit)}
                  disabled={!isValid || createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-400 text-white h-7 px-4 text-xs"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {createMutation.isPending ? "Creating..." : "Create Order"}
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="main" className="flex-1 m-0 p-0">
            <div className="p-4 space-y-6 pb-8">
              {/* FREIGHT ITEMS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-200">Freight Items</h3>
                </div>
                <FreightItemsGrid
                  control={control}
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  errors={errors}
                  className=""
                />
              </div>

              {/* ROUTE STOPS - Horizontal */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-200">Route</h3>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addStop("pickup")}
                      className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Pickup
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addStop("intermediate")}
                      className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Stop
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addStop("delivery")}
                      className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Delivery
                    </Button>
                  </div>
                </div>
                <StopsTimeline
                  control={control}
                  register={register}
                  watch={watch}
                  errors={errors}
                  layout="horizontal"
                  hideAddButtons={true}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="other" className="flex-1 m-0 p-0">
            <div className="p-4 space-y-6 pb-8">
              
              {/* Billing Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-200">Billing</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  <div className="flex items-end gap-4 pb-1">
                    <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("billing.requirePod")}
                        className="rounded border-zinc-700 bg-zinc-900 text-blue-600 w-4 h-4"
                      />
                      Require POD
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
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

              {/* Revenue & Pricing Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-200">Revenue & Pricing</h3>
                  <span className="text-xs text-zinc-500">Stage 1: Quoted rate (estimate)</span>
                </div>
                
                {/* Suggested Rate Card */}
                {suggestedRate && (
                  <div className="mb-3 p-3 rounded-lg border border-emerald-800/30 bg-emerald-950/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-emerald-400 font-medium mb-1">AI Suggested Rate</div>
                        <div className="text-lg font-semibold text-emerald-300">
                          ${suggestedRate.rate.toLocaleString()}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {suggestedRate.miles} mi × ${suggestedRate.rpm.toFixed(2)}/mi
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={acceptSuggestedRate}
                        className="border-emerald-700 text-emerald-400 hover:bg-emerald-950"
                      >
                        Accept Rate
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium uppercase text-zinc-500 mb-1 block">
                      Total Miles
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="1"
                        {...register("totalMiles", { valueAsNumber: true })}
                        placeholder="500"
                        className="h-9 text-sm bg-black/30 border-zinc-800 text-zinc-300"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="subtle"
                        onClick={fetchEstimatedRate}
                        disabled={isFetchingRate}
                        className="h-9 px-2 text-zinc-400 hover:text-white"
                      >
                        {isFetchingRate ? "..." : "Calc"}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium uppercase text-zinc-500 mb-1 block">
                      Rate/Mile (RPM)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("ratePerMile", { valueAsNumber: true })}
                      placeholder="2.50"
                      className="h-9 text-sm bg-black/30 border-zinc-800 text-zinc-300"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium uppercase text-zinc-500 mb-1 block">
                      Quoted Rate
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("quotedRate", { valueAsNumber: true })}
                      placeholder="1250.00"
                      className="h-9 text-sm bg-black/30 border-zinc-800 text-zinc-300"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium uppercase text-zinc-500 mb-1 block">
                      Target Margin %
                    </label>
                    <Input
                      type="number"
                      step="1"
                      {...register("targetMarginPct", { valueAsNumber: true })}
                      placeholder="15"
                      className="h-9 text-sm bg-black/30 border-zinc-800 text-zinc-300"
                    />
                  </div>
                </div>
                
                {/* Formula Display */}
                {(watch("totalMiles") && watch("ratePerMile")) && (
                  <div className="mt-3 rounded-lg border border-blue-800/30 bg-blue-950/20 px-3 py-2">
                    <p className="text-center text-xs text-blue-300">
                      <span className="font-mono">{watch("totalMiles") || 0} mi</span>
                      <span className="mx-2 text-blue-500">×</span>
                      <span className="font-mono">${watch("ratePerMile") || 0}</span>
                      <span className="mx-2 text-blue-500">=</span>
                      <span className="font-semibold font-mono">
                        ${((watch("totalMiles") || 0) * (watch("ratePerMile") || 0)).toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Service Type Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-200">Service Type</h3>
                  <span className="text-xs text-zinc-500">Consolidation rules for dispatch</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-4 p-3 rounded border border-zinc-800 bg-black/20">
                    <label className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        {...register("isDirect")}
                        className="rounded border-zinc-700 bg-zinc-900 text-blue-600 w-4 h-4 mt-0.5"
                      />
                      <div>
                        <div className="font-medium">Direct Service</div>
                        <div className="text-xs text-zinc-500 mt-0.5">Dedicated truck - cannot consolidate with other orders</div>
                      </div>
                    </label>
                  </div>
                  <div className="p-3 rounded border border-zinc-800 bg-black/20">
                    <div className="text-xs font-medium text-zinc-500 mb-1">DISPATCH IMPACT</div>
                    <div className="text-xs text-zinc-400 leading-relaxed">
                      {watch("isDirect") 
                        ? <span className="text-amber-400">🚛 Direct: This order gets its own trip (1:1)</span>
                        : <span className="text-blue-400">📦 Standard: Can be combined with other orders into multi-stop trips</span>
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-200">Instructions & Notes</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

              {/* References & Accessorials Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* References */}
                <div>
                  <ReferenceTags
                    control={control}
                    register={register}
                    errors={errors}
                  />
                </div>

                {/* Accessorials */}
                <div>
                  <AccessorialsList
                    control={control}
                    register={register}
                    errors={errors}
                  />
                </div>
              </div>

            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
