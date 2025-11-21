"use client";

import { useState, type ReactNode, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calculator, Send, FileText, Upload, Sparkles, Truck, Calendar, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AIAssistant } from "@/components/ai-assistant";
import { createAdminOrder, fetchAdminCustomers } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import type { OrderAdminCreate } from "@/lib/types";

interface OrderFormData {
  id: string;
  customer: string;
  origin: string;
  destination: string;
  puWindowStart: string;
  puWindowEnd: string;
  delWindowStart: string;
  delWindowEnd: string;
  requiredTruck: string;
  notes: string;
  status: string;
  qualificationNotes: string;
  source: string;
  customerId: string;
}

const truckTypes = ["Dry Van", "Flatbed", "Reefer", "Step Deck", "Box Truck", "Tanker"];
const orderStatuses = ["New", "Qualifying", "Qualified", "Ready to Book"];
const orderSources = ["Email", "Phone", "Portal", "EDI", "Manual"];

export default function CreateOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<OrderFormData>({
    id: "", // Auto-generated
    customer: "",
    origin: "",
    destination: "",
    puWindowStart: "",
    puWindowEnd: "",
    delWindowStart: "",
    delWindowEnd: "",
    requiredTruck: "Dry Van",
    notes: "",
    status: "New",
    qualificationNotes: "",
    source: "Manual",
    customerId: "",
    pickup: "",
    delivery: "",
  });

  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: fetchAdminCustomers,
  });

  const createMutation = useMutation({
    mutationFn: (payload: OrderAdminCreate) => createAdminOrder(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
      router.push(`/orders/${data.id}`);
    },
  });

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers?.find((c) => c.id === customerId);
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerId: customer.id,
        customer: customer.name,
      }));
    }
  };

  const calculateEstimate = async () => {
    if (!formData.origin || !formData.destination) return;
    
    const miles = calculateMiles(formData.origin, formData.destination);
    const baseCPM = 2.5;
    const truckMultiplier = formData.requiredTruck === "Reefer" ? 1.3 : 
                            formData.requiredTruck === "Flatbed" ? 1.2 : 1.0;
    
    const cost = miles * baseCPM * truckMultiplier;
    setEstimatedCost(Math.round(cost * 100) / 100);

    // Also validate with AI
    await validateWithAI();
  };

  // AI-powered OCR parsing
  const handleOcrPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    setOcrText(text);
    await parseOcrWithAI(text);
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
    
    // Check for image files first
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await handleImageOcr(file);
        return;
      }
    }
    
    // Fallback to text
    const text = e.dataTransfer.getData("text");
    setOcrText(text);
    await parseOcrWithAI(text);
  }, []);

  const handleImageOcr = async (file: File) => {
    setIsProcessingOCR(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        
        // Send to AI for OCR
        const response = await fetch("/api/ai/order-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "parse-ocr",
            data: { image: base64Image },
          }),
        });

        const result = await response.json();
        if (result.success && result.data) {
          await applyOcrResults(result.data);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Image OCR error:", error);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await handleImageOcr(file);
    }
  };

  const parseOcrWithAI = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessingOCR(true);
    try {
      const response = await fetch("/api/ai/order-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "parse-ocr",
          data: { text },
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        await applyOcrResults(result.data);
      }
    } catch (error) {
      console.error("OCR parsing error:", error);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const applyOcrResults = async (parsed: any) => {
    const updates: Partial<OrderFormData> = {};

    // Handle customer - try to match with dropdown
    if (parsed.customer && customers) {
      const matchedCustomer = customers.find(
        (c) => c.name.toLowerCase().includes(parsed.customer.toLowerCase()) ||
               parsed.customer.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchedCustomer) {
        updates.customerId = matchedCustomer.id;
        updates.customer = matchedCustomer.name;
      } else {
        updates.customer = parsed.customer;
      }
    }

    if (parsed.origin) updates.origin = parsed.origin;
    if (parsed.destination) updates.destination = parsed.destination;
    if (parsed.puWindowStart) updates.puWindowStart = parsed.puWindowStart;
    if (parsed.puWindowEnd) updates.puWindowEnd = parsed.puWindowEnd;
    if (parsed.delWindowStart) updates.delWindowStart = parsed.delWindowStart;
    if (parsed.delWindowEnd) updates.delWindowEnd = parsed.delWindowEnd;
    if (parsed.requiredTruck) updates.requiredTruck = parsed.requiredTruck;
    if (parsed.notes) updates.notes = parsed.notes;

    setFormData(prev => ({ ...prev, ...updates }));

    // Show warnings if any
    if (parsed.warnings && parsed.warnings.length > 0) {
      console.log("OCR Warnings:", parsed.warnings);
    }
  };

  // Get AI suggestions when form data changes
  useEffect(() => {
    const getSuggestions = async () => {
      if (!formData.customer && !formData.origin && !formData.destination) return;

      try {
        const response = await fetch("/api/ai/order-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "suggest-fields",
            data: {
              partialOrder: formData,
              historicalOrders: [], // Could pass customer history here
            },
          }),
        });

        const result = await response.json();
        if (result.success) {
          setAiSuggestions(result.data || []);
        }
      } catch (error) {
        console.error("Suggestions error:", error);
      }
    };

    const timer = setTimeout(getSuggestions, 1000);
    return () => clearTimeout(timer);
  }, [formData.customer, formData.origin, formData.destination]);

  // Validate order with AI
  const validateWithAI = async () => {
    try {
      const response = await fetch("/api/ai/order-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate",
          data: { order: formData },
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        setValidationErrors(result.data.errors || []);
        return result.data;
      }
    } catch (error) {
      console.error("Validation error:", error);
    }
    return null;
  };

  const handleSubmit = () => {
    const payload: OrderAdminCreate = {
      reference: formData.id || `ORDER-${Date.now()}`,
      customer: formData.customer,
      pickup: formData.origin,
      delivery: formData.destination,
      window: `${formData.puWindowStart} - ${formData.delWindowEnd}`,
      status: formData.status,
      ageHours: 0,
      cost: estimatedCost || 0,
      lane: `${formData.origin} → ${formData.destination}`,
      serviceLevel: formData.requiredTruck,
      commodity: "General Freight",
      laneMiles: calculateMiles(formData.origin, formData.destination),
    };

    createMutation.mutate(payload);
  };

  const isValid =
    !!formData.customer &&
    !!formData.origin &&
    !!formData.destination &&
    !!formData.puWindowStart &&
    !!formData.delWindowStart;

  // Auto-generate order ID when required fields are filled
  const generatePreviewOrderId = () => {
    if (!isValid) return "Auto-generated";
    
    // Extract type from truck (P=Pickup, D=Delivery, default P)
    const type = "P";
    
    // Extract origin city code (first 2 letters of first word)
    const originMatch = formData.origin.match(/([A-Za-z]+)/);
    const originCode = originMatch ? originMatch[1].substring(0, 2).toUpperCase() : "XX";
    
    // Extract destination city code (first 2 letters of first word)
    const destMatch = formData.destination.match(/([A-Za-z]+)/);
    const destCode = destMatch ? destMatch[1].substring(0, 2).toUpperCase() : "XX";
    
    // Generate sequence based on timestamp
    const sequence = String(Date.now()).slice(-4);
    
    return `${type}${originCode}${destCode}${sequence}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="subtle" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-neutral-100">Create New Order</h1>
              <p className="text-sm text-neutral-400">OCR intake or manual entry</p>
            </div>
          </div>
          <Chip tone="default">{formData.status}</Chip>
        </div>
      </div>

      {/* Validation Errors Banner */}
      {validationErrors.length > 0 && (
        <div className="border-b border-rose-500/20 bg-rose-500/10 px-6 py-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-rose-400 mb-2">Validation Issues</h4>
              <div className="flex flex-wrap gap-4">
                {validationErrors.map((error, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <div className={`font-medium ${
                      error.severity === 'error' ? 'text-rose-400' : 
                      error.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
                    }`}>
                      {error.field}:
                    </div>
                    <div className="text-neutral-300">{error.message}</div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setValidationErrors([])}
              className="text-neutral-500 hover:text-neutral-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 3-Column Layout */}
      <div className="grid grid-cols-12 gap-6 p-6">
        
        {/* LEFT: Actions & Buttons */}
        <div className="col-span-2 space-y-4">
          <Card className="h-fit sticky top-6">
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-neutral-300 mb-3">Actions</h3>
              
              <Button
                variant="primary"
                className="w-full"
                onClick={calculateEstimate}
                disabled={!formData.origin || !formData.destination}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate
              </Button>

              <Button
                variant="success"
                className="w-full"
                onClick={handleSubmit}
                disabled={!isValid || createMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "Creating..." : "Create Order"}
              </Button>

              {estimatedCost !== null && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-xs text-neutral-400 mb-1">Estimated Cost</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    ${estimatedCost.toLocaleString()}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {calculateMiles(formData.origin, formData.destination)} miles
                  </div>
                </div>
              )}

              {!isValid && (
                <p className="text-xs text-amber-400 mt-3">
                  Fill required fields
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* CENTER: OCR Intake & Form */}
        <div className="col-span-6 space-y-4">
          {/* OCR Intake */}
          <Card>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-neutral-200">OCR Order Intake</h3>
                {isProcessingOCR && (
                  <span className="text-xs text-violet-400">Processing with AI...</span>
                )}
              </div>
              <div
                className={`relative rounded-lg border-2 border-dashed transition-colors ${
                  isDragging
                    ? "border-violet-400 bg-violet-500/10"
                    : "border-neutral-700 bg-neutral-900/60"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <textarea
                  rows={4}
                  className="w-full bg-transparent px-4 py-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none resize-none"
                  placeholder="Paste text or drag screenshot here... AI will auto-populate fields."
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  onPaste={handleOcrPaste}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  <label
                    htmlFor="screenshot-upload"
                    className="flex items-center gap-1 text-xs text-neutral-500 hover:text-violet-400 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload screenshot</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Order Form */}
          <Card>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-neutral-200">Order Details</h3>
              </div>

              {/* Customer */}
              <FormField label="Customer" required>
                <Select value={formData.customerId} onChange={(e) => handleCustomerSelect(e.target.value)}>
                  <option value="">Select Customer</option>
                  {customers?.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              {/* Origin & Destination */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Origin" required>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <Input
                      className="pl-9"
                      placeholder="Full address: Street, City, State, ZIP"
                      value={formData.origin}
                      onChange={(e) => handleInputChange("origin", e.target.value)}
                    />
                  </div>
                </FormField>

                <FormField label="Destination" required>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <Input
                      className="pl-9"
                      placeholder="Full address: Street, City, State, ZIP"
                      value={formData.destination}
                      onChange={(e) => handleInputChange("destination", e.target.value)}
                    />
                  </div>
                </FormField>
              </div>

              {/* Pickup Windows */}
              <div className="space-y-2">
                <label className="text-xs text-neutral-500 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Pickup Window
                  <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="datetime-local"
                    value={formData.puWindowStart}
                    onChange={(e) => handleInputChange("puWindowStart", e.target.value)}
                  />
                  <Input
                    type="datetime-local"
                    value={formData.puWindowEnd}
                    onChange={(e) => handleInputChange("puWindowEnd", e.target.value)}
                  />
                </div>
              </div>

              {/* Delivery Windows */}
              <div className="space-y-2">
                <label className="text-xs text-neutral-500 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Delivery Window
                  <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="datetime-local"
                    value={formData.delWindowStart}
                    onChange={(e) => handleInputChange("delWindowStart", e.target.value)}
                  />
                  <Input
                    type="datetime-local"
                    value={formData.delWindowEnd}
                    onChange={(e) => handleInputChange("delWindowEnd", e.target.value)}
                  />
                </div>
              </div>

              {/* Required Truck */}
              <FormField label="Required Truck">
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <Select
                    className="pl-9"
                    value={formData.requiredTruck}
                    onChange={(e) => handleInputChange("requiredTruck", e.target.value)}
                  >
                    {truckTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </div>
              </FormField>

              {/* Notes */}
              <FormField label="Notes">
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500"
                  placeholder="Special instructions, requirements..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                />
              </FormField>

              {/* Status & Source */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Status">
                  <Select value={formData.status} onChange={(e) => handleInputChange("status", e.target.value)}>
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Source">
                  <Select value={formData.source} onChange={(e) => handleInputChange("source", e.target.value)}>
                    {orderSources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              {/* Qualification Notes */}
              <FormField label="Qualification Notes">
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500"
                  placeholder="Qualification requirements, constraints..."
                  value={formData.qualificationNotes}
                  onChange={(e) => handleInputChange("qualificationNotes", e.target.value)}
                />
              </FormField>
            </div>
          </Card>
        </div>

        {/* RIGHT: Live Order Ticket Preview */}
        <div className="col-span-4">
          <Card className="h-fit sticky top-6">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-neutral-200">Order Ticket Preview</h3>
                <Chip tone="default" className="text-xs">Live</Chip>
              </div>

              <div className="space-y-4 text-sm">
                {/* Order ID */}
                <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
                  <div className="text-xs text-neutral-500 mb-1">Order ID</div>
                  <div className="font-mono text-neutral-300">
                    {generatePreviewOrderId()}
                  </div>
                </div>

                {/* Customer */}
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Customer</div>
                  <div className="text-neutral-200 font-medium">
                    {formData.customer || "—"}
                  </div>
                </div>

                {/* Route */}
                <div>
                  <div className="text-xs text-neutral-500 mb-2">Route</div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                      <div className="flex-1">
                        <div className="text-neutral-200">{formData.origin || "Origin"}</div>
                        {formData.puWindowStart && (
                          <div className="text-xs text-neutral-500">
                            {new Date(formData.puWindowStart).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pl-1 border-l-2 border-dashed border-neutral-700 h-8" />
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5" />
                      <div className="flex-1">
                        <div className="text-neutral-200">{formData.destination || "Destination"}</div>
                        {formData.delWindowStart && (
                          <div className="text-xs text-neutral-500">
                            {new Date(formData.delWindowStart).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Equipment</div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-200">{formData.requiredTruck}</span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Status</div>
                  <Chip tone={formData.status === "Qualified" ? "success" : "default"}>
                    {formData.status}
                  </Chip>
                </div>

                {/* Notes */}
                {formData.notes && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Notes</div>
                    <div className="text-neutral-300 text-xs p-2 rounded bg-neutral-900/60">
                      {formData.notes}
                    </div>
                  </div>
                )}

                {/* Qualification */}
                {formData.qualificationNotes && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Qualification</div>
                    <div className="text-neutral-300 text-xs p-2 rounded bg-amber-500/10 border border-amber-500/20">
                      {formData.qualificationNotes}
                    </div>
                  </div>
                )}

                {/* Source */}
                <div className="pt-3 border-t border-neutral-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">Source</span>
                    <span className="text-neutral-300">{formData.source}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* AI Assistant Chat */}
      <AIAssistant 
        currentOrder={formData} 
        onSuggestion={(field, value) => {
          setFormData(prev => ({ ...prev, [field]: value }));
        }}
      />


    </div>
  );
}

function FormField({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 text-sm ${className || ""}`}>
      <span className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}

function calculateMiles(origin: string, destination: string): number {
  if (!origin || !destination) return 0;
  const hash = (origin + destination)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Math.floor((hash % 900) + 100);
}
