"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, CheckCircle, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AIRecommendationPanel } from "@/components/booking/ai-recommendation-panel";
import { DriverUnitSelector } from "@/components/booking/driver-unit-selector";
import { RateSelector } from "@/components/booking/rate-selector";
import { StopManager, type TripStop } from "@/components/booking/stop-manager";
import { RevenueCalculator } from "@/components/booking/revenue-calculator";
import { CostingCard } from "@/components/costing/costing-card";
import { getAllCostingOptions } from "@/lib/costing";

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
  type: string;
  zone?: string;
  recommended?: boolean;
}

interface Unit {
  id: string;
  code: string;
  type: string;
  homeBase: string;
  status: string;
  driverType?: string;
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
  const [manualRevenue, setManualRevenue] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [stops, setStops] = useState<TripStop[]>([]);
  
  // Route data
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  
  // Driver type and rate filtering
  const [driverType, setDriverType] = useState<string>("");
  const [filteredRates, setFilteredRates] = useState<RateCard[]>([]);
  
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

  // Sync driver name and type when ID changes
  useEffect(() => {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      setDriverName(driver.name);
      setDriverType(driver.type);
    }
  }, [driverId, drivers]);

  // Sync unit code when ID changes
  useEffect(() => {
    const unit = units.find(u => u.id === unitId);
    if (unit) setUnitCode(unit.code);
  }, [unitId, units]);

  // Filter rates based on driver type and distance
  useEffect(() => {
    if (!driverType || rates.length === 0) {
      setFilteredRates(rates);
      return;
    }

    // Determine rate type based on driver type
    let rateType = "";
    if (driverType === "COM" || driverType === "Company") {
      rateType = "Company Driver";
    } else if (driverType === "OO" || driverType === "Owner Operator") {
      rateType = "Owner Operator";
    } else if (driverType === "RNR" || driverType === "Rail and Ramp") {
      rateType = "Company Driver"; // Default to company for RNR
    }

    // Determine zone based on distance
    const distance = routeDistance || miles || 0;
    const zone = distance >= 500 ? "Long Haul (500+ mi)" : "Short Haul (<500mi)";

    // Filter rates
    const matchingRates = rates.filter(
      r => r.rate_type === rateType && r.zone === zone
    );

    setFilteredRates(matchingRates);

    // Auto-select the first matching rate
    if (matchingRates.length > 0 && !rateId) {
      setRateId(matchingRates[0].id);
      setRecommendedRateId(matchingRates[0].id);
    }
  }, [driverType, routeDistance, miles, rates, rateId]);

  // Fetch route data when order is selected
  useEffect(() => {
    if (!selectedOrder?.pickup || !selectedOrder?.delivery) {
      setRouteDistance(null);
      setRouteDuration(null);
      return;
    }

    const fetchRouteData = async () => {
      setRouteLoading(true);
      try {
        const response = await fetch("/api/orders/calculate-route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickup: selectedOrder.pickup,
            delivery: selectedOrder.delivery,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setRouteDistance(data.distance);
          setRouteDuration(data.duration);
          // Update miles for cost calculation
          setMiles(data.distance);
        }
      } catch (error) {
        console.error("Error fetching route data:", error);
      } finally {
        setRouteLoading(false);
      }
    };

    fetchRouteData();
  }, [selectedOrder]);

  // Update revenue when miles or rate changes (5% margin floor)
  useEffect(() => {
    const actualMiles = routeDistance || miles || 0;
    const selectedRate = rates.find(r => r.id === rateId);
    const totalCpm = selectedRate?.total_cpm || 0;
    const totalCost = actualMiles * totalCpm;

    if (rateId && actualMiles > 0 && selectedRate) {
      if (!manualRevenue) {
        // Calculate revenue with 5% margin floor
        const costWithMargin = totalCost * 1.05;
        const calculatedRpm = costWithMargin / actualMiles;
        setRpm(calculatedRpm);
        setTotalRevenue(costWithMargin);
      } else if (manualRevenue) {
        // Use manual revenue if provided
        const revenue = parseFloat(manualRevenue);
        if (!isNaN(revenue) && actualMiles > 0) {
          setTotalRevenue(revenue);
          setRpm(revenue / actualMiles);
        }
      }
    }
  }, [rateId, routeDistance, miles, rates, manualRevenue]);

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
  const actualMiles = routeDistance || miles || 0;
  const totalCost = actualMiles * totalCpm;

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
    <div className="min-h-screen bg-neutral-950 p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-white mb-1">Trip Booking Control Center</h1>
        <p className="text-sm text-neutral-400">AI-powered recommendations, dispatch console, and real-time resource availability.</p>
      </div>

      {/* Order Snapshot - Horizontal Card at Top */}
      {selectedOrder ? (
        <Card className="mb-4 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Customer</p>
                <p className="text-sm font-semibold text-white">{selectedOrder.customer}</p>
              </div>
              <div className="h-8 w-px bg-neutral-700" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Route</p>
                <p className="text-sm text-neutral-300">{selectedOrder.pickup} → {selectedOrder.delivery}</p>
              </div>
              <div className="h-8 w-px bg-neutral-700" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Pickup Window</p>
                <p className="text-sm text-neutral-300">{selectedOrder.window}</p>
              </div>
              <div className="h-8 w-px bg-neutral-700" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Distance</p>
                <p className="text-sm text-neutral-300">
                  {routeLoading ? (
                    <span className="text-neutral-500 animate-pulse">Calculating...</span>
                  ) : routeDistance ? (
                    `${routeDistance} mi`
                  ) : selectedOrder.laneMiles ? (
                    `${selectedOrder.laneMiles} mi`
                  ) : (
                    <span className="text-neutral-500">--</span>
                  )}
                </p>
              </div>
              <div className="h-8 w-px bg-neutral-700" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Duration</p>
                <p className="text-sm text-neutral-300">
                  {routeLoading ? (
                    <span className="text-neutral-500 animate-pulse">Calculating...</span>
                  ) : routeDuration ? (
                    `${routeDuration} hrs`
                  ) : selectedOrder.laneMiles ? (
                    `${Math.round(selectedOrder.laneMiles / 50)} hrs`
                  ) : (
                    <span className="text-neutral-500">--</span>
                  )}
                </p>
              </div>
              {selectedOrder.commodity && (
                <>
                  <div className="h-8 w-px bg-neutral-700" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Commodity</p>
                    <p className="text-sm text-neutral-300">{selectedOrder.commodity}</p>
                  </div>
                </>
              )}
              {driverName && unitCode && (
                <>
                  <div className="h-8 w-px bg-neutral-700" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Driver / Unit</p>
                    <p className="text-sm text-white font-semibold">{driverName} · {unitCode}</p>
                  </div>
                </>
              )}
              {driverType && (
                <>
                  <div className="h-8 w-px bg-neutral-700" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Type</p>
                    <p className="text-sm text-emerald-400 font-semibold">{driverType}</p>
                  </div>
                </>
              )}
              {rateId && actualMiles > 0 && (
                <>
                  <div className="h-8 w-px bg-neutral-700" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Total Cost</p>
                    <p className="text-sm text-rose-400 font-bold">
                      ${totalCost.toFixed(2)}
                      <span className="text-[10px] text-neutral-500 ml-1">
                        (${totalCpm.toFixed(2)} × {actualMiles} mi)
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>
            {selectedOrder.serviceLevel && (
              <span className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-700 rounded">
                {selectedOrder.serviceLevel.toUpperCase()}
              </span>
            )}
          </div>
        </Card>
      ) : (
        <div className="mb-4 rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 p-6 text-center">
          <p className="text-sm text-neutral-400">Select a qualified order from the right panel to begin booking</p>
        </div>
      )}

      {/* Driver Type Cost Comparison */}
      {selectedOrder && actualMiles > 0 && (
        <Card className="mb-4 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Driver Type Cost Comparison
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {getAllCostingOptions(
              actualMiles,
              selectedOrder.pickup || "Unknown",
              selectedOrder.delivery || "Unknown"
            ).map((option) => (
              <CostingCard
                key={option.driverType}
                driverType={option.driverType}
                label={option.label}
                cost={option.cost}
                distance={actualMiles}
                isRecommended={option.cost.total === Math.min(
                  ...getAllCostingOptions(
                    actualMiles,
                    selectedOrder.pickup || "Unknown",
                    selectedOrder.delivery || "Unknown"
                  ).map(o => o.cost.total)
                )}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Three Column Layout */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: AI Booking Recommendations */}
        <div className="col-span-3">
          <AIRecommendationPanel
            orderId={selectedOrderId}
            onApplyRecommendation={handleApplyRecommendation}
            orders={orders.filter(o => o.status === "New" || o.status === "Planning")}
            onSelectOrder={(orderId) => router.push(`/book?orderId=${orderId}`)}
          />
        </div>

        {/* CENTER COLUMN: Trip Booking Form */}
        <div className="col-span-6">
          <form onSubmit={handleSubmit}>
            <Card className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-400" />
                Trip Booking Form
              </h3>
              
              {/* Rate Card */}
              <RateSelector
                rates={filteredRates.length > 0 ? filteredRates : rates}
                selectedRateId={rateId}
                recommendedRateId={recommendedRateId}
                onRateSelect={setRateId}
              />
              
              {/* Rate Filter Info */}
              {driverType && filteredRates.length > 0 && (
                <div className="mt-2 text-xs text-neutral-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-400" />
                  <span>
                    Showing rates for {driverType} · {routeDistance || miles || 0 >= 500 ? "Long Haul" : "Short Haul"}
                  </span>
                </div>
              )}

              {/* Manual Revenue Input */}
              <div className="mt-4">
                <label className="text-xs font-medium text-neutral-400 mb-1.5 block">
                  Manual Revenue Override (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualRevenue}
                    onChange={(e) => setManualRevenue(e.target.value)}
                    placeholder={totalRevenue > 0 ? totalRevenue.toFixed(2) : "Auto-calculated (5% margin)"}
                    className="w-full pl-7 pr-3 py-2 bg-neutral-950/60 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                {!manualRevenue && totalRevenue > 0 && (
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Auto: ${totalRevenue.toFixed(2)} (5% margin on ${totalCost.toFixed(2)} cost)
                  </p>
                )}
              </div>

              {/* Trip Start Date */}
              <div className="mt-4">
                <label className="text-xs font-medium text-neutral-400 mb-1.5 block">
                  Trip Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={tripStartDate}
                  onChange={(e) => setTripStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950/60 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !selectedOrder || !driverId || !unitId || !rateId}
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold py-3"
              >
                {isSubmitting ? "Booking Trip..." : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Book Trip
                  </>
                )}
              </Button>

              {message && (
                <div className={`mt-3 rounded border p-3 text-sm ${
                  message.type === "success" 
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                }`}>
                  {message.text}
                </div>
              )}
            </Card>
          </form>
        </div>

        {/* RIGHT COLUMN: Available Resources */}
        <div className="col-span-3 space-y-3">
          
          {/* Available Orders */}
          <Card className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
            <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
              <Package className="h-3.5 w-3.5" />
              Available Orders
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {orders.filter(o => o.status === "New" || o.status === "Planning").map(order => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => router.push(`/book?orderId=${order.id}`)}
                  className={`w-full text-left rounded-lg p-2.5 transition-all text-xs border ${
                    selectedOrderId === order.id
                      ? "bg-emerald-500/20 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                      : "bg-neutral-950/50 hover:bg-neutral-800/50 border-neutral-800/50"
                  }`}
                >
                  <p className="font-bold text-white mb-1">{order.customer}</p>
                  <p className="text-[10px] text-neutral-400">{order.pickup} → {order.delivery}</p>
                  {order.window && <p className="text-[10px] text-neutral-500 mt-1">{order.window}</p>}
                </button>
              ))}
              {orders.filter(o => o.status === "New" || o.status === "Planning").length === 0 && (
                <p className="text-xs text-neutral-500 text-center py-6">No available orders</p>
              )}
            </div>
          </Card>

          {/* Available Drivers */}
          <Card className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
            <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Available Drivers
            </h3>
            <div className="space-y-1 max-h-[180px] overflow-y-auto">
              {drivers.map(driver => (
                <div
                  key={driver.id}
                  onClick={() => setDriverId(driver.id)}
                  className={`rounded p-1.5 cursor-pointer transition-all border ${
                    driverId === driver.id
                      ? "bg-emerald-500/20 border-emerald-500/50"
                      : "bg-neutral-950/50 hover:bg-neutral-800/50 border-neutral-800/50"
                  }`}
                >
                  <p className="text-[11px] font-semibold text-white leading-tight">{driver.name}</p>
                  <p className="text-[9px] text-neutral-400 mt-0.5">{driver.homeBase} • {driver.hoursAvailableToday}h</p>
                </div>
              ))}
              {drivers.length === 0 && (
                <p className="text-xs text-neutral-500 text-center py-4">No drivers available</p>
              )}
            </div>
          </Card>

          {/* Available Units */}
          <Card className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
            <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Available Units
            </h3>
            <div className="space-y-1 max-h-[180px] overflow-y-auto">
              {units.map(unit => (
                <div
                  key={unit.id}
                  onClick={() => setUnitId(unit.id)}
                  className={`rounded p-1.5 cursor-pointer transition-all border ${
                    unitId === unit.id
                      ? "bg-emerald-500/20 border-emerald-500/50"
                      : "bg-neutral-950/50 hover:bg-neutral-800/50 border-neutral-800/50"
                  }`}
                >
                  <p className="text-[11px] font-semibold text-white leading-tight">{unit.code}</p>
                  <p className="text-[9px] text-neutral-400 mt-0.5">{unit.type} • {unit.status}</p>
                </div>
              ))}
              {units.length === 0 && (
                <p className="text-xs text-neutral-500 text-center py-4">No units available</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

