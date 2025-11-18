"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Save, Send } from "lucide-react";

import { SectionBanner } from "@/components/section-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createAdminTrip, fetchAdminDrivers, fetchAdminOrders, fetchAdminUnits } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import type { TripAdminCreate } from "@/lib/types";

interface TripFormData {
  orderId: string;
  driverId: string;
  unitId: string;
  pickup: string;
  delivery: string;
  eta: string;
  status: string;
  rateAmount: string;
  rateType: string;
  notes: string;
}

const tripStatuses = ["Planning", "Assigned", "In Transit", "At Stop", "Completed"];
const rateTypes = ["Flat Rate", "Per Mile", "Per Hour"];

export default function CreateTripPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<TripFormData>({
    orderId: "",
    driverId: "",
    unitId: "",
    pickup: "",
    delivery: "",
    eta: "",
    status: "Planning",
    rateAmount: "",
    rateType: "Flat Rate",
    notes: "",
  });

  const [guardrailWarnings, setGuardrailWarnings] = useState<string[]>([]);

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: fetchAdminOrders,
  });

  const { data: drivers } = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: fetchAdminDrivers,
  });

  const { data: units } = useQuery({
    queryKey: ["admin-units"],
    queryFn: fetchAdminUnits,
  });

  const createMutation = useMutation({
    mutationFn: (payload: TripAdminCreate) => createAdminTrip(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      router.push(`/trips/${data.id}`);
    },
  });

  const handleInputChange = (field: keyof TripFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOrderSelect = (orderId: string) => {
    const order = orders?.find((o) => o.id === orderId);
    if (order) {
      setFormData((prev) => ({
        ...prev,
        orderId: order.id,
        pickup: order.pickup,
        delivery: order.delivery,
      }));
    }
  };

  const handleDriverSelect = (driverId: string) => {
    const driver = drivers?.find((d) => d.id === driverId);
    if (driver) {
      setFormData((prev) => ({ ...prev, driverId: driver.id }));
      checkGuardrails(driver.id, formData.unitId);
    }
  };

  const handleUnitSelect = (unitId: string) => {
    const unit = units?.find((u) => u.id === unitId);
    if (unit) {
      setFormData((prev) => ({ ...prev, unitId: unit.id }));
      checkGuardrails(formData.driverId, unit.id);
    }
  };

  const checkGuardrails = (driverId: string, unitId: string) => {
    const warnings: string[] = [];
    const driver = drivers?.find((d) => d.id === driverId);
    const unit = units?.find((u) => u.id === unitId);

    if (driver && driver.hoursAvailable < 8) {
      warnings.push(`⚠️ Driver ${driver.name} has only ${driver.hoursAvailable}h available`);
    }

    if (driver && driver.status !== "Available") {
      warnings.push(`⚠️ Driver ${driver.name} status: ${driver.status}`);
    }

    if (unit && unit.status !== "Available") {
      warnings.push(`⚠️ Unit ${unit.type} status: ${unit.status}`);
    }

    setGuardrailWarnings(warnings);
  };

  const handleSubmit = () => {
    const driver = drivers?.find((d) => d.id === formData.driverId);
    const unit = units?.find((u) => u.id === formData.unitId);

    const payload: TripAdminCreate = {
      orderId: formData.orderId,
      driverId: formData.driverId,
      unitId: formData.unitId,
      driver: driver?.name || "Unknown",
      unit: unit?.type || "Unknown",
      pickup: formData.pickup,
      delivery: formData.delivery,
      eta: formData.eta,
      status: formData.status,
      exceptions: 0,
      lastPing: new Date().toISOString(),
    };

    createMutation.mutate(payload);
  };

  const isValid =
    !!formData.orderId &&
    !!formData.driverId &&
    !!formData.unitId &&
    !!formData.pickup &&
    !!formData.delivery &&
    !!formData.eta;

  return (
    <SectionBanner
      title="Create New Trip"
      subtitle="Assign driver and unit to an order"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="subtle" onClick={() => router.back()}>
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
              <h3 className="text-lg font-semibold text-neutral-200 mb-4">Order Assignment</h3>
              <div className="grid gap-4">
                <FormField label="Select Order" required>
                  <Select value={formData.orderId} onChange={(e) => handleOrderSelect(e.target.value)}>
                    <option value="">Choose an order</option>
                    {orders
                      ?.filter((o) => o.status === "New" || o.status === "Planning")
                      .map((order) => (
                        <option key={order.id} value={order.id}>
                          {order.reference} - {order.customer} ({order.pickup} → {order.delivery})
                        </option>
                      ))}
                  </Select>
                </FormField>

                {formData.orderId && (
                  <div className="p-3 rounded-lg bg-neutral-900/50 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-neutral-400">Lane:</span>
                      <span className="text-neutral-200">
                        {formData.pickup} → {formData.delivery}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Customer:</span>
                      <span className="text-neutral-200">
                        {orders?.find((o) => o.id === formData.orderId)?.customer}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-200 mb-4">Crew Assignment</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Driver" required>
                  <Select value={formData.driverId} onChange={(e) => handleDriverSelect(e.target.value)}>
                    <option value="">Select Driver</option>
                    {drivers
                      ?.filter((d) => d.status === "Available")
                      .map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} ({driver.hoursAvailable}h available)
                        </option>
                      ))}
                  </Select>
                </FormField>

                <FormField label="Unit" required>
                  <Select value={formData.unitId} onChange={(e) => handleUnitSelect(e.target.value)}>
                    <option value="">Select Unit</option>
                    {units
                      ?.filter((u) => u.status === "Available")
                      .map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.type} - {unit.location}
                        </option>
                      ))}
                  </Select>
                </FormField>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-200 mb-4">Trip Details</h3>
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="ETA" required>
                    <Input
                      type="datetime-local"
                      value={formData.eta}
                      onChange={(e) => handleInputChange("eta", e.target.value)}
                    />
                  </FormField>

                  <FormField label="Status" required>
                    <Select value={formData.status} onChange={(e) => handleInputChange("status", e.target.value)}>
                      {tripStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Rate Amount">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.rateAmount}
                      onChange={(e) => handleInputChange("rateAmount", e.target.value)}
                    />
                  </FormField>

                  <FormField label="Rate Type">
                    <Select value={formData.rateType} onChange={(e) => handleInputChange("rateType", e.target.value)}>
                      {rateTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                <FormField label="Trip Notes">
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500"
                    placeholder="Add dispatch notes or special instructions..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-200 mb-4">Guardrails Check</h3>

              {guardrailWarnings.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {guardrailWarnings.map((warning, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-amber-200">{warning}</span>
                    </div>
                  ))}
                </div>
              ) : formData.driverId && formData.unitId ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
                  <p className="text-sm text-emerald-200">✓ All guardrails satisfied</p>
                </div>
              ) : (
                <p className="text-sm text-neutral-400 mb-4">Select driver and unit to check guardrails</p>
              )}

              <div className="space-y-3">
                <Button variant="subtle" className="w-full" onClick={handleSubmit} disabled={!isValid || createMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>

                <Button variant="primary" className="w-full" onClick={handleSubmit} disabled={!isValid || createMutation.isPending}>
                  <Send className="w-4 h-4 mr-2" />
                  {createMutation.isPending ? "Creating..." : "Launch Trip"}
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
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
