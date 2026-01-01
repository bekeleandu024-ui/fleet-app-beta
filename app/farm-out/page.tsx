"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Truck,
  MapPin,
  Package,
  Clock,
  Send,
  Award,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  ArrowUpRight,
  X,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ============================================================================
// TYPES
// ============================================================================

interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerId: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string | null;
  dropoffTime: string | null;
  dispatchStatus: string;
  equipmentType: string;
  totalWeightLbs: number;
  quotedRate: number | null;
}

interface BrokerageTrip {
  id: string;
  tripNumber: string;
  orderId: string;
  orderIds: string[];
  orders: OrderSummary[];
  orderCount: number;
  tripStatus: string;
  dispatchStatus: string;
  driverId: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string | null;
  dropoffTime: string | null;
  totalRate: number;
  totalWeight: number;
  bidCount: number;
  lowestBid: number | null;
  postedToCarriers: boolean;
  postedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CarrierBid {
  id: string;
  orderId: string;
  carrierId: string | null;
  carrierName: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  mcNumber: string | null;
  bidAmount: number;
  currency: string;
  transitTimeHours: number | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "WITHDRAWN";
  isLowestCost: boolean;
  isFastest: boolean;
  receivedVia: string | null;
  receivedAt: string;
  notes: string | null;
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function FarmOutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "posted" | "covered">("pending");
  const [showBidForm, setShowBidForm] = useState(false);
  const [newBid, setNewBid] = useState({
    carrierName: "",
    bidAmount: "",
    contactPhone: "",
    mcNumber: "",
    notes: "",
  });

  // Fetch brokerage trips
  const { data: tripsData, isLoading: tripsLoading, refetch: refetchTrips } = useQuery<{
    success: boolean;
    data: BrokerageTrip[];
  }>({
    queryKey: ["farm-out-trips"],
    queryFn: async () => {
      const res = await fetch("/api/farm-out/trips");
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Get selected trip
  const trips = tripsData?.data || [];
  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  // Fetch bids for selected trip (using primary order ID)
  const { data: bidsData, refetch: refetchBids } = useQuery<{
    success: boolean;
    data: CarrierBid[];
  }>({
    queryKey: ["trip-bids", selectedTrip?.orderId],
    queryFn: async () => {
      if (!selectedTrip?.orderId) return { success: true, data: [] };
      const res = await fetch(`/api/dispatch/orders/${selectedTrip.orderId}/bids`);
      return res.json();
    },
    enabled: !!selectedTrip?.orderId,
  });

  // Mutations
  const postToCarriersMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/dispatch/orders/${orderId}/post`, { method: "POST" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm-out-trips"] });
    },
  });

  const addBidMutation = useMutation({
    mutationFn: async ({ orderId, bid }: { orderId: string; bid: typeof newBid }) => {
      const res = await fetch(`/api/dispatch/orders/${orderId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrierName: bid.carrierName,
          bidAmount: parseFloat(bid.bidAmount),
          contactPhone: bid.contactPhone || null,
          mcNumber: bid.mcNumber || null,
          notes: bid.notes || null,
          receivedVia: "MANUAL",
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-bids", selectedTrip?.orderId] });
      queryClient.invalidateQueries({ queryKey: ["farm-out-trips"] });
      setShowBidForm(false);
      setNewBid({ carrierName: "", bidAmount: "", contactPhone: "", mcNumber: "", notes: "" });
    },
  });

  const awardBidMutation = useMutation({
    mutationFn: async ({ orderId, bidId }: { orderId: string; bidId: string }) => {
      const res = await fetch(`/api/dispatch/orders/${orderId}/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm-out-trips"] });
      queryClient.invalidateQueries({ queryKey: ["trip-bids", selectedTrip?.orderId] });
    },
  });

  // Derived data
  const bids = bidsData?.data || [];
  const pendingBids = bids.filter((b) => b.status === "PENDING");

  // Filter trips by tab and search
  const filteredTrips = useMemo(() => {
    let filtered = trips;

    // Filter by tab
    if (activeTab === "pending") {
      filtered = filtered.filter((t) => t.dispatchStatus === "BROKERAGE_PENDING");
    } else if (activeTab === "posted") {
      filtered = filtered.filter((t) => t.dispatchStatus === "POSTED_EXTERNAL");
    } else if (activeTab === "covered") {
      filtered = filtered.filter((t) => t.dispatchStatus === "COVERED_EXTERNAL");
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.tripNumber?.toLowerCase().includes(q) ||
          t.pickupLocation?.toLowerCase().includes(q) ||
          t.dropoffLocation?.toLowerCase().includes(q) ||
          t.orders.some(o => 
            o.orderNumber?.toLowerCase().includes(q) ||
            o.customerName?.toLowerCase().includes(q)
          )
      );
    }

    return filtered;
  }, [trips, activeTab, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const pending = trips.filter((t) => t.dispatchStatus === "BROKERAGE_PENDING").length;
    const posted = trips.filter((t) => t.dispatchStatus === "POSTED_EXTERNAL").length;
    const covered = trips.filter((t) => t.dispatchStatus === "COVERED_EXTERNAL").length;
    const totalBids = trips.reduce((sum, t) => sum + t.bidCount, 0);
    const totalValue = trips.reduce((sum, t) => sum + t.totalRate, 0);
    return { pending, posted, covered, totalBids, totalValue };
  }, [trips]);

  // Auto-select first trip if none selected
  useEffect(() => {
    if (!selectedTripId && filteredTrips.length > 0) {
      setSelectedTripId(filteredTrips[0].id);
    }
  }, [filteredTrips, selectedTripId]);

  // Extract city from location
  const extractCity = (location: string | null): string => {
    if (!location) return "—";
    const parts = location.split(",");
    return parts[0]?.trim() || location;
  };

  // Get unique customers from trip orders
  const getTripCustomers = (trip: BrokerageTrip): string => {
    const customers = [...new Set(trip.orders.map(o => o.customerName || o.customerId || "Unknown"))];
    if (customers.length === 1) return customers[0];
    return `${customers[0]} +${customers.length - 1}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header - Compact */}
      <div className="flex-none border-b border-zinc-800 bg-zinc-950 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-amber-500/20">
                <Building2 className="h-4 w-4 text-amber-400" />
              </div>
              <h1 className="text-base font-bold text-zinc-100">Farm Out</h1>
            </div>
            
            {/* Inline Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="h-8">
                <TabsTrigger value="pending" className="text-xs h-7 px-4">
                  Pending <span className="ml-1 text-amber-400">{stats.pending}</span>
                </TabsTrigger>
                <TabsTrigger value="posted" className="text-xs h-7 px-4">
                  Posted <span className="ml-1 text-purple-400">{stats.posted}</span>
                </TabsTrigger>
                <TabsTrigger value="covered" className="text-xs h-7 px-4">
                  Covered <span className="ml-1 text-emerald-400">{stats.covered}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 h-8 pl-7 bg-zinc-900 border-zinc-700 text-xs"
              />
            </div>
            <Button
              size="sm"
              variant="subtle"
              onClick={() => refetchTrips()}
              disabled={tripsLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", tripsLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Trip List (30%) */}
        <div className="w-[30%] border-r border-zinc-800 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            {filteredTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                <Package className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs">No trips in this category</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {filteredTrips.map((trip) => (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className={cn(
                      "px-3 py-2 cursor-pointer transition-colors",
                      selectedTripId === trip.id
                        ? "bg-amber-500/10 border-l-2 border-amber-500"
                        : "hover:bg-zinc-900/50 border-l-2 border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-zinc-100">
                          {trip.tripNumber}
                        </span>
                        {trip.orderCount > 1 && (
                          <Badge className="bg-violet-500/20 text-violet-400 text-[9px] px-1 py-0">
                            {trip.orderCount}
                          </Badge>
                        )}
                        {trip.dispatchStatus === "POSTED_EXTERNAL" && (
                          <Badge className="bg-purple-500/20 text-purple-400 text-[9px] px-1 py-0">Posted</Badge>
                        )}
                        {trip.dispatchStatus === "COVERED_EXTERNAL" && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1 py-0">Covered</Badge>
                        )}
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-400">
                        ${trip.totalRate?.toLocaleString() || "—"}
                      </span>
                    </div>

                    {/* Route - Single Line */}
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <span className="truncate max-w-[80px]">{extractCity(trip.pickupLocation)}</span>
                      <ChevronRight className="h-2.5 w-2.5 text-zinc-600 flex-shrink-0" />
                      <span className="truncate max-w-[80px]">{extractCity(trip.dropoffLocation)}</span>
                      {trip.bidCount > 0 && (
                        <span className="ml-auto text-zinc-500">{trip.bidCount} bid{trip.bidCount !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Trip Detail & Bid Management (70%) */}
        <div className="w-[70%] flex flex-col bg-zinc-900/30 min-h-0">
          {selectedTrip ? (
            <>
              {/* Trip Header - Compact */}
              <div className="flex-none px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-zinc-100">{selectedTrip.tripNumber}</h2>
                    {selectedTrip.orderCount > 1 && (
                      <Badge className="bg-violet-500/20 text-violet-400 text-[10px]">
                        {selectedTrip.orderCount} Orders
                      </Badge>
                    )}
                    <span className="text-xs text-zinc-500">{getTripCustomers(selectedTrip)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-amber-400">${selectedTrip.totalRate?.toLocaleString() || "—"}</span>
                    {selectedTrip.dispatchStatus === "BROKERAGE_PENDING" && (
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => postToCarriersMutation.mutate(selectedTrip.orderId)}
                        disabled={postToCarriersMutation.isPending}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        {postToCarriersMutation.isPending ? "Posting..." : "Post to Boards"}
                      </Button>
                    )}
                    {selectedTrip.dispatchStatus === "POSTED_EXTERNAL" && (
                      <Badge className="bg-purple-500/20 text-purple-400 text-xs">Posted</Badge>
                    )}
                    {selectedTrip.dispatchStatus === "COVERED_EXTERNAL" && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Covered</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() => setShowBidForm(true)}
                      className="h-7 text-xs border-zinc-700"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Log Bid
                    </Button>
                  </div>
                </div>

                {/* Route Summary - Inline */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-emerald-500" />
                    <span className="text-zinc-300">{selectedTrip.pickupLocation}</span>
                    {selectedTrip.pickupTime && (
                      <span className="text-zinc-500">{new Date(selectedTrip.pickupTime).toLocaleDateString()}</span>
                    )}
                  </div>
                  <ChevronRight className="h-3 w-3 text-zinc-600" />
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-red-500" />
                    <span className="text-zinc-300">{selectedTrip.dropoffLocation}</span>
                  </div>
                  {selectedTrip.totalWeight > 0 && (
                    <span className="ml-auto text-zinc-500">{Math.round(selectedTrip.totalWeight / 1000)}K lbs</span>
                  )}
                </div>

                {/* Orders in Trip - Compact inline */}
                {selectedTrip.orderCount > 1 && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase">Orders:</span>
                    {selectedTrip.orders.map((order) => (
                      <Badge key={order.id} className="bg-zinc-800 text-zinc-300 text-[10px]">
                        #{order.orderNumber} - ${order.quotedRate?.toLocaleString() || "—"}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Bids Section */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase">
                    Carrier Bids ({pendingBids.length} pending)
                  </h3>
                  <Button
                    size="sm"
                    variant="plain"
                    onClick={() => refetchBids()}
                    className="text-zinc-500 h-6 w-6 p-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>

                {bids.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                    <MessageSquare className="h-6 w-6 mb-1 opacity-50" />
                    <p className="text-xs">No bids yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                    {bids.map((bid) => (
                      <Card
                        key={bid.id}
                        className={cn(
                          "transition-all",
                          bid.status === "ACCEPTED"
                            ? "border-emerald-500/50 bg-emerald-500/5"
                            : bid.isLowestCost
                            ? "border-amber-500/30 bg-amber-500/5"
                            : "border-zinc-800"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-zinc-100">
                                  {bid.carrierName}
                                </span>
                                {bid.isLowestCost && bid.status === "PENDING" && (
                                  <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">
                                    Lowest
                                  </Badge>
                                )}
                                {bid.status === "ACCEPTED" && (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                                    Awarded
                                  </Badge>
                                )}
                                {bid.status === "REJECTED" && (
                                  <Badge className="bg-red-500/20 text-red-400 text-[10px]">
                                    Rejected
                                  </Badge>
                                )}
                              </div>
                              {bid.mcNumber && (
                                <p className="text-xs text-zinc-500 mt-0.5">MC# {bid.mcNumber}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
                                {bid.contactPhone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {bid.contactPhone}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(bid.receivedAt).toLocaleString()}
                                </span>
                              </div>
                              {bid.notes && (
                                <p className="mt-2 text-xs text-zinc-400 bg-zinc-900/50 rounded px-2 py-1">
                                  {bid.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-xl font-bold text-zinc-100">
                                ${bid.bidAmount.toLocaleString()}
                              </div>
                              {selectedTrip.totalRate && (
                                <div
                                  className={cn(
                                    "text-xs",
                                    bid.bidAmount < selectedTrip.totalRate
                                      ? "text-emerald-400"
                                      : "text-red-400"
                                  )}
                                >
                                  {bid.bidAmount < selectedTrip.totalRate
                                    ? `$${(selectedTrip.totalRate - bid.bidAmount).toLocaleString()} margin`
                                    : `$${(bid.bidAmount - selectedTrip.totalRate).toLocaleString()} over`}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Bid Actions */}
                          {bid.status === "PENDING" && (
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
                              <Button
                                size="sm"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() =>
                                  awardBidMutation.mutate({
                                    orderId: selectedTrip.orderId,
                                    bidId: bid.id,
                                  })
                                }
                                disabled={awardBidMutation.isPending}
                              >
                                <Award className="h-3 w-3 mr-1.5" />
                                Award Carrier
                              </Button>
                              <Button size="sm" variant="subtle" className="border-zinc-700">
                                <Phone className="h-3 w-3 mr-1.5" />
                                Call
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Bid Form Modal */}
              {showBidForm && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
                  <Card className="w-[400px] bg-zinc-900 border-zinc-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-zinc-100">Log New Bid</h3>
                        <Button
                          size="sm"
                          variant="plain"
                          onClick={() => setShowBidForm(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-zinc-500 uppercase mb-1 block">
                            Carrier Name *
                          </label>
                          <Input
                            placeholder="ABC Trucking"
                            value={newBid.carrierName}
                            onChange={(e) =>
                              setNewBid({ ...newBid, carrierName: e.target.value })
                            }
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-zinc-500 uppercase mb-1 block">
                              Bid Amount *
                            </label>
                            <Input
                              type="number"
                              placeholder="2500"
                              value={newBid.bidAmount}
                              onChange={(e) =>
                                setNewBid({ ...newBid, bidAmount: e.target.value })
                              }
                              className="bg-zinc-800 border-zinc-700"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 uppercase mb-1 block">
                              MC Number
                            </label>
                            <Input
                              placeholder="123456"
                              value={newBid.mcNumber}
                              onChange={(e) =>
                                setNewBid({ ...newBid, mcNumber: e.target.value })
                              }
                              className="bg-zinc-800 border-zinc-700"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 uppercase mb-1 block">
                            Contact Phone
                          </label>
                          <Input
                            placeholder="(555) 123-4567"
                            value={newBid.contactPhone}
                            onChange={(e) =>
                              setNewBid({ ...newBid, contactPhone: e.target.value })
                            }
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 uppercase mb-1 block">
                            Notes
                          </label>
                          <Input
                            placeholder="Any additional notes..."
                            value={newBid.notes}
                            onChange={(e) =>
                              setNewBid({ ...newBid, notes: e.target.value })
                            }
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="subtle"
                            className="flex-1 border-zinc-700"
                            onClick={() => setShowBidForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() =>
                              addBidMutation.mutate({
                                orderId: selectedTrip.orderId,
                                bid: newBid,
                              })
                            }
                            disabled={
                              !newBid.carrierName ||
                              !newBid.bidAmount ||
                              addBidMutation.isPending
                            }
                          >
                            {addBidMutation.isPending ? "Saving..." : "Add Bid"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <Building2 className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs">Select a trip</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
