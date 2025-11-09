"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OrderIntakePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customer: "",
    origin: "",
    destination: "",
    pickupWindowStart: "",
    pickupWindowEnd: "",
    deliveryWindowStart: "",
    deliveryWindowEnd: "",
    requiredEquipment: "",
    notes: "",
    source: "Manual",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.customer.trim()) errors.customer = "Customer is required";
    if (!formData.origin.trim()) errors.origin = "Origin is required";
    if (!formData.destination.trim()) errors.destination = "Destination is required";
    if (!formData.pickupWindowStart) errors.pickupWindowStart = "Pickup start time is required";
    if (!formData.pickupWindowEnd) errors.pickupWindowEnd = "Pickup end time is required";
    if (!formData.deliveryWindowStart) errors.deliveryWindowStart = "Delivery start time is required";
    if (!formData.deliveryWindowEnd) errors.deliveryWindowEnd = "Delivery end time is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRunRuleCheck = () => {
    if (validateForm()) {
      alert("✓ Rule check passed. Order is qualified.");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Redirect to orders list after success
      setTimeout(() => {
        router.push("/orders");
      }, 1500);
    }, 1000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#E6EAF2]">
      {/* Header */}
      <div className="bg-[#0B1020] border-b border-[#1E2638] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/orders")}
              className="p-2 hover:bg-[#1E2638] rounded-md transition-colors text-[#9AA4B2] hover:text-[#E6EAF2]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-[#E6EAF2]">Order intake workspace</h1>
              <p className="text-sm text-[#6C7484] mt-1">
                Review fields, run rule checks, then submit once qualified.
              </p>
            </div>
          </div>
          <button className="h-9 px-4 bg-[#1E2638] border border-[#2A3547] rounded-md text-sm text-[#9AA4B2] hover:text-[#E6EAF2] hover:border-[#60A5FA]/40 transition-colors">
            Launch Booking Console
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Customer */}
          <div>
            <label htmlFor="customer" className="block text-xs font-medium text-[#9AA4B2] uppercase tracking-wider mb-2">
              Customer
            </label>
            <input
              id="customer"
              type="text"
              value={formData.customer}
              onChange={(e) => handleChange("customer", e.target.value)}
              className={`w-full h-11 px-4 bg-[#141C2F] border rounded-md text-[#E6EAF2] placeholder:text-[#6C7484] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA] transition-all ${
                validationErrors.customer ? "border-[#FF4D4D]" : "border-[#1E2638]"
              }`}
              placeholder="Enter customer name"
            />
            {validationErrors.customer && (
              <p className="mt-1 text-xs text-[#FF4D4D] flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.customer}
              </p>
            )}
          </div>

          {/* Origin */}
          <div>
            <label htmlFor="origin" className="block text-xs font-medium text-[#9AA4B2] uppercase tracking-wider mb-2">
              Origin
            </label>
            <input
              id="origin"
              type="text"
              value={formData.origin}
              onChange={(e) => handleChange("origin", e.target.value)}
              className={`w-full h-11 px-4 bg-[#141C2F] border rounded-md text-[#E6EAF2] placeholder:text-[#6C7484] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA] transition-all ${
                validationErrors.origin ? "border-[#FF4D4D]" : "border-[#1E2638]"
              }`}
              placeholder="City, State or Address"
            />
            {validationErrors.origin && (
              <p className="mt-1 text-xs text-[#FF4D4D] flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.origin}
              </p>
            )}
          </div>

          {/* Destination */}
          <div>
            <label htmlFor="destination" className="block text-xs font-medium text-[#9AA4B2] uppercase tracking-wider mb-2">
              Destination
            </label>
            <input
              id="destination"
              type="text"
              value={formData.destination}
              onChange={(e) => handleChange("destination", e.target.value)}
              className={`w-full h-11 px-4 bg-[#141C2F] border rounded-md text-[#E6EAF2] placeholder:text-[#6C7484] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA] transition-all ${
                validationErrors.destination ? "border-[#FF4D4D]" : "border-[#1E2638]"
              }`}
              placeholder="City, State or Address"
            />
            {validationErrors.destination && (
              <p className="mt-1 text-xs text-[#FF4D4D] flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.destination}
              </p>
            )}
          </div>

          {/* Pickup Window */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pickupStart" className="block text-xs font-medium text-[#9AA4B2] uppercase tracking-wider mb-2">
                Pickup Window Start
              </label>
              <input
                id="pickupStart"
                type="datetime-local"
                value={formData.pickupWindowStart}
                onChange={(e) => handleChange("pickupWindowStart", e.target.value)}
                className={`w-full h-11 px-4 bg-[#141C2F] border rounded-md text-[#E6EAF2] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA] transition-all ${
                  validationErrors.pickupWindowStart ? "border-[#FF4D4D]" : "border-[#1E2638]"
                }`}
              />
              {validationErrors.pickupWindowStart && (
                <p className="mt-1 text-xs text-[#FF4D4D] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.pickupWindowStart}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="pickupEnd" className="block text-xs font-medium text-[#9AA4B2] uppercase tracking-wider mb-2">
                Pickup Window End
              </label>
              <input
                id="pickupEnd"
                type="datetime-local"
                value={formData.pickupWindowEnd}
                onChange={(e) => handleChange("pickupWindowEnd", e.target.value)}
                className={`w-full h-11 px-4 bg-[#141C2F] border rounded-md text-[#E6EAF2] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA] transition-all ${
                  validationErrors.pickupWindowEnd ? "border-[#FF4D4D]" : "border-[#1E2638]"
                }`}
              />
              {validationErrors.pickupWindowEnd && (
                <p className="mt-1 text-xs text-[#FF4D4D] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.pickupWindowEnd}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Window */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="deliveryStart" className="block text-xs font-medium text-[#9AA4B2] uppercase tracking-wider mb-2">
                Delivery Window Start
              </label>
              <input
                id="deliveryStart"
                type="datetime-local"
                value={formData.deliveryWindowStart}
                onChange={(e) => handleChange("deliveryWindowStart", e.target.value)}
                className={`w-full h-11 px-4 bg-[#141C2F] border rounded-md text-[#E6EAF2] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA] transition-all ${
                  validationErrors.deliveryWindowStart ? "border-[#FF4D4D]" : "border-[#1E2638]"
                }`}
              />
              {validationErrors.deliveryWindowStart && (
                <p className="mt-1 text-xs text-[#FF4D4D] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.deliveryWindowStart}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="deliveryEnd" className="block text-xs font-medium text-[#9AA4B2] uppercase tracking-wider mb-2">
                Delivery Window End
              </label>
              <input
                id="deliveryEnd"
                type="datetime-local"
                value={formData.deliveryWindowEnd}
                onChange={(e) => handleChange("deliveryWindowEnd", e.target.value)}
                className={`w-full h-11 px-4 bg-[#141C2F] border rounded-md text-[#E6EAF2] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA] transition-all ${
                  validationErrors.deliveryWindowEnd ? "border-[#FF4D4D]" : "border-[#1E2638]"
                }`}
              />
              {validationErrors.deliveryWindowEnd && (
                <p className="mt-1 text-xs text-[#FF4D4D] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.deliveryWindowEnd}
                </p>
              )}
            </div>
          </div>

          {/* Required Equipment */}
          <div>
            <label htmlFor="equipment" className="block text-xs font-medium text-[#9AA4B2] uppercase tracking-wider mb-2">
              Required Equipment
            </label>
            <input
              id="equipment"
              type="text"
              value={formData.requiredEquipment}
              onChange={(e) => handleChange("requiredEquipment", e.target.value)}
              className="w-full h-11 px-4 bg-[#141C2F] border border-[#1E2638] rounded-md text-[#E6EAF2] placeholder:text-[#6C7484] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA] transition-all"
              placeholder="e.g., Dry van, Reefer, Flatbed"
            />
          </div>

          {/* Notes / Instructions */}
          <div>
            <label htmlFor="notes" className="block text-xs font-medium text-[#9AA4B2] uppercase tracking-wider mb-2">
              Notes / Instructions
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-[#141C2F] border border-[#1E2638] rounded-md text-[#E6EAF2] placeholder:text-[#6C7484] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA] transition-all resize-none"
              placeholder="Special handling, shipper notes, appointment requirements..."
            />
          </div>

          {/* Source */}
          <div>
            <label htmlFor="source" className="block text-xs font-medium text-[#9AA4B2] uppercase tracking-wider mb-2">
              Source
            </label>
            <select
              id="source"
              value={formData.source}
              onChange={(e) => handleChange("source", e.target.value)}
              className="w-full h-11 px-4 bg-[#141C2F] border border-[#1E2638] rounded-md text-[#E6EAF2] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA] transition-all"
            >
              <option value="Manual" className="bg-[#141C2F]">Manual</option>
              <option value="API" className="bg-[#141C2F]">API</option>
              <option value="Email" className="bg-[#141C2F]">Email</option>
              <option value="Portal" className="bg-[#141C2F]">Portal</option>
              <option value="EDI" className="bg-[#141C2F]">EDI</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-[#1E2638]">
            <div className="flex gap-3">
              <button
                onClick={handleRunRuleCheck}
                className="h-10 px-4 bg-[#1E2638] border border-[#2A3547] rounded-md text-sm text-[#E6EAF2] hover:bg-[#2A3547] transition-colors flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-[#FFC857]" />
                Run rule check
              </button>
              <button
                onClick={() => alert("Draft email functionality coming soon")}
                className="h-10 px-4 bg-[#1E2638] border border-[#2A3547] rounded-md text-sm text-[#9AA4B2] hover:text-[#E6EAF2] hover:bg-[#2A3547] transition-colors"
              >
                Draft follow-up email
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-10 px-6 bg-[#24D67B] hover:bg-[#1FC970] disabled:bg-[#1E2638] disabled:text-[#6C7484] rounded-md text-sm text-[#0B1020] font-medium transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-[#0B1020] border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit order"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 bg-[#24D67B] text-[#0B1020] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-5 w-5" />
          <div>
            <div className="font-medium">Order submitted successfully!</div>
            <div className="text-sm opacity-90">Redirecting to orders list...</div>
          </div>
        </div>
      )}
    </div>
  );
}
