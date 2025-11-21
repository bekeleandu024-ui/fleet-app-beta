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

  // Update revenue when miles or rate changes
  useEffect(() => {
    if (rateId && miles > 0) {
      const rate = rates.find(r => r.id === rateId);
      if (rate) {
        const calculatedRpm = rate.total_cpm * 1.05; // 5% margin
        setRpm(calculatedRpm);
        setTotalRevenue(miles * calculatedRpm);
      }
    }
  }, [rateId, miles, rates]);

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
      const tripId = trip?.id || trip?.tripId || "new trip";
      const displayId = typeof tripId === "string" ? tripId.substring(0, 8) : tripId;
      setMessage({ type: "success", text: `Trip ${displayId} booked successfully!` });
      
      setTimeout(() => router.push("/trips"), 1500);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to book trip" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">Trip Booking Control Center</h1>
        <p className="text-sm text-neutral-400">Prioritize qualified freight, confirm resources, and launch the trip without leaving the console.</p>
      </div>

      {/* Compact Order Snapshot */}
      {selectedOrder ? (
        <Card className="relative rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Customer</p>
                <p className="text-sm font-semibold text-white">{selectedOrder.customer}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Route</p>
                <p className="text-xs text-neutral-300">{selectedOrder.pickup} → {selectedOrder.delivery}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Window</p>
                <p className="text-xs text-neutral-300">{selectedOrder.window}</p>
              </div>
              {selectedOrder.laneMiles && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-neutral-500">Miles</p>
                  <p className="text-xs text-neutral-300">{selectedOrder.laneMiles} mi</p>
                </div>
              )}
              {selectedOrder.commodity && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-neutral-500">Commodity</p>
                  <p className="text-xs text-neutral-300">{selectedOrder.commodity}</p>
                </div>
              )}
            </div>
            {selectedOrder.serviceLevel && (
              <span className="px-2 py-1 text-[10px] font-semibold text-white bg-slate-700 rounded">
                {selectedOrder.serviceLevel.toUpperCase()}
              </span>
            )}
          </div>
        </Card>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 p-6 text-center">
          <p className="text-sm text-neutral-400">Select a qualified order to begin booking</p>
        </div>
      )}

      {/* Three Column Layout */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-[300px,1fr,340px]">
          
          {/* LEFT COLUMN: AI Booking Recommendations */}
          <div className="space-y-4">
            <AIRecommendationPanel
              orderId={selectedOrderId}
              onApplyRecommendation={handleApplyRecommendation}
            />
          </div>

          {/* CENTER COLUMN: Dispatch Console */}
          <div className="space-y-4">
            <Card className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Dispatch Console</h3>
              
              {/* Driver & Unit */}
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

              {/* Rate Card */}
              <div className="mt-4">
                <RateSelector
                  rates={rates}
                  selectedRateId={rateId}
                  recommendedRateId={recommendedRateId}
                  onRateSelect={setRateId}
                />
              </div>

              {/* Revenue Calculator */}
              <div className="mt-4">
                <RevenueCalculator
                  miles={miles}
                  rpm={rpm}
                  revenue={totalRevenue}
                  onMilesChange={setMiles}
                  onRpmChange={setRpm}
                  onRevenueChange={setTotalRevenue}
                />
              </div>

              {/* Stop Manager */}
              <div className="mt-4">
                <StopManager stops={stops} onStopsChange={setStops} />
              </div>

              {/* Margin Summary */}
              <div className="mt-4 p-3 rounded-lg bg-neutral-950/60 border border-neutral-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-neutral-400">Revenue</span>
                  <span className="text-sm font-semibold text-emerald-400">${totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-neutral-400">Cost (${totalCpm.toFixed(2)} CPM)</span>
                  <span className="text-sm font-semibold text-white">${totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
                  <span className="text-xs font-semibold text-neutral-300">Margin</span>
                  <span className={`text-sm font-bold ${
                    totalRevenue - totalCost > 0 ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    ${(totalRevenue - totalCost).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !selectedOrder || !driverId || !unitId || !rateId}
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold"
              >
                {isSubmitting ? "Booking Trip..." : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Book Trip
                  </>
                )}
              </Button>

              {message && (
                <div className={`mt-3 rounded border p-2 text-xs ${
                  message.type === "success" 
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                }`}>
                  {message.text}
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT COLUMN: Available Resources */}
          <div className="space-y-4">
            {/* Available Orders */}
            <Card className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
              <h3 className="text-xs font-semibold text-white mb-2 uppercase tracking-wide">Available Orders</h3>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {orders.filter(o => o.status === "Qualified" || o.status === "Ready to Book").map(order => (
                  <button
                    key={order.id}
                    onClick={() => router.push(`/book?orderId=${order.id}`)}
                    className={`w-full text-left rounded p-2 transition-colors text-xs ${
                      selectedOrderId === order.id
                        ? "bg-emerald-500/20 border border-emerald-500/40"
                        : "bg-neutral-950/40 hover:bg-neutral-950/60"
                    }`}
                  >
                    <p className="font-semibold text-white mb-0.5">{order.customer}</p>
                    <p className="text-[10px] text-neutral-400">{order.pickup} → {order.delivery}</p>
                  </button>
                ))}
                {orders.filter(o => o.status === "Qualified" || o.status === "Ready to Book").length === 0 && (
                  <p className="text-xs text-neutral-500 text-center py-3">No orders available</p>
                )}
              </div>
            </Card>

            {/* Available Drivers */}
            <Card className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
              <h3 className="text-xs font-semibold text-white mb-2 uppercase tracking-wide">Available Drivers</h3>
              <div className="space-y-1.5 max-h-50 overflow-y-auto">
                {drivers.map(driver => (
                  <div
                    key={driver.id}
                    onClick={() => setDriverId(driver.id)}
                    className={`rounded p-2 cursor-pointer transition-colors ${
                      driverId === driver.id
                        ? "bg-emerald-500/20 border border-emerald-500/40"
                        : "bg-neutral-950/40 hover:bg-neutral-950/60"
                    }`}
                  >
                    <p className="text-xs font-semibold text-white">{driver.name}</p>
                    <p className="text-[10px] text-neutral-400">{driver.homeBase} • {driver.hoursAvailableToday}h avail</p>
                  </div>
                ))}
                {drivers.length === 0 && (
                  <p className="text-xs text-neutral-500 text-center py-3">No drivers available</p>
                )}
              </div>
            </Card>

            {/* Available Units */}
            <Card className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
              <h3 className="text-xs font-semibold text-white mb-2 uppercase tracking-wide">Available Units</h3>
              <div className="space-y-1.5 max-h-50 overflow-y-auto">
                {units.map(unit => (
                  <div
                    key={unit.id}
                    onClick={() => setUnitId(unit.id)}
                    className={`rounded p-2 cursor-pointer transition-colors ${
                      unitId === unit.id
                        ? "bg-emerald-500/20 border border-emerald-500/40"
                        : "bg-neutral-950/40 hover:bg-neutral-950/60"
                    }`}
                  >
                    <p className="text-xs font-semibold text-white">{unit.code}</p>
                    <p className="text-[10px] text-neutral-400">{unit.type} • {unit.status}</p>
                  </div>
                ))}
                {units.length === 0 && (
                  <p className="text-xs text-neutral-500 text-center py-3">No units available</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
