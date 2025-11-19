"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AIRecommendationPanel } from "@/components/booking/ai-recommendation-panel";
import { DriverUnitSelector } from "@/components/booking/driver-unit-selector";
import { RateSelector } from "@/components/booking/rate-selector";
import { StopManager, type TripStop } from "@/components/booking/stop-manager";
import { RevenueCalculator } from "@/components/booking/revenue-calculator";
import { MarginCalculator } from "@/components/booking/margin-calculator";

interface Order {
  id: string;
  reference: string;
  customer: string;
  pickup: string;
  delivery: string;
  window: string;
  status: string;
  serviceLevel?: string;
  commodity?: string;
  laneMiles?: number;
  lane?: string;
  cost?: number;
}

interface Driver {
  id: string;
  name: string;
  homeBase: string;
  hoursAvailableToday: number;
  onTimeScore: number;
  recommended?: boolean;
}

interface Unit {
  id: string;
  code: string;
  type: string;
  homeBase: string;
  status: string;
  recommended?: boolean;
}

interface RateCard {
  id: string;
  rate_type: string;
  zone: string;
  fixed_cpm: number;
  wage_cpm: number;
  addons_cpm: number;
  fuel_cpm: number;
  truck_maint_cpm: number;
  trailer_maint_cpm: number;
  rolling_cpm: number;
  total_cpm: number;
}

