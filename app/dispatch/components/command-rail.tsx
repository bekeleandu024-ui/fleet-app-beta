"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  Building2,
  User,
  Users,
  MapPin,
  Package,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  Layers,
  Send,
  Award,
  AlertCircle,
  TrendingUp,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  DollarSign,
  Zap,
  BarChart3,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import type {
  DispatchOrder,
  DraftTrip,
  Driver,
  CarrierBid,
} from "@/lib/stores/dispatch-store";

// ============================================================================
// TYPES
// ============================================================================

type SelectionMode = "none" | "orders" | "trip";

interface CommandRailProps {
  // Selection state
  selectedOrders: DispatchOrder[];
  selectedTrip: DraftTrip | null;
  selectionMode: SelectionMode;

  // Available resources
  drivers: Driver[];
  brokerageOrders: DispatchOrder[];
  bids: CarrierBid[];

  // Stats for summary
  totalOrders: number;
  highPriorityCount: number;
  totalRevenue: number;

  // Actions
  onCreateTrip: (orderIds: string[]) => void;
  onDeleteTrip: (tripId: string) => void;
  onAssignToDriver: (tripId: string, driverId: string) => Promise<void>;
  onKickToBrokerage: (tripId: string) => Promise<void>;
  onPostToCarriers: (orderId: string) => Promise<void>;
  onAwardBid: (orderId: string, bidId: string) => Promise<void>;
  onClearSelection: () => void;
}

// ============================================================================
// DISPATCH SUMMARY (Scenario A - Nothing Selected)
// ============================================================================

