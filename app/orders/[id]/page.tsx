"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CalendarClock, 
  Gauge, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  MapPin,
  Truck,
  DollarSign,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info
} from "lucide-react";
import { useState, useEffect } from "react";

import { RecommendationCallout } from "@/components/recommendation-callout";
import { AIOrderInsightPanel } from "@/components/AIOrderInsightPanel";
import { StatChip } from "@/components/stat-chip";
import { Button } from "@/components/ui/button";
import { fetchOrderDetail } from "@/lib/api";
import { generateOrderInsightsPrompt } from "@/lib/orderInsightsPrompt";
import { formatDateTime, formatDurationHours } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { OrderDetail } from "@/lib/types";

const statusVariant: Record<string, "default" | "ok" | "warn" | "alert"> = {
  "In Transit": "ok",
  "Delivered": "default",
  "Planning": "default",
  "New": "default",
  "Exception": "alert",
  "At Risk": "warn",
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";
  const queryClient = useQueryClient();
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedPricing, setSelectedPricing] = useState("");
  const [notes, setNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrderDetail(orderId),
    enabled: Boolean(orderId),
  });

  // Initialize form values when data loads
  useEffect(() => {
    if (data) {
      setSelectedDriver(data.booking.recommendedDriverId || "");
      setSelectedUnit(data.booking.recommendedUnitId || "");
      setSelectedPricing("");
    }
  }, [data]);

  // Pricing configuration options based on driver/unit selection
  const pricingOptions = [
    { id: "standard", label: "Standard Rate", description: "Base linehaul + fuel" },
    { id: "premium", label: "Premium Rate", description: "Enhanced service level" },
    { id: "discount", label: "Discount Rate", description: "Volume customer pricing" },
    { id: "spot", label: "Spot Market", description: "Current market rate" },
  ];

  // Filter pricing based on driver type if needed
  const availablePricing = selectedDriver && selectedUnit ? pricingOptions : pricingOptions;

  // Fetch AI insights when data loads
  useEffect(() => {
    async function fetchInsights() {
      if (!data) return;
      
      setLoadingInsights(true);
      try {
        const prompt = generateOrderInsightsPrompt(data);
        
        const response = await fetch("/api/ai/order-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch insights");
        }

        const insights = await response.json();
        setAiInsights(insights);
      } catch (error) {
        console.error("Error fetching AI insights:", error);
        setAiInsights({
          summary: "Unable to generate insights at this time",
          canDispatch: false,
          recommendedDriver: { id: null, name: "N/A", reason: "Analysis unavailable" },
          recommendedUnit: { id: null, number: "N/A", reason: "Analysis unavailable" },
          insights: [{
            category: "Risk",
            severity: "warning",
            title: "Insight Generation Failed",
            description: "Unable to analyze order data. Please review manually.",
            recommendation: "Check order details and try again"
          }]
        });
      } finally {
        setLoadingInsights(false);
      }
    }

    fetchInsights();
  }, [data]);



  const handleBookTrip = async () => {
    if (!data || !selectedDriver || !selectedUnit) {
      alert("Please select both a driver and unit");
      return;
    }

    setIsBooking(true);
    try {
      const pickup = data.snapshot.stops.find(s => s.type === "Pickup");
      const delivery = data.snapshot.stops.find(s => s.type === "Delivery");

      if (!pickup || !delivery) {
        throw new Error("Missing pickup or delivery information");
      }

      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: data.id,
          driverId: selectedDriver,
          unitId: selectedUnit,
          pickup: {
            location: pickup.location,
            windowStart: pickup.windowStart,
            windowEnd: pickup.windowEnd,
          },
          delivery: {
            location: delivery.location,
            windowStart: delivery.windowStart,
            windowEnd: delivery.windowEnd,
          },
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to book trip");
      }

      const trip = await response.json();
      alert(`Trip ${trip.id.slice(0, 8)} booked successfully! Redirecting to trips page...`);
      setNotes("");
      
      // Redirect to trips page after successful booking
      setTimeout(() => {
        window.location.href = "/trips";
      }, 1500);
    } catch (error: any) {
      console.error("Error booking trip:", error);
      alert(error.message || "Failed to book trip");
    } finally {
      setIsBooking(false);
    }
  };

  const handleCalculateCost = async () => {
    alert("Cost calculation feature coming soon");
  };

  const handleUpdateStatus = async () => {
    alert("Status update feature coming soon");
  };



  // Collect all missing data
  const missingData = [];
  if (!selectedDriver) missingData.push("Driver selection");
  if (!selectedUnit) missingData.push("Unit selection");
  if (!data?.snapshot.stops[0]?.windowStart) missingData.push("Pickup window");
  if (!data?.snapshot.stops[1]?.windowStart) missingData.push("Delivery window");

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <section className="col-span-12 rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-sm text-neutral-500">
        Unable to load order.
      </section>
    );
  }

  const headerChips = [
    { label: data.status, variant: statusVariant[data.status] ?? "default" },
    { label: `${formatDurationHours(data.ageHours)} old` },
    { label: `${data.laneMiles} lane mi` },
  ];

  // Progress steps
  const progressSteps = [
    { label: "Created", active: true },
    { label: "Ready to Book", active: !isBooking },
    { label: "Booked", active: data.status === "Booked" || data.status === "In Transit" },
    { label: "In Transit", active: data.status === "In Transit" },
    { label: "Delivered", active: data.status === "Delivered" },
  ];

  return (
    <div className="col-span-12 max-w-[1440px] mx-auto">
      {/* Header */}
      <header className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-lg font-semibold text-neutral-200">Order {data.id}</h1>
            <p className="text-xs text-neutral-500">{data.lane}</p>
          </div>
          <div className="flex items-center gap-2">
            {headerChips.map((chip) => (
              <StatChip key={chip.label} label={chip.label} variant={chip.variant ?? "default"} />
            ))}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {progressSteps.map((step, idx) => (
            <div key={step.label} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-1 rounded text-xs ${
                step.active 
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                  : 'bg-neutral-800/50 text-neutral-500'
              }`}>
                {step.active && <CheckCircle2 className="w-3 h-3" />}
                {step.label}
              </div>
              {idx < progressSteps.length - 1 && (
                <div className="w-4 h-px bg-neutral-700 mx-1" />
              )}
            </div>
          ))}
        </div>
      </header>

      {/* 3-Column Layout */}
      <section className="grid grid-cols-12 gap-4">
        
        {/* LEFT COLUMN - AI Insights */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <AIOrderInsightPanel insights={loadingInsights ? null : aiInsights} />
        </div>

        {/* CENTER COLUMN - Order Summary & Pricing */}
        <div className="col-span-12 lg:col-span-4 space-y-4 max-h-screen overflow-y-auto pr-2">
          {/* Order Summary */}
          <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-3">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-neutral-500">Customer</p>
                <p className="font-semibold text-neutral-200">{data.customer}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Service Level / Commodity</p>
                <p className="text-neutral-200">{data.serviceLevel} • {data.snapshot.commodity}</p>
              </div>
              <div className="pt-2 border-t border-neutral-800">
                <p className="text-xs text-neutral-500 mb-2">Route & Stops</p>
                <ul className="space-y-2">
                  {data.snapshot.stops.map((stop) => (
                    <li key={stop.id} className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-2">
                      <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                        <span className="font-medium">{stop.type}</span>
                        <div className="text-right">
                          <div>
                            {new Date(stop.windowStart).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                          <div>
                            {new Date(stop.windowStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –
                            {" "}
                            {new Date(stop.windowEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-200">{stop.location}</p>
                      {stop.instructions && (
                        <p className="text-xs text-neutral-500 mt-1">{stop.instructions}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {data.snapshot.notes && (
                <div className="pt-2 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500">Notes</p>
                  <p className="text-xs text-neutral-300 mt-1">{data.snapshot.notes}</p>
                </div>
              )}
            </div>
          </article>

          {/* Pricing */}
          <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-neutral-200">Pricing</h2>
              <Gauge className="w-4 h-4 text-neutral-500" />
            </div>
            <dl className="space-y-2 text-sm">
              {data.pricing.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
                  <dt className="text-xs text-neutral-500">{item.label}</dt>
                  <dd className="font-semibold text-neutral-200">{item.value}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t-2 border-neutral-700 font-semibold text-neutral-200">
                <span>{data.pricing.totals.label}</span>
                <span>{data.pricing.totals.value}</span>
              </div>
            </dl>
            {data.pricing.totals.helper && (
              <p className="text-xs text-neutral-500 mt-2">{data.pricing.totals.helper}</p>
            )}
          </article>
        </div>

        {/* RIGHT COLUMN - Booking Console & Guardrails */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          
          {/* Booking Console */}
          <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-sm font-semibold text-neutral-200 mb-3">Booking Console</h2>
            <div className="space-y-3">
              <label className="block">
                <span className="block text-xs text-neutral-500 mb-1">Driver</span>
                <select 
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                >
                  {data.booking.driverOptions.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} • {driver.status} ({driver.hoursAvailable}h)
                    </option>
                  ))}
                </select>
              </label>
              
              <label className="block">
                <span className="block text-xs text-neutral-500 mb-1">Unit</span>
                <select 
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                >
                  {data.booking.unitOptions.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.type} ({unit.status})
                    </option>
                  ))}
                </select>
              </label>
              
              <label className="block">
                <span className="block text-xs text-neutral-500 mb-1">Pricing Configuration</span>
                <select 
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
                  value={selectedPricing}
                  onChange={(e) => setSelectedPricing(e.target.value)}
                  disabled={!selectedDriver || !selectedUnit}
                >
                  <option value="">Select pricing...</option>
                  {availablePricing.map((pricing) => (
                    <option key={pricing.id} value={pricing.id}>
                      {pricing.label} - {pricing.description}
                    </option>
                  ))}
                </select>
              </label>
              
              <label className="block">
                <span className="block text-xs text-neutral-500 mb-1">Notes</span>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 resize-none"
                  placeholder="Dispatcher notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              
              <Button 
                type="button" 
                variant="primary" 
                size="sm" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleBookTrip}
                disabled={isBooking || !selectedDriver || !selectedUnit}
              >
                {isBooking ? "Booking..." : "Book Trip"}
              </Button>
            </div>
          </article>

          {/* Guardrails */}
          <RecommendationCallout
            title="Booking Guardrails"
            description="Constraints enforced before booking"
            bullets={data.booking.guardrails}
          />
        </div>
      </section>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <>
      <header className="col-span-12 h-24 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
      <section className="col-span-12 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <div className="h-64 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
          <div className="h-56 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <div className="h-28 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
          <div className="h-72 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
        </div>
      </section>
    </>
  );
}
