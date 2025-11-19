"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Package, Truck, MapPin, Plus, X, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Order {
  id: string;
  customer: string;
  origin: string;
  destination: string;
  requiredTruck: string;
  puWindowStart: string;
  delWindowStart: string;
  notes?: string;
  status: string;
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

interface Rate {
  id: string;
  type: string;
  zone: string;
  fixedCPM: number;
  wageCPM: number;
  addOnsCPM: number;
  fuelCPM: number;
  truckMaintCPM: number;
  trailerMaintCPM: number;
  rollingCPM: number;
}

interface TripStop {
  id: string;
  stopType: string;
  name: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal: string;
  scheduledAt: string;
  lat?: number;
  lon?: number;
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
  const [rates, setRates] = useState<Rate[]>([]);
  
  // Form state
  const [driverId, setDriverId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [unitId, setUnitId] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [rateId, setRateId] = useState("");
  const [tripType, setTripType] = useState("");
  const [tripZone, setTripZone] = useState("");
  const [miles, setMiles] = useState("");
  const [rpm, setRpm] = useState("");
  const [totalRevenue, setTotalRevenue] = useState("");
  const [fuelSurcharge, setFuelSurcharge] = useState("");
  const [addOns, setAddOns] = useState("");
  const [stops, setStops] = useState<TripStop[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch data
  useEffect(() => {
    Promise.all([
      fetch("/api/orders?status=Qualified").then(r => r.json()),
      fetch("/api/drivers?active=true").then(r => r.json()),
      fetch("/api/units?active=true&isOnHold=false").then(r => r.json()),
      fetch("/api/rates").then(r => r.json()),
    ]).then(([ordersData, driversData, unitsData, ratesData]) => {
      setOrders(ordersData);
      setDrivers(driversData);
      setUnits(unitsData);
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
            name: order.origin,
            street: "",
            city: "",
            state: "",
            country: "US",
            postal: "",
            scheduledAt: order.puWindowStart,
          },
          {
            id: "delivery",
            stopType: "Delivery",
            name: order.destination,
            street: "",
            city: "",
            state: "",
            country: "US",
            postal: "",
            scheduledAt: order.delWindowStart,
          },
        ]);
      }
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

  // Sync rate details when selected
  useEffect(() => {
    const rate = rates.find(r => r.id === rateId);
    if (rate) {
      setTripType(rate.type);
      setTripZone(rate.zone);
      setRpm(String(rate.fixedCPM + rate.wageCPM + rate.addOnsCPM));
    }
  }, [rateId, rates]);

  // Calculate linked RPM ↔ Total Revenue
  const handleRpmChange = (value: string) => {
    setRpm(value);
    const m = parseFloat(miles) || 0;
    const r = parseFloat(value) || 0;
    if (m > 0 && r > 0) {
      setTotalRevenue(String((m * r).toFixed(2)));
    }
  };

  const handleRevenueChange = (value: string) => {
    setTotalRevenue(value);
    const m = parseFloat(miles) || 0;
    const rev = parseFloat(value) || 0;
    if (m > 0 && rev > 0) {
      setRpm(String((rev / m).toFixed(2)));
    }
  };

  // Calculate totals
  const selectedRate = rates.find(r => r.id === rateId);
  const totalCpm = selectedRate 
    ? selectedRate.fixedCPM + selectedRate.wageCPM + selectedRate.addOnsCPM + selectedRate.fuelCPM + selectedRate.truckMaintCPM + selectedRate.trailerMaintCPM + selectedRate.rollingCPM
    : 0;
  const totalCost = (parseFloat(miles) || 0) * totalCpm + parseFloat(fuelSurcharge || "0") + parseFloat(addOns || "0");
  const revenue = parseFloat(totalRevenue) || 0;
  const projectedMargin = revenue > 0 ? ((revenue - totalCost) / revenue * 100).toFixed(1) : "0";
  const marginColor = parseFloat(projectedMargin) >= 15 ? "text-emerald-400" : parseFloat(projectedMargin) >= 8 ? "text-amber-400" : "text-rose-400";

  const addStop = () => {
    setStops([...stops, {
      id: `stop-${Date.now()}`,
      stopType: "Other",
      name: "",
      street: "",
      city: "",
      state: "",
      country: "US",
      postal: "",
      scheduledAt: "",
    }]);
  };

  const removeStop = (id: string) => {
    if (stops.length > 1) {
      setStops(stops.filter(s => s.id !== id));
    }
  };

  const updateStop = (id: string, field: keyof TripStop, value: any) => {
    setStops(stops.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !driverId || !unitId) {
      setMessage({ type: "error", text: "Please select an order, driver, and unit" });
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
          tripType,
          tripZone,
          miles: parseFloat(miles),
          rpm: parseFloat(rpm),
          fuelSurcharge: parseFloat(fuelSurcharge || "0"),
          addOns: parseFloat(addOns || "0"),
          totalCpm,
          total: totalCost,
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

  const recommendedDriver = drivers.find(d => d.recommended);
  const recommendedUnit = units.find(u => u.recommended);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-semibold text-white">Trip Booking Control Center</h1>

      {/* Order Snapshot */}
      {selectedOrder ? (
        <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-lg shadow-black/40">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-neutral-200">{selectedOrder.customer}</p>
              <p className="text-xs text-neutral-400">{selectedOrder.origin} → {selectedOrder.destination}</p>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">Pickup Window</p>
              <p className="text-xs text-white">{new Date(selectedOrder.puWindowStart).toLocaleString()}</p>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">Delivery Window</p>
              <p className="text-xs text-white">{new Date(selectedOrder.delWindowStart).toLocaleString()}</p>
            </div>
            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-200">
              {selectedOrder.requiredTruck}
            </span>
          </div>
          {selectedOrder.notes && (
            <p className="mt-3 text-xs text-neutral-400">{selectedOrder.notes}</p>
          )}
        </Card>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 p-5 text-center text-sm text-neutral-400">
          Select an order from the right panel to begin booking
        </div>
      )}

      {/* Three Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[320px,1fr,320px]">
        {/* Left: AI Recommendation */}
        <div className="space-y-4">
          {recommendedDriver && recommendedUnit ? (
            <Card className="rounded-xl border border-emerald-800/50 bg-neutral-900/60 p-4 shadow-lg shadow-black/40">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-neutral-200">AI Booking Recommendation</h2>
              </div>
              {parseFloat(projectedMargin) < 10 && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span className="text-xs font-medium text-rose-200">Guardrail Breach: Margin below 10%</span>
                </div>
              )}
              
              <div className="grid gap-3">
                <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-emerald-400">Recommended Driver</p>
                  <p className="mt-1 text-sm font-medium text-white">{recommendedDriver.name}</p>
                  <p className="text-xs text-neutral-400">{recommendedDriver.homeBase} • {recommendedDriver.hoursAvailableToday}h available</p>
                </div>

                <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-amber-400">Recommended Unit</p>
                  <p className="mt-1 text-sm font-medium text-white">{recommendedUnit.code}</p>
                  <p className="text-xs text-neutral-400">{recommendedUnit.type} • {recommendedUnit.status}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-medium text-neutral-300">Why this assignment?</p>
                <p className="text-xs text-neutral-400">
                  Best margin potential with available resources. Driver has excellent on-time score and unit is positioned near pickup.
                </p>
              </div>
            </Card>
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 p-5 text-sm text-neutral-400">
              No AI recommendation available
            </div>
          )}
        </div>

        {/* Center: Trip Assignment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-lg shadow-black/40">
            <h2 className="mb-4 text-sm font-semibold text-neutral-200">Trip Assignment</h2>
            
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">Driver</label>
                <select
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  required
                >
                  <option value="">Select driver...</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">Driver Name</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  readOnly
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">Unit</label>
                <select
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  required
                >
                  <option value="">Select unit...</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.code}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">Unit Code</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  value={unitCode}
                  readOnly
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">Rate</label>
                <select
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  value={rateId}
                  onChange={(e) => setRateId(e.target.value)}
                  required
                >
                  <option value="">Select rate...</option>
                  {rates.map(r => (
                    <option key={r.id} value={r.id}>{r.type} - {r.zone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">Trip Type</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  value={tripType}
                  readOnly
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">Trip Zone</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  value={tripZone}
                  readOnly
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">Miles</label>
                <input
                  type="number"
                  step="0.1"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  value={miles}
                  onChange={(e) => setMiles(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">Quoted RPM</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  value={rpm}
                  onChange={(e) => handleRpmChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">Total Revenue</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  value={totalRevenue}
                  onChange={(e) => handleRevenueChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">Fuel Surcharge</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  value={fuelSurcharge}
                  onChange={(e) => setFuelSurcharge(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">Add-ons</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  value={addOns}
                  onChange={(e) => setAddOns(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500">Total Cost CPM</p>
                <p className="mt-1 text-lg font-semibold text-white">${totalCpm.toFixed(2)}</p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500">Total Cost</p>
                <p className="mt-1 text-lg font-semibold text-white">${totalCost.toFixed(2)}</p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500">Projected RPM</p>
                <p className="mt-1 text-lg font-semibold text-white">${rpm || "0.00"}</p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500">Projected Margin</p>
                <p className={`mt-1 text-lg font-semibold ${marginColor}`}>{projectedMargin}%</p>
              </div>
            </div>
          </Card>

          {/* Dispatch Overrides - Stop Manager */}
          <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-lg shadow-black/40">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-200">Dispatch Overrides - Stops</h2>
              <Button
                type="button"
                size="sm"
                variant="subtle"
                onClick={addStop}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Stop
              </Button>
            </div>

            <div className="space-y-3">
              {stops.map((stop, idx) => (
                <div key={stop.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-400">Stop {idx + 1}</span>
                    {stops.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStop(stop.id)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <label className="text-[11px] uppercase tracking-wide text-white/60">Stop Type</label>
                      <select
                        className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                        value={stop.stopType}
                        onChange={(e) => updateStop(stop.id, "stopType", e.target.value)}
                      >
                        <option value="Pickup">Pickup</option>
                        <option value="Delivery">Delivery</option>
                        <option value="Drop & Hook">Drop & Hook</option>
                        <option value="Border">Border</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-wide text-white/60">Location Name</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                        value={stop.name}
                        onChange={(e) => updateStop(stop.id, "name", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-wide text-white/60">City</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                        value={stop.city}
                        onChange={(e) => updateStop(stop.id, "city", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-wide text-white/60">State</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                        value={stop.state}
                        onChange={(e) => updateStop(stop.id, "state", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[11px] uppercase tracking-wide text-white/60">Scheduled Time</label>
                      <input
                        type="datetime-local"
                        className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                        value={stop.scheduledAt ? new Date(stop.scheduledAt).toISOString().slice(0, 16) : ""}
                        onChange={(e) => updateStop(stop.id, "scheduledAt", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !selectedOrder}
            className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-70"
          >
            {isSubmitting ? "Booking Trip..." : "Book Trip"}
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
        </form>

        {/* Right: Orders & Crew */}
        <div className="space-y-4">
          {/* Qualified Orders */}
          <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-lg shadow-black/40">
            <h2 className="mb-3 text-sm font-semibold text-neutral-200">Qualified Orders</h2>
            <div className="space-y-2">
              {orders.length > 0 ? (
                orders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => router.push(`/book?orderId=${order.id}`)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedOrder?.id === order.id
                        ? "border-emerald-500/50 bg-emerald-950/30"
                        : "border-white/10 bg-black/20 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{order.customer}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        selectedOrder?.id === order.id
                          ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200"
                          : "border-white/20 text-neutral-400"
                      }`}>
                        {selectedOrder?.id === order.id ? "In Focus" : "Qualified"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-400">{order.origin} → {order.destination}</p>
                    <p className="mt-1 text-xs text-neutral-500">{order.requiredTruck}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 p-5 text-center text-sm text-neutral-400">
                  No qualified orders
                </div>
              )}
            </div>
          </Card>

          {/* Crew Lineup */}
          <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-lg shadow-black/40">
            <h2 className="mb-3 text-sm font-semibold text-neutral-200">Crew Lineup</h2>
            
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wide text-neutral-500">Drivers</p>
                <div className="space-y-2">
                  {drivers.slice(0, 3).map(driver => (
                    <div
                      key={driver.id}
                      className={`rounded-lg border p-2 ${
                        driver.recommended
                          ? "border-emerald-500/50 bg-emerald-950/30"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <p className="text-sm font-medium text-white">{driver.name}</p>
                      <p className="text-xs text-neutral-400">{driver.homeBase} • {driver.hoursAvailableToday}h avail</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wide text-neutral-500">Units</p>
                <div className="space-y-2">
                  {units.slice(0, 3).map(unit => (
                    <div
                      key={unit.id}
                      className={`rounded-lg border p-2 ${
                        unit.recommended
                          ? "border-amber-500/50 bg-amber-950/30"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <p className="text-sm font-medium text-white">{unit.code}</p>
                      <p className="text-xs text-neutral-400">{unit.type} • {unit.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
