"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calculator, Save, Send } from "lucide-react";

import { SectionBanner } from "@/components/section-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createAdminOrder, fetchAdminCustomers } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import type { OrderAdminCreate } from "@/lib/types";

interface OrderFormData {
  reference: string;
  customerId: string;
  customer: string;
  pickup: string;
  delivery: string;
  pickupDate: string;
  deliveryDate: string;
  serviceLevel: string;
  commodity: string;
  weight: string;
  pieces: string;
  specialInstructions: string;
  laneMiles: number;
}

const serviceLevels = ["Standard", "Express", "Next Day", "Economy"];
const commodityTypes = [
  "General Freight",
  "Electronics",
  "Food & Beverage",
  "Automotive",
  "Hazmat",
  "Refrigerated",
];

export default function CreateOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<OrderFormData>({
    reference: "",
    customerId: "",
    customer: "",
    pickup: "",
    delivery: "",
    pickupDate: "",
    deliveryDate: "",
    serviceLevel: "Standard",
    commodity: "General Freight",
    weight: "",
    pieces: "",
    specialInstructions: "",
    laneMiles: 0,
  });

  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);

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

  const handleInputChange = (field: keyof OrderFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "pickup" || field === "delivery") {
      const miles = calculateMiles(
        field === "pickup" ? (value as string) : formData.pickup,
        field === "delivery" ? (value as string) : formData.delivery
      );
      setFormData((prev) => ({ ...prev, laneMiles: miles }));
    }
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

  const calculateEstimate = () => {
    const baseCPM = 2.5;
    const weightFactor = parseInt(formData.weight || "0", 10) > 40000 ? 0.3 : 0;
    const serviceMultiplier =
      formData.serviceLevel === "Express"
        ? 1.3
        : formData.serviceLevel === "Next Day"
        ? 1.5
        : formData.serviceLevel === "Economy"
        ? 0.9
        : 1.0;

    const cost = formData.laneMiles * (baseCPM + weightFactor) * serviceMultiplier;
    setEstimatedCost(Math.round(cost * 100) / 100);
  };

  const handleSubmit = () => {
    const payload: OrderAdminCreate = {
      reference: formData.reference || `ORD-${Date.now()}`,
      customer: formData.customer,
      pickup: formData.pickup,
      delivery: formData.delivery,
      window: `${formData.pickupDate} - ${formData.deliveryDate}`,
      status: "New",
      ageHours: 0,
      cost: estimatedCost || 0,
      lane: `${formData.pickup} → ${formData.delivery}`,
      serviceLevel: formData.serviceLevel,
      commodity: formData.commodity,
      laneMiles: formData.laneMiles,
    };

    createMutation.mutate(payload);
  };

  const isValid =
    !!formData.customer &&
    !!formData.pickup &&
    !!formData.delivery &&
    !!formData.pickupDate &&
    !!formData.deliveryDate &&
    !!formData.serviceLevel &&
    !!formData.commodity;

  return (
    <SectionBanner
      title="Create New Order"
      subtitle="Enter order details and customer requirements"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-200 mb-4">Order Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
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

                <FormField label="Order Reference">
                  <Input
                    placeholder="Auto-generated if empty"
                    value={formData.reference}
                    onChange={(e) => handleInputChange("reference", e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-200 mb-4">Pickup & Delivery</h3>
              <div className="grid gap-4">
                <FormField label="Pickup Location" required>
                  <Input
                    placeholder="City, State or Zip"
                    value={formData.pickup}
                    onChange={(e) => handleInputChange("pickup", e.target.value)}
                  />
                </FormField>

                <FormField label="Delivery Location" required>
                  <Input
                    placeholder="City, State or Zip"
                    value={formData.delivery}
                    onChange={(e) => handleInputChange("delivery", e.target.value)}
                  />
                </FormField>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Pickup Date" required>
                    <Input
                      type="datetime-local"
                      value={formData.pickupDate}
                      onChange={(e) => handleInputChange("pickupDate", e.target.value)}
                    />
                  </FormField>

                  <FormField label="Delivery Date" required>
                    <Input
                      type="datetime-local"
                      value={formData.deliveryDate}
                      onChange={(e) => handleInputChange("deliveryDate", e.target.value)}
                    />
                  </FormField>
                </div>

                {formData.laneMiles > 0 && (
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <span>Estimated Distance:</span>
                    <Chip tone="default" className="text-xs">
                      {formData.laneMiles} miles
                    </Chip>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-200 mb-4">Freight Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Service Level" required>
                  <Select value={formData.serviceLevel} onChange={(e) => handleInputChange("serviceLevel", e.target.value)}>
                    {serviceLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Commodity Type" required>
                  <Select value={formData.commodity} onChange={(e) => handleInputChange("commodity", e.target.value)}>
                    {commodityTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Weight (lbs)">
                  <Input
                    type="number"
                    placeholder="Total weight"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                  />
                </FormField>

                <FormField label="Pieces / Pallets">
                  <Input
                    type="number"
                    placeholder="Number of pieces"
                    value={formData.pieces}
                    onChange={(e) => handleInputChange("pieces", e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Special Instructions" className="mt-4">
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500"
                  placeholder="Add any special handling requirements or notes..."
                  value={formData.specialInstructions}
                  onChange={(e) => handleInputChange("specialInstructions", e.target.value)}
                />
              </FormField>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-200 mb-4">Cost Estimate</h3>

              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={calculateEstimate}
                disabled={!formData.pickup || !formData.delivery}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Estimate
              </Button>

              {estimatedCost !== null && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between p-3 rounded-lg bg-neutral-900/50">
                    <span className="text-neutral-400">Base Rate</span>
                    <span className="text-neutral-200 font-semibold">
                      ${(formData.laneMiles * 2.5).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-neutral-900/50">
                    <span className="text-neutral-400">Service Level</span>
                    <span className="text-neutral-200">{formData.serviceLevel}</span>
                  </div>
                  <div className="flex justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-neutral-200 font-semibold">Total Estimate</span>
                    <span className="text-emerald-400 font-bold text-lg">
                      ${estimatedCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <Button variant="outline" className="w-full" onClick={handleSubmit} disabled={!isValid || createMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>

                <Button variant="primary" className="w-full" onClick={handleSubmit} disabled={!isValid || createMutation.isPending}>
                  <Send className="w-4 h-4 mr-2" />
                  {createMutation.isPending ? "Creating..." : "Create Order"}
                </Button>
              </div>

              {!isValid && <p className="mt-3 text-xs text-amber-400">Please fill in all required fields</p>}
            </div>
          </Card>
        </div>
      </div>
    </SectionBanner>
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