export default function BookTripPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedOrderId = searchParams.get("orderId");

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [rates, setRates] = useState<RateCard[]>([]);
  
  // Form state
  const [driverId, setDriverId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [unitId, setUnitId] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [rateId, setRateId] = useState("");
  const [miles, setMiles] = useState(0);
  const [rpm, setRpm] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [stops, setStops] = useState<TripStop[]>([]);
  
  // AI Recommendations
  const [recommendedDriverId, setRecommendedDriverId] = useState<string | null>(null);
  const [recommendedUnitId, setRecommendedUnitId] = useState<string | null>(null);
  const [recommendedRateId, setRecommendedRateId] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch data
  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/drivers?active=true").then(r => r.json()),
      fetch("/api/units?active=true&isOnHold=false").then(r => r.json()),
      fetch("/api/rates").then(r => r.json()),
    ]).then(([ordersResponse, driversData, unitsData, ratesData]) => {
      const ordersList = ordersResponse.data || ordersResponse;
      setOrders(ordersList);
      setDrivers(driversData.data || driversData);
      setUnits(unitsData.data || unitsData);
      setRates(ratesData);
    }).catch(err => {
      console.error("Error fetching data:", err);
    });
  }, []);

  // Load selected order
  useEffect(() => {
    if (selectedOrderId && orders.length > 0) {
      const order = orders.find(o => o.id === selectedOrderId);
      if (order) {
        setSelectedOrder(order);
        // Pre-populate stops from order
        setStops([
          {
            id: "pickup",
            stopType: "Pickup",
            name: order.pickup,
            street: "",
            city: "",
            state: "",
            country: "US",
            postal: "",
            scheduledAt: new Date().toISOString(),
          },
          {
            id: "delivery",
            stopType: "Delivery",
            name: order.delivery,
            street: "",
            city: "",
            state: "",
            country: "US",
            postal: "",
            scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          },
        ]);
        // Set initial miles
        if (order.laneMiles) {
          setMiles(order.laneMiles);
        }
      }
    } else {
      setSelectedOrder(null);
      setStops([]);
      setMiles(0);
      setRpm(0);
      setTotalRevenue(0);
    }
  }, [selectedOrderId, orders]);

  // Sync driver name when ID changes
  useEffect(() => {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) setDriverName(driver.name);
  }, [driverId, drivers]);

  // Sync unit code when ID changes
  useEffect(() => {
    const unit = units.find(u => u.id === unitId);
    if (unit) setUnitCode(unit.code);
  }, [unitId, units]);

  // Handle AI Recommendation Application
  const handleApplyRecommendation = (recommendation: any) => {
    if (recommendation.driver) {
      setDriverId(recommendation.driver.id);
      setDriverName(recommendation.driver.name);
      setRecommendedDriverId(recommendation.driver.id);
    }
    if (recommendation.unit) {
      setUnitId(recommendation.unit.id);
      setUnitCode(recommendation.unit.code);
      setRecommendedUnitId(recommendation.unit.id);
    }
    if (recommendation.rate) {
      setRateId(recommendation.rate.id);
      setRecommendedRateId(recommendation.rate.id);
    }
    if (recommendation.estimatedMiles) {
      setMiles(recommendation.estimatedMiles);
    }
    if (recommendation.suggestedRPM) {
      setRpm(recommendation.suggestedRPM);
    }
    if (recommendation.targetRevenue) {
      setTotalRevenue(recommendation.targetRevenue);
    }
  };

  // Calculate totals
  const selectedRate = rates.find(r => r.id === rateId);
  const totalCpm = selectedRate?.total_cpm || 0;
  const totalCost = miles * totalCpm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !driverId || !unitId || !rateId) {
      setMessage({ type: "error", text: "Please select an order, driver, unit, and rate" });
      return;
    }

    if (stops.length < 2) {
      setMessage({ type: "error", text: "At least 2 stops (pickup and delivery) are required" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          driverId,
          driver: driverName,
          unitId,
          unit: unitCode,
          rateId,
          tripType: selectedRate?.rate_type,
          tripZone: selectedRate?.zone,
          miles,
          rpm,
          totalRevenue,
          totalCpm,
          totalCost,
          stops: stops.map((s, idx) => ({ ...s, sequence: idx })),
        }),
      });

      if (!response.ok) throw new Error("Failed to book trip");
      
      const trip = await response.json();
      setMessage({ type: "success", text: `Trip ${trip.id.substring(0, 8)} booked successfully!` });
      
      setTimeout(() => router.push("/trips"), 1500);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to book trip" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-emerald-400" />
          <h1 className="text-3xl font-semibold text-white">Trip Booking Console</h1>
        </div>
        
        {/* Order Selection Dropdown */}
        <div className="w-[600px]">
          <label className="mb-2 block text-[11px] uppercase tracking-wide text-neutral-500">Select Order to Book</label>
          <select
            className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
            value={selectedOrderId || ""}
            onChange={(e) => {
              const orderId = e.target.value;
              if (orderId) {
                router.push(`/book?orderId=${orderId}`);
              }
            }}
          >
            <option value="">Choose an order...</option>
            {orders.map(order => {
              const route = order.lane || (order.pickup && order.delivery 
                ? `${order.pickup} → ${order.delivery}` 
                : "Route TBD");
              const miles = order.laneMiles ? `${order.laneMiles}mi` : "";
              const statusIndicator = order.status === "Qualified" ? "✓" : order.status === "New" ? "○" : "●";
              
              return (
                <option key={order.id} value={order.id}>
                  {statusIndicator} {order.reference} | {order.customer} | {route} {miles ? `| ${miles}` : ""}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Order Snapshot */}
      {selectedOrder ? (
        <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-lg shadow-black/40">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-neutral-200">{selectedOrder.customer}</p>
              <p className="text-xs text-neutral-400">{selectedOrder.pickup} → {selectedOrder.delivery}</p>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">Service Level</p>
              <p className="text-xs text-white">{selectedOrder.serviceLevel || "Standard"}</p>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">Commodity</p>
              <p className="text-xs text-white">{selectedOrder.commodity || "General"}</p>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">Lane Miles</p>
              <p className="text-xs text-white">{selectedOrder.laneMiles || 0} mi</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
              selectedOrder.status === "Qualified" 
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-purple-500/30 bg-purple-500/10 text-purple-200"
            }`}>
              {selectedOrder.status}
            </span>
          </div>
        </Card>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 p-5 text-center text-sm text-neutral-400">
          Select a qualified order from the dropdown above to begin booking
        </div>
      )}

      {/* Three Column Layout: AI Recommendations | Form | Margin Calculator */}
      <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-[380px,1fr,380px]">
        {/* Left: AI Recommendations */}
        <div className="space-y-4">
          <AIRecommendationPanel
            orderId={selectedOrderId}
            onApplyRecommendation={handleApplyRecommendation}
          />
        </div>

        {/* Center: Main Form */}
        <div className="space-y-4">
          {/* Driver & Unit Selection */}
          <DriverUnitSelector
            drivers={drivers}
            units={units}
            selectedDriverId={driverId}
            selectedUnitId={unitId}
            recommendedDriverId={recommendedDriverId}
            recommendedUnitId={recommendedUnitId}
            onDriverSelect={setDriverId}
            onUnitSelect={setUnitId}
          />

          {/* Rate Card Selection */}
          <RateSelector
            rates={rates}
            selectedRateId={rateId}
            recommendedRateId={recommendedRateId}
            onRateSelect={setRateId}
          />

          {/* Revenue Calculator */}
          <RevenueCalculator
            miles={miles}
            rpm={rpm}
            revenue={totalRevenue}
            onMilesChange={setMiles}
            onRpmChange={setRpm}
            onRevenueChange={setTotalRevenue}
          />

          {/* Stop Manager */}
          <StopManager stops={stops} onStopsChange={setStops} />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !selectedOrder || !driverId || !unitId || !rateId}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              "Booking Trip..."
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Book Trip
              </>
            )}
          </Button>

          {message && (
            <div className={`rounded-lg border p-3 text-sm ${
              message.type === "success" 
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/30 bg-rose-500/10 text-rose-400"
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Right: Margin Calculator with Guardrails */}
        <div className="space-y-4">
          <MarginCalculator
            revenue={totalRevenue}
            totalCost={totalCost}
            totalCpm={totalCpm}
            miles={miles}
          />

          {/* Cost Summary Card */}
          <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h3 className="mb-3 text-sm font-semibold text-neutral-200">Cost Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Total CPM</span>
                <span className="font-medium text-white">${totalCpm.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Miles</span>
                <span className="font-medium text-white">{miles.toFixed(1)}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-neutral-400">Total Cost</span>
                <span className="font-semibold text-white">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Revenue</span>
                <span className="font-semibold text-emerald-400">${totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="font-medium text-neutral-200">Profit</span>
                <span className={`font-bold ${
                  totalRevenue - totalCost > 0 ? "text-emerald-400" : "text-rose-400"
                }`}>
                  ${(totalRevenue - totalCost).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      </form>
    </div>
  );
}