function DispatchSummary({
  totalOrders,
  highPriorityCount,
  totalRevenue,
}: {
  totalOrders: number;
  highPriorityCount: number;
  totalRevenue: number;
}) {
  return (
    <div className="p-3 space-y-2">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-2">
        <h3 className="text-sm font-bold text-zinc-100">Dispatch Summary</h3>
        <p className="text-[10px] text-zinc-500">Today's overview</p>
      </div>

      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2">
          <div className="flex items-center gap-1 text-zinc-500 mb-0.5">
            <Package className="h-3 w-3" />
            <span className="text-[10px] font-medium uppercase">Orders</span>
          </div>
          <div className="text-lg font-bold text-zinc-100">{totalOrders}</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2">
          <div className="flex items-center gap-1 text-amber-500 mb-0.5">
            <AlertCircle className="h-3 w-3" />
            <span className="text-[10px] font-medium uppercase">Priority</span>
          </div>
          <div className="text-lg font-bold text-amber-400">{highPriorityCount}</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2">
          <div className="flex items-center gap-1 text-emerald-500 mb-0.5">
            <TrendingUp className="h-3 w-3" />
            <span className="text-[10px] font-medium uppercase">Pipeline</span>
          </div>
          <div className="text-lg font-bold text-emerald-400">${(totalRevenue / 1000).toFixed(0)}K</div>
        </div>
      </div>

      {/* Quick Tips - Compact */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded p-2">
        <h4 className="text-xs font-semibold text-blue-400 mb-1">Quick Start</h4>
        <ul className="space-y-0.5 text-[10px] text-zinc-400">
          <li>• Click rows to select orders for trip planning</li>
          <li>• Multi-select with checkboxes to consolidate</li>
          <li>• Click a trip row to view assignment options</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// PLANNING MODE (Scenario B - Orders Selected)
// ============================================================================

function PlanningMode({
  selectedOrders,
  drivers,
  onCreateTrip,
  onAssignToDriver,
  onClearSelection,
}: {
  selectedOrders: DispatchOrder[];
  drivers: Driver[];
  onCreateTrip: (orderIds: string[]) => void;
  onAssignToDriver: (tripId: string, driverId: string) => Promise<void>;
  onClearSelection: () => void;
}) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Calculate totals
  const totalWeight = useMemo(
    () => selectedOrders.reduce((sum, o) => sum + (o.totalWeightLbs || 0), 0),
    [selectedOrders]
  );
  const totalRevenue = useMemo(
    () => selectedOrders.reduce((sum, o) => sum + (o.quotedRate || 0), 0),
    [selectedOrders]
  );

  const handleCreateTrip = () => {
    onCreateTrip(selectedOrders.map((o) => o.id));
  };

  const handleQuickAssign = async () => {
    if (!selectedDriverId) return;
    setIsAssigning(true);
    try {
      // First create the trip, then immediately assign
      // For now, we'll just create the trip - assignment happens in Execution Mode
      onCreateTrip(selectedOrders.map((o) => o.id));
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="p-3 space-y-2">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Planning Mode</h3>
            <p className="text-[10px] text-blue-400">
              {selectedOrders.length} order{selectedOrders.length !== 1 ? "s" : ""} selected
            </p>
          </div>
          <Button
            size="sm"
            variant="plain"
            onClick={onClearSelection}
            className="text-zinc-500 hover:text-zinc-300 h-6 w-6 p-0"
          >
            <XCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Selection Summary - Inline */}
      <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/20 rounded px-2 py-1.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-500 uppercase">Weight:</span>
          <span className="text-xs font-bold text-zinc-100">{Math.round(totalWeight / 1000)}K lbs</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-500 uppercase">Rev:</span>
          <span className="text-xs font-bold text-emerald-400">${totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Selected Orders List - Compact */}
      <div className="space-y-1 max-h-[150px] overflow-y-auto">
        {selectedOrders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between px-2 py-1 bg-zinc-900/50 rounded border border-zinc-800"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold text-zinc-100">#{order.orderNumber}</span>
              <span className="text-[10px] text-zinc-500 truncate max-w-[80px]">{order.customerName}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">
              ${order.quotedRate?.toLocaleString() || "—"}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2 border-t border-zinc-800">
        {/* Create Trip Button */}
        <Button
          className="w-full h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white"
          onClick={handleCreateTrip}
        >
          <Layers className="h-3.5 w-3.5 mr-1.5" />
          Create Trip ({selectedOrders.length})
        </Button>

        {/* Quick Assign Section */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-medium text-zinc-500 uppercase">Quick Assign</label>
          <Select 
            value={selectedDriverId} 
            onChange={(e) => setSelectedDriverId(e.target.value)}
            placeholder="Select driver..."
            className="bg-zinc-900 border-zinc-700 h-8 text-xs"
          >
            {drivers.map((driver) => (
              <option key={driver.driverId} value={driver.driverId}>
                {driver.driverName}{driver.unitNumber && ` (${driver.unitNumber})`}
              </option>
            ))}
          </Select>
          <Button
            className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={!selectedDriverId || isAssigning}
            onClick={handleQuickAssign}
          >
            <Truck className="h-3.5 w-3.5 mr-1.5" />
            {isAssigning ? "Assigning..." : "Create & Assign"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXECUTION MODE (Scenario C - Trip Selected)
// ============================================================================

// Simulation Result Types (matches actual API response)
interface SimulationScenario {
  type: string;
  feasible: boolean;
  feasibility_reason?: string;
  total_cost: number;
  margin_vs_market: number;
  margin_percent: number;
  recommendation: string;
  cost_breakdown: {
    deadhead_miles: number;
    deadhead_cost: number;
    linehaul_miles: number;
    linehaul_cost: number;
    fuel_cost: number;
    driver_cost: number;
    fixed_daily_cost: number;
    accessorial_cost: number;
    total: number;
  };
  resource_match: {
    driver: { id: string; name: string; category: string; hos_hours_remaining: string } | null;
    local_driver?: { id: string; name: string; hos_hours_remaining: string } | null;
    unit: { id: string; number: string; configuration: string; current_location: string } | null;
    trailer?: { id: string; number: string; type: string; location: string } | null;
  };
}

interface SimulationResult {
  trip_id: string;
  generated_at: string;
  market_analysis: {
    provider: string;
    lane: string;
    market_rate_avg: number;
    total_market_rate: number;
    target_buy_rate: number;
    fuel_surcharge: number;
  };
  internal_simulation: {
    total_trip_distance: number;
    estimated_drive_time_hours: number;
    scenarios: SimulationScenario[];
  };
  recommendation: {
    decision: 'FLEET' | 'BROKERAGE';
    preferred_scenario: string | null;
    savings_vs_market: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reasoning: string[];
  };
}

function ExecutionMode({
  trip,
  drivers,
  brokerageOrders,
  bids,
  onDeleteTrip,
  onAssignToDriver,
  onKickToBrokerage,
  onPostToCarriers,
  onAwardBid,
  onClearSelection,
}: {
  trip: DraftTrip;
  drivers: Driver[];
  brokerageOrders: DispatchOrder[];
  bids: CarrierBid[];
  onDeleteTrip: (tripId: string) => void;
  onAssignToDriver: (tripId: string, driverId: string) => Promise<void>;
  onKickToBrokerage: (tripId: string) => Promise<void>;
  onPostToCarriers: (orderId: string) => Promise<void>;
  onAwardBid: (orderId: string, bidId: string) => Promise<void>;
  onClearSelection: () => void;
}) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"fleet" | "brokerage">("fleet");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);

  // Run simulation when trip changes
  useEffect(() => {
    async function runSimulation() {
      if (!trip || trip.orders.length === 0) return;
      
      setIsSimulating(true);
      try {
        // Build route from trip orders
        const firstOrder = trip.orders[0];
        const lastOrder = trip.orders[trip.orders.length - 1];
        
        // Build route array with PICKUP and DROP stops
        const route = [
          {
            type: 'PICKUP',
            location_id: firstOrder.id,
            city: firstOrder.pickupLocation || 'Origin',
          },
          {
            type: 'DROP',
            location_id: lastOrder.id,
            city: lastOrder.dropoffLocation || 'Destination',
          }
        ];
        
        const response = await fetch('/api/dispatch/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trip_id: trip.id,
            trip_requirements: {
              equipment_type: trip.equipmentType || 'Dry Van',
              weight: trip.totalWeightLbs || 40000,
            },
            route
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setSimulation(data);
        } else {
          console.error('Simulation failed:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Simulation error:', error);
      } finally {
        setIsSimulating(false);
      }
    }
    
    runSimulation();
  }, [trip]);

  const handleAssign = async () => {
    if (!selectedDriverId) return;
    setIsAssigning(true);
    try {
      await onAssignToDriver(trip.id, selectedDriverId);
      onClearSelection();
    } finally {
      setIsAssigning(false);
    }
  };

  const handleKickToBrokerage = async () => {
    setIsAssigning(true);
    try {
      await onKickToBrokerage(trip.id);
      onClearSelection();
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDelete = () => {
    onDeleteTrip(trip.id);
    onClearSelection();
  };

  // Get scenarios from simulation (nested in internal_simulation)
  const scenarios = simulation?.internal_simulation?.scenarios || [];
  const preferredScenario = scenarios.find(s => s.recommendation === 'PREFERRED');
  const bestFleetScenario = scenarios.find(s => s.feasible && s.type !== 'BROKERAGE');

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex-none px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-violet-400" />
            <h3 className="text-sm font-bold text-zinc-100">{trip.tripNumber}</h3>
            <span className="text-[10px] text-violet-400">Execution</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              size="sm"
              variant="plain"
              onClick={handleDelete}
              className="text-zinc-500 hover:text-red-400 h-6 w-6 p-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="plain"
              onClick={onClearSelection}
              className="text-zinc-500 hover:text-zinc-300 h-6 w-6 p-0"
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Trip Summary - Compact inline */}
      <div className="flex-none px-3 py-2 border-b border-zinc-800 bg-zinc-900/30">
        <div className="flex items-center justify-between text-center">
          <div>
            <div className="text-[10px] text-zinc-500">Orders</div>
            <div className="text-sm font-bold text-zinc-100">{trip.orders.length}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500">Weight</div>
            <div className="text-sm font-bold text-zinc-100">{Math.round(trip.totalWeightLbs / 1000)}K</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500">Revenue</div>
            <div className="text-sm font-bold text-emerald-400">${(trip.projectedRevenue / 1000).toFixed(1)}K</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500">Margin</div>
            <div className={cn("text-sm font-bold", trip.projectedMargin > 0 ? "text-emerald-400" : "text-red-400")}>
              ${(trip.projectedMargin / 1000).toFixed(1)}K
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Analysis Banner */}
      {isSimulating ? (
        <div className="flex-none px-3 py-2 border-b border-zinc-800 bg-violet-500/5">
          <div className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />
            <span className="text-xs text-violet-400">Running cost simulation...</span>
          </div>
        </div>
      ) : simulation?.recommendation ? (
        <div className={cn(
          "flex-none px-3 py-2 border-b",
          simulation.recommendation.decision === 'FLEET' 
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-amber-500/10 border-amber-500/20"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className={cn(
                "h-3.5 w-3.5",
                simulation.recommendation.decision === 'FLEET' ? "text-emerald-400" : "text-amber-400"
              )} />
              <span className={cn(
                "text-xs font-bold",
                simulation.recommendation.decision === 'FLEET' ? "text-emerald-400" : "text-amber-400"
              )}>
                {simulation.recommendation.decision === 'FLEET' ? 'Fleet Recommended' : 'Consider Brokerage'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500">Savings: </span>
              <span className={cn(
                "text-xs font-bold",
                simulation.recommendation.savings_vs_market > 0 ? "text-emerald-400" : "text-red-400"
              )}>
                ${Math.abs(simulation.recommendation.savings_vs_market).toFixed(0)}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">{simulation.recommendation.reasoning?.join(' • ') || ''}</p>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex-none px-3 pt-2">
        <Tabs
          value={selectedTab}
          onValueChange={(v) => setSelectedTab(v as "fleet" | "brokerage")}
        >
          <TabsList className="w-full h-7">
            <TabsTrigger value="fleet" className="flex-1 text-xs h-6">
              <Truck className="h-3 w-3 mr-1" />
              Fleet
              {bestFleetScenario && (
                <Badge className="ml-1 text-[8px] px-1 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  ${bestFleetScenario.total_cost.toFixed(0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="brokerage" className="flex-1 text-xs h-6">
              <Building2 className="h-3 w-3 mr-1" />
              Brokerage
              {simulation?.market_analysis && (
                <Badge className="ml-1 text-[8px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">
                  ${simulation.market_analysis.total_market_rate.toFixed(0)}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col min-h-0 p-3 overflow-hidden">
        {selectedTab === "fleet" ? (
          <div className="flex flex-col h-full gap-2 overflow-hidden">
            {/* Scenario Comparison - Show if simulation exists */}
            {scenarios.length > 0 && (
              <div className="flex-none space-y-1">
                <label className="text-[10px] font-medium text-zinc-500 uppercase">Fleet Scenarios</label>
                <div className="space-y-1">
                  {scenarios
                    .filter(s => s.type !== 'BROKERAGE' && s.feasible)
                    .map((scenario) => (
                      <div
                        key={scenario.type}
                        className={cn(
                          "px-2 py-1.5 rounded border",
                          scenario.recommendation === 'PREFERRED' 
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : "border-zinc-800 bg-zinc-900/50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {scenario.recommendation === 'PREFERRED' && <CheckCircle className="h-3 w-3 text-emerald-400" />}
                            <span className="text-[10px] font-medium text-zinc-200">{scenario.type.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-zinc-100">${scenario.total_cost.toFixed(0)}</span>
                            <span className={cn(
                              "text-[10px] ml-1",
                              scenario.margin_percent > 25 ? "text-emerald-400" : "text-amber-400"
                            )}>
                              {scenario.margin_percent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        {scenario.resource_match.driver && (
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            Driver: {scenario.resource_match.driver.name}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Driver List - Compact */}
            <div className="flex-1 flex flex-col min-h-0 gap-1 overflow-hidden">
              <label className="text-[10px] font-medium text-zinc-500 uppercase flex-none">Available Drivers</label>
              <div className="space-y-1 overflow-y-auto pr-1 flex-1">
                {drivers.length === 0 ? (
                  <div className="text-center py-4 text-zinc-500">
                    <Users className="h-6 w-6 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">No drivers available</p>
                  </div>
                ) : (
                  drivers.map((driver) => (
                    <div
                      key={driver.driverId}
                      onClick={() => setSelectedDriverId(driver.driverId)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded border cursor-pointer transition-colors",
                        selectedDriverId === driver.driverId
                          ? "border-emerald-500/50 bg-emerald-500/10"
                          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                      )}
                    >
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <User className="h-3 w-3 text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-zinc-200 truncate">{driver.driverName}</div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {driver.unitNumber ? `#${driver.unitNumber}` : "No unit"}
                          {driver.driverCategory && ` • ${driver.driverCategory}`}
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          driver.status === "Available" || driver.status === "Off Duty"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        )}
                      >
                        {driver.status?.slice(0, 6) || "Avail"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Assign Button */}
            <Button
              className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex-none"
              disabled={!selectedDriverId || isAssigning}
              onClick={handleAssign}
            >
              <Truck className="h-3.5 w-3.5 mr-1.5" />
              {isAssigning ? "Assigning..." : "Assign to Driver"}
            </Button>
          </div>
        ) : (
          <div className="h-full overflow-y-auto space-y-2">
            {/* Market Rate Info */}
            {simulation?.market_analysis && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-zinc-500 uppercase">Market Rate</span>
                  <Badge className="text-[8px] bg-zinc-700 text-zinc-300 border-zinc-600">
                    {simulation.market_analysis.provider}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-amber-400">
                      ${simulation.market_analysis.total_market_rate.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-zinc-500 ml-1">
                      (${(simulation.market_analysis.market_rate_avg / (simulation.internal_simulation?.total_trip_distance || 1)).toFixed(2)}/mi)
                    </span>
                  </div>
                  <div className="text-right text-[10px] text-zinc-500">
                    {simulation.internal_simulation?.total_trip_distance?.toFixed(0) || '?'} miles
                  </div>
                </div>
              </div>
            )}

            {/* Kick to Brokerage - Compact */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded p-2">
              <h4 className="text-xs font-semibold text-amber-400 mb-1">Move to Brokerage</h4>
              <p className="text-[10px] text-zinc-400 mb-2">Transfer for external carrier coverage.</p>
              <Button
                className="w-full h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isAssigning}
                onClick={handleKickToBrokerage}
              >
                <Building2 className="h-3.5 w-3.5 mr-1.5" />
                {isAssigning ? "Processing..." : "Kick to Brokerage"}
              </Button>
            </div>

            {/* Bid Board Preview - Compact */}
            {brokerageOrders.length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-zinc-500 uppercase">Active Brokerage</label>
                {brokerageOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between px-2 py-1.5 bg-zinc-900/50 rounded border border-zinc-800"
                  >
                    <div>
                      <span className="font-mono text-[10px] font-bold text-zinc-100">#{order.orderNumber}</span>
                      <span className="text-[10px] text-zinc-500 ml-1">{order.bidCount} bids</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-amber-400">${order.quotedRate?.toLocaleString() || "—"}</span>
                      {order.lowestBid && <span className="text-[10px] text-emerald-400 ml-1">Low: ${order.lowestBid.toLocaleString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Orders in Trip - Compact */}
      <div className="flex-none px-3 py-2 border-t border-zinc-800 bg-zinc-900/30">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-medium text-zinc-500 uppercase">Trip Orders</label>
          <span className="text-[10px] text-zinc-500">{trip.orders.length}</span>
        </div>
        <div className="space-y-0.5 max-h-[100px] overflow-y-auto">
          {trip.orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between px-1.5 py-1 bg-zinc-900 rounded text-[10px]"
            >
              <span className="font-mono text-zinc-200">#{order.orderNumber}</span>
              <span className="text-zinc-500 truncate ml-1">{order.customerName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMMAND RAIL COMPONENT
// ============================================================================

export function CommandRail({
  selectedOrders,
  selectedTrip,
  selectionMode,
  drivers,
  brokerageOrders,
  bids,
  totalOrders,
  highPriorityCount,
  totalRevenue,
  onCreateTrip,
  onDeleteTrip,
  onAssignToDriver,
  onKickToBrokerage,
  onPostToCarriers,
  onAwardBid,
  onClearSelection,
}: CommandRailProps) {
  // Render based on selection mode
  if (selectionMode === "trip" && selectedTrip) {
    return (
      <ExecutionMode
        trip={selectedTrip}
        drivers={drivers}
        brokerageOrders={brokerageOrders}
        bids={bids}
        onDeleteTrip={onDeleteTrip}
        onAssignToDriver={onAssignToDriver}
        onKickToBrokerage={onKickToBrokerage}
        onPostToCarriers={onPostToCarriers}
        onAwardBid={onAwardBid}
        onClearSelection={onClearSelection}
      />
    );
  }

  if (selectionMode === "orders" && selectedOrders.length > 0) {
    return (
      <PlanningMode
        selectedOrders={selectedOrders}
        drivers={drivers}
        onCreateTrip={onCreateTrip}
        onAssignToDriver={onAssignToDriver}
        onClearSelection={onClearSelection}
      />
    );
  }

  // Default: Summary view
  return (
    <DispatchSummary
      totalOrders={totalOrders}
      highPriorityCount={highPriorityCount}
      totalRevenue={totalRevenue}
    />
  );
}
