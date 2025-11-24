"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  DollarSign,
  Truck
} from "lucide-react";
import { useState, useEffect } from "react";

import { StatChip } from "@/components/stat-chip";
import { Button } from "@/components/ui/button";
import { fetchOrderDetail } from "@/lib/api";
import { formatDurationHours } from "@/lib/format";
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
  const [selectedStatus, setSelectedStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [isQualifying, setIsQualifying] = useState(false);
  const [qualificationNotes, setQualificationNotes] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrderDetail(orderId),
    enabled: Boolean(orderId),
  });

  useEffect(() => {
    if (data) {
      setSelectedDriver(data.booking.recommendedDriverId || "");
      setSelectedUnit(data.booking.recommendedUnitId || "");
      setSelectedStatus(data.status || "");
    }
  }, [data]);

  const qualifyMutation = useMutation({
    mutationFn: async (notes: string) => {
      const response = await fetch(`/api/orders/${orderId}/qualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) throw new Error('Failed to qualify order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      setIsQualifying(false);
      setQualificationNotes("");
    },
  });

  const handleQualify = () => {
    if (!qualificationNotes.trim()) return;
    qualifyMutation.mutate(qualificationNotes);
  };

  const handleBookTrip = async () => {
    if (!data || !selectedDriver || !selectedUnit) return;
    
    setIsBooking(true);
    try {
      const pickup = data.snapshot.stops.find(s => s.type === "Pickup");
      const delivery = data.snapshot.stops.find(s => s.type === "Delivery");

      if (!pickup || !delivery) throw new Error("Missing stop information");

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

      if (!response.ok) throw new Error("Failed to book trip");
      
      setTimeout(() => window.location.href = "/trips", 1500);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) return <OrderDetailSkeleton />;
  if (isError || !data) return <div className="col-span-12 p-6 text-neutral-500">Unable to load order.</div>;

  const canQualify = data?.status === "PendingInfo" || data?.status === "New";
  const isQualified = data?.status === "Qualified" || data?.status === "Booked";

  // Collect missing data
  const missingData = [];
  if (!selectedDriver) missingData.push("Driver selection");
  if (!selectedUnit) missingData.push("Unit selection");
  if (!data?.snapshot.stops[0]?.windowStart) missingData.push("Pickup window");
  if (!data?.snapshot.stops[1]?.windowStart) missingData.push("Delivery window");

  const progressSteps = [
    { label: "Created", active: true },
    { label: "Qualification", active: canQualify || isQualified },
    { label: "Ready", active: isQualified },
    { label: "Booked", active: data.status === "Booked" || data.status === "In Transit" },
    { label: "In Transit", active: data.status === "In Transit" },
    { label: "Delivered", active: data.status === "Delivered" },
  ];

  return (
    <div className="col-span-12 max-w-[1440px] mx-auto space-y-4">
      {/* Header + Progress */}
      <header className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-neutral-200">Order {data.id}</h1>
            <p className="text-xs text-neutral-500">{data.lane}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatChip label={data.status} variant={statusVariant[data.status] ?? "default"} />
            <StatChip label={`${formatDurationHours(data.ageHours)} old`} />
            <StatChip label={`${data.laneMiles} mi`} />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-1">
          {progressSteps.map((step, idx) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className={`flex-1 text-center px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                step.active 
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
                  : 'bg-neutral-800/30 text-neutral-600'
              }`}>
                {step.label}
              </div>
              {idx < progressSteps.length - 1 && (
                <div className={`w-2 h-px ${step.active ? 'bg-teal-500/40' : 'bg-neutral-700'}`} />
              )}
            </div>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4">
        {/* LEFT (Main) - 70% */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          
          {/* Missing Data Alert */}
          {missingData.length > 0 && (
            <div className="rounded-lg border-l-4 border-amber-500 bg-amber-500/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-200">Missing Required Data</h3>
                  <ul className="mt-1 text-xs text-amber-300 space-y-0.5">
                    {missingData.map(item => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <section className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Order Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-neutral-500">Customer</p>
                <p className="font-medium text-neutral-200">{data.customer}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Service / Commodity</p>
                <p className="text-neutral-300">{data.serviceLevel} • {data.snapshot.commodity}</p>
              </div>
            </div>
          </section>

          {/* Route & Stops */}
          <section className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Route & Stops</h2>
            <div className="space-y-2">
              {data.snapshot.stops.map((stop, idx) => (
                <div key={stop.id} className="flex items-start gap-3 p-3 rounded border border-neutral-800 bg-neutral-900/40">
                  <div className={`mt-1 w-2 h-2 rounded-full ${idx === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-neutral-400">{stop.type}</span>
                      <span className="text-xs text-neutral-500">
                        {new Date(stop.windowStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –
                        {new Date(stop.windowEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-200">{stop.location}</p>
                    {stop.instructions && (
                      <p className="text-xs text-neutral-500 mt-1">{stop.instructions}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Pricing</h2>
            <dl className="space-y-2 text-sm">
              {data.pricing.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5">
                  <dt className="text-xs text-neutral-500">{item.label}</dt>
                  <dd className="font-medium text-neutral-200">{item.value}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t-2 border-neutral-700 font-semibold text-neutral-100">
                <span className="text-sm">{data.pricing.totals.label}</span>
                <span>{data.pricing.totals.value}</span>
              </div>
            </dl>
          </section>

          {/* Booking Console */}
          <section className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Booking</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Driver</label>
                <select 
                  className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                >
                  {data.booking.driverOptions.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} • {driver.status} ({driver.hoursAvailable}h)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Unit</label>
                <select 
                  className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                >
                  {data.booking.unitOptions.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.id} • {unit.type} ({unit.status})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Notes</label>
                <textarea
                  rows={2}
                  className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 resize-none"
                  placeholder="Dispatcher notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <Button 
                variant="primary" 
                size="sm" 
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={handleBookTrip}
                disabled={isBooking || !selectedDriver || !selectedUnit}
              >
                {isBooking ? "Booking..." : "Book Trip"}
              </Button>
            </div>
          </section>
        </div>

        {/* RIGHT (Actions) - 30% - Fixed */}
        <div className="col-span-12 lg:col-span-4 space-y-4 lg:sticky lg:top-4 lg:self-start">
          
          {/* Qualification */}
          {canQualify && !isQualifying && (
            <div className="rounded-lg border-l-4 border-amber-500 bg-amber-500/10 p-3">
              <div className="flex items-start gap-2 mb-2">
                <Info className="w-4 h-4 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-200">Needs Qualification</h3>
                  <p className="text-xs text-amber-300 mt-1">Verify details before booking</p>
                </div>
              </div>
              <Button
                onClick={() => setIsQualifying(true)}
                size="sm"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-2"
              >
                Qualify Order
              </Button>
            </div>
          )}

          {isQualifying && (
            <div className="rounded-lg border border-emerald-700 bg-emerald-500/10 p-3">
              <textarea
                className="w-full h-20 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white resize-none mb-2"
                placeholder="Verification notes..."
                value={qualificationNotes}
                onChange={(e) => setQualificationNotes(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleQualify}
                  disabled={qualifyMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {qualifyMutation.isPending ? "..." : "Qualify"}
                </Button>
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={() => setIsQualifying(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Guardrails */}
          <section className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Booking Rules</h3>
            <ul className="space-y-1 text-xs text-neutral-400">
              {data.booking.guardrails.map((rule, idx) => (
                <li key={idx}>• {rule}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="col-span-12 max-w-[1440px] mx-auto space-y-4">
      <div className="h-24 animate-pulse rounded-lg border border-neutral-800 bg-neutral-900/60" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          <div className="h-40 animate-pulse rounded-lg border border-neutral-800 bg-neutral-900/60" />
          <div className="h-48 animate-pulse rounded-lg border border-neutral-800 bg-neutral-900/60" />
        </div>
        <div className="col-span-4 space-y-4">
          <div className="h-32 animate-pulse rounded-lg border border-neutral-800 bg-neutral-900/60" />
          <div className="h-64 animate-pulse rounded-lg border border-neutral-800 bg-neutral-900/60" />
        </div>
      </div>
    </div>
  );
}
