"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Truck,
  Building2,
  User,
  MapPin,
  Clock,
  Package,
  DollarSign,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Send,
  Award,
  MessageSquare,
  Plus,
  RefreshCw,
  FileText,
  History,
  ChevronRight,
  Snowflake,
  Scale,
  Boxes,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// ============================================================================
// TYPES
// ============================================================================

interface Stop {
  id: string;
  stopSequence: number;
  stopType: "pickup" | "delivery" | "intermediate";
  locationName: string | null;
  streetAddress: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  contactName: string | null;
  contactPhone: string | null;
  appointmentStart: string | null;
  appointmentEnd: string | null;
  appointmentType: string | null;
  specialInstructions: string | null;
}

interface FreightItem {
  id: string;
  description: string | null;
  commodity: string | null;
  quantity: number;
  packagingType: string | null;
  pieces: number | null;
  weightLbs: number | null;
  lengthIn: number | null;
  widthIn: number | null;
  heightIn: number | null;
  cubicFeet: number | null;
  freightClass: string | null;
  isHazmat: boolean;
  isStackable: boolean;
}

interface Bid {
  id: string;
  carrierId: string | null;
  carrierName: string;
  mcNumber: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
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

interface ActivityLog {
  id: string;
  actionType: string;
  performedBy: string;
  performedAt: string;
  notes: string | null;
  previousStatus: string | null;
  newStatus: string | null;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  customerName: string | null;
  status: string;
  dispatchStatus: string;
  priority: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string | null;
  dropoffTime: string | null;
  equipmentType: string;
  equipmentLength: number | null;
  temperatureSetting: string | null;
  totalWeightLbs: number | null;
  totalPieces: number | null;
  totalPallets: number | null;
  totalCubicFeet: number | null;
  isHazmat: boolean;
  isHighValue: boolean;
  quotedRate: number | null;
  estimatedCost: number | null;
  specialInstructions: string | null;
  internalNotes: string | null;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  assignedDriverType: string | null;
  assignedUnitId: string | null;
  assignedUnitNumber: string | null;
  assignedUnitType: string | null;
  postedToCarriers: boolean;
  postedAt: string | null;
  kickedToBrokerageAt: string | null;
  kickReason: string | null;
  awardedCarrierId: string | null;
  awardedCarrierName: string | null;
  awardedCarrierMc: string | null;
  awardedCarrierPhone: string | null;
  awardedBidId: string | null;
  awardedBidAmount: number | null;
  createdAt: string;
  stops: Stop[];
  freightItems: FreightItem[];
  bids: Bid[];
  activityLog: ActivityLog[];
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: "New", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  FLEET_DISPATCH: { label: "Fleet Assigned", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  BROKERAGE_PENDING: { label: "Brokerage", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  POSTED_EXTERNAL: { label: "Posted", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
  COVERED_INTERNAL: { label: "Covered (Fleet)", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  COVERED_EXTERNAL: { label: "Covered (Carrier)", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" },
};

const actionLabels: Record<string, string> = {
  ASSIGN_DRIVER: "Driver Assigned",
  UNASSIGN_DRIVER: "Driver Unassigned",
  KICK_TO_BROKERAGE: "Kicked to Brokerage",
  POST_TO_CARRIERS: "Posted to Carriers",
  UNPOST_FROM_CARRIERS: "Removed from Boards",
  RECEIVE_BID: "Bid Received",
  REJECT_BID: "Bid Rejected",
  AWARD_BID: "Bid Awarded",
  ORDER_CREATED: "Order Created",
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function DispatchOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id as string;

  // Fetch order details
  const { data, isLoading, error, refetch } = useQuery<{ success: boolean; data: OrderDetail }>({
    queryKey: ["dispatch-order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/dispatch/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json();
    },
  });

  // Fetch available drivers for assignment
  const { data: driversData } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ["dispatch-drivers"],
    queryFn: async () => {
      const res = await fetch("/api/dispatch/drivers");
      return res.json();
    },
  });

  // State
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showKickForm, setShowKickForm] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [kickReason, setKickReason] = useState("");
  const [newBid, setNewBid] = useState({ carrierName: "", bidAmount: "", contactPhone: "", notes: "" });

  // Mutations
  const assignMutation = useMutation({
    mutationFn: async (driverId: string) => {
      const res = await fetch(`/api/dispatch/orders/${orderId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-order", orderId] });
      setShowAssignForm(false);
      setSelectedDriverId("");
    },
  });

  const kickMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/dispatch/orders/${orderId}/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-order", orderId] });
      setShowKickForm(false);
      setKickReason("");
    },
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dispatch/orders/${orderId}/post`, { method: "POST" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-order", orderId] });
    },
  });

  const addBidMutation = useMutation({
    mutationFn: async (bid: typeof newBid) => {
      const res = await fetch(`/api/dispatch/orders/${orderId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrierName: bid.carrierName,
          bidAmount: parseFloat(bid.bidAmount),
          contactPhone: bid.contactPhone || null,
          notes: bid.notes || null,
          receivedVia: "MANUAL",
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-order", orderId] });
      setShowBidForm(false);
      setNewBid({ carrierName: "", bidAmount: "", contactPhone: "", notes: "" });
    },
  });

  const awardBidMutation = useMutation({
    mutationFn: async (bidId: string) => {
      const res = await fetch(`/api/dispatch/orders/${orderId}/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-order", orderId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <RefreshCw className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-zinc-400">Failed to load order</p>
        <Button variant="subtle" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const order = data.data;
  const status = statusConfig[order.dispatchStatus] || statusConfig.NEW;
  const isFleetBoard = ["NEW", "FLEET_DISPATCH", "COVERED_INTERNAL"].includes(order.dispatchStatus);
  const isBrokerageBoard = ["BROKERAGE_PENDING", "POSTED_EXTERNAL", "COVERED_EXTERNAL"].includes(order.dispatchStatus);
  const isCovered = ["COVERED_INTERNAL", "COVERED_EXTERNAL"].includes(order.dispatchStatus);
  const pendingBids = order.bids.filter((b) => b.status === "PENDING");

  return (
    <div className="min-h-screen bg-black text-zinc-300">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dispatch">
                <Button size="sm" variant="subtle">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white">Order {order.orderNumber}</h1>
                  <span className={cn("px-2 py-0.5 rounded text-xs font-medium border", status.bg, status.color)}>
                    {status.label}
                  </span>
                  {order.priority === "high" && (
                    <Badge className="bg-amber-500/20 text-amber-400 text-xs">High Priority</Badge>
                  )}
                  {order.priority === "critical" && (
                    <Badge className="bg-red-500/20 text-red-400 text-xs">Critical</Badge>
                  )}
                </div>
                <p className="text-xs text-zinc-500">{order.customerName || "No customer"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="subtle" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="col-span-2 space-y-6">
            {/* Route Card */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  Route
                </h2>
                
                {order.stops.length > 0 ? (
                  <div className="space-y-3">
                    {order.stops.map((stop, i) => (
                      <div key={stop.id} className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          stop.stopType === "pickup" ? "bg-emerald-500/20 text-emerald-400" :
                          stop.stopType === "delivery" ? "bg-red-500/20 text-red-400" :
                          "bg-blue-500/20 text-blue-400"
                        )}>
                          {stop.stopSequence}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase text-zinc-500">{stop.stopType}</span>
                            {stop.appointmentStart && (
                              <span className="text-xs text-zinc-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(stop.appointmentStart).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-zinc-100">
                            {stop.locationName || `${stop.city}, ${stop.state}`}
                          </p>
                          {stop.streetAddress && (
                            <p className="text-xs text-zinc-500">{stop.streetAddress}</p>
                          )}
                          {stop.contactName && (
                            <p className="text-xs text-zinc-400 mt-1">
                              Contact: {stop.contactName} {stop.contactPhone && `• ${stop.contactPhone}`}
                            </p>
                          )}
                        </div>
                        {i < order.stops.length - 1 && (
                          <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0 mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Pickup</p>
                      <p className="text-zinc-100">{order.pickupLocation}</p>
                      {order.pickupTime && (
                        <p className="text-xs text-zinc-400">{new Date(order.pickupTime).toLocaleString()}</p>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-zinc-600" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Delivery</p>
                      <p className="text-zinc-100">{order.dropoffLocation}</p>
                      {order.dropoffTime && (
                        <p className="text-xs text-zinc-400">{new Date(order.dropoffTime).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Freight Card */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-400" />
                  Freight Details
                </h2>
                
                {/* Summary Row */}
                <div className="grid grid-cols-5 gap-4 mb-4 p-3 bg-zinc-900/50 rounded-lg">
                  <div>
                    <p className="text-xs text-zinc-500">Equipment</p>
                    <p className="text-sm text-zinc-100 flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      {order.equipmentLength}' {order.equipmentType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Weight</p>
                    <p className="text-sm text-zinc-100 flex items-center gap-1">
                      <Scale className="h-3 w-3" />
                      {order.totalWeightLbs?.toLocaleString() || "—"} lbs
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Pallets</p>
                    <p className="text-sm text-zinc-100 flex items-center gap-1">
                      <Boxes className="h-3 w-3" />
                      {order.totalPallets || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Cube</p>
                    <p className="text-sm text-zinc-100">
                      {order.totalCubicFeet?.toLocaleString() || "—"} cu ft
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Rate</p>
                    <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {order.quotedRate?.toLocaleString() || "—"}
                    </p>
                  </div>
                </div>

                {/* Flags */}
                <div className="flex items-center gap-2 mb-4">
                  {order.temperatureSetting && (
                    <Badge className="bg-cyan-500/20 text-cyan-400">
                      <Snowflake className="h-3 w-3 mr-1" />
                      {order.temperatureSetting}
                    </Badge>
                  )}
                  {order.isHazmat && (
                    <Badge className="bg-amber-500/20 text-amber-400">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Hazmat
                    </Badge>
                  )}
                  {order.isHighValue && (
                    <Badge className="bg-purple-500/20 text-purple-400">
                      <CreditCard className="h-3 w-3 mr-1" />
                      High Value
                    </Badge>
                  )}
                </div>

                {/* Freight Items */}
                {order.freightItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500 uppercase">Items</p>
                    {order.freightItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-zinc-900/30 rounded text-sm">
                        <div>
                          <span className="text-zinc-100">{item.commodity || item.description || "Item"}</span>
                          <span className="text-zinc-500 ml-2">
                            {item.quantity}x {item.packagingType}
                          </span>
                        </div>
                        <div className="text-zinc-400 text-xs">
                          {item.weightLbs && `${item.weightLbs} lbs`}
                          {item.cubicFeet && ` • ${item.cubicFeet} cu ft`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Instructions */}
                {order.specialInstructions && (
                  <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded">
                    <p className="text-xs text-amber-400 font-medium mb-1">Special Instructions</p>
                    <p className="text-sm text-zinc-300">{order.specialInstructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bids Card (for Brokerage) */}
            {isBrokerageBoard && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-400" />
                      Carrier Bids ({pendingBids.length} pending)
                    </h2>
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() => setShowBidForm(!showBidForm)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Log Bid
                    </Button>
                  </div>

                  {/* Add Bid Form */}
                  {showBidForm && (
                    <div className="mb-4 p-3 bg-zinc-900/50 rounded-lg space-y-3">
                      <Input
                        placeholder="Carrier Name *"
                        value={newBid.carrierName}
                        onChange={(e) => setNewBid({ ...newBid, carrierName: e.target.value })}
                        className="bg-zinc-800 border-zinc-700"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Bid Amount ($) *"
                          type="number"
                          value={newBid.bidAmount}
                          onChange={(e) => setNewBid({ ...newBid, bidAmount: e.target.value })}
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <Input
                          placeholder="Contact Phone"
                          value={newBid.contactPhone}
                          onChange={(e) => setNewBid({ ...newBid, contactPhone: e.target.value })}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                      <Input
                        placeholder="Notes"
                        value={newBid.notes}
                        onChange={(e) => setNewBid({ ...newBid, notes: e.target.value })}
                        className="bg-zinc-800 border-zinc-700"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="subtle"
                          onClick={() => setShowBidForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          disabled={!newBid.carrierName || !newBid.bidAmount}
                          onClick={() => addBidMutation.mutate(newBid)}
                        >
                          Add Bid
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Bids List */}
                  {order.bids.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No bids received yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {order.bids.map((bid) => (
                        <div
                          key={bid.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            bid.status === "ACCEPTED"
                              ? "border-emerald-500/50 bg-emerald-500/5"
                              : bid.status === "PENDING"
                              ? bid.isLowestCost
                                ? "border-blue-500/50 bg-blue-500/5"
                                : "border-zinc-800 bg-zinc-900/30"
                              : "border-zinc-800 bg-zinc-900/30 opacity-50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-zinc-100">{bid.carrierName}</span>
                                {bid.mcNumber && (
                                  <span className="text-xs text-zinc-500">MC# {bid.mcNumber}</span>
                                )}
                                {bid.isLowestCost && bid.status === "PENDING" && (
                                  <Badge className="bg-blue-500/20 text-blue-400 text-xs">Lowest</Badge>
                                )}
                                {bid.status === "ACCEPTED" && (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Awarded</Badge>
                                )}
                                {bid.status === "REJECTED" && (
                                  <Badge className="bg-red-500/20 text-red-400 text-xs">Rejected</Badge>
                                )}
                              </div>
                              {bid.contactPhone && (
                                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {bid.contactPhone}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-bold text-lg text-zinc-100">
                                ${bid.bidAmount.toLocaleString()}
                              </p>
                              {bid.transitTimeHours && (
                                <p className="text-xs text-zinc-500">{bid.transitTimeHours}h transit</p>
                              )}
                            </div>
                          </div>
                          {bid.notes && (
                            <p className="text-xs text-zinc-400 mt-2 bg-zinc-800/50 rounded px-2 py-1">
                              {bid.notes}
                            </p>
                          )}
                          {bid.status === "PENDING" && !isCovered && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => awardBidMutation.mutate(bid.id)}
                              >
                                <Award className="h-3 w-3 mr-1" />
                                Award
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Actions & Assignment */}
          <div className="space-y-6">
            {/* Assignment Card */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                  {isFleetBoard ? (
                    <>
                      <Truck className="h-4 w-4 text-emerald-400" />
                      Fleet Assignment
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 text-amber-400" />
                      Carrier Coverage
                    </>
                  )}
                </h2>

                {/* Fleet Assignment Display */}
                {isFleetBoard && order.assignedDriverId && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-100">{order.assignedDriverName}</p>
                        <p className="text-xs text-zinc-400">
                          {order.assignedDriverType}
                          {order.assignedUnitNumber && ` • Unit ${order.assignedUnitNumber}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Carrier Coverage Display */}
                {order.awardedCarrierId && (
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-100">{order.awardedCarrierName}</p>
                        <p className="text-xs text-zinc-400">
                          MC# {order.awardedCarrierMc}
                          {order.awardedBidAmount && ` • $${order.awardedBidAmount.toLocaleString()}`}
                        </p>
                        {order.awardedCarrierPhone && (
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {order.awardedCarrierPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Kick Reason */}
                {order.kickReason && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
                    <p className="text-xs text-amber-400 font-medium">Kicked to Brokerage</p>
                    <p className="text-sm text-zinc-300">{order.kickReason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {!isCovered && (
                  <div className="space-y-2">
                    {isFleetBoard && (
                      <>
                        {/* Assign/Reassign Button */}
                        {!showAssignForm ? (
                          <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setShowAssignForm(true)}
                          >
                            <User className="h-4 w-4 mr-2" />
                            {order.assignedDriverId ? "Reassign Driver" : "Assign Driver"}
                          </Button>
                        ) : (
                          <div className="space-y-2 p-3 bg-zinc-900/50 rounded-lg">
                            <select
                              value={selectedDriverId}
                              onChange={(e) => setSelectedDriverId(e.target.value)}
                              className="w-full h-9 rounded bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 px-2"
                            >
                              <option value="">Select a driver...</option>
                              {driversData?.data?.filter((d: any) => d.isActive).map((driver: any) => (
                                <option key={driver.driverId} value={driver.driverId}>
                                  {driver.driverName} {driver.unitNumber && `(Unit ${driver.unitNumber})`}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="subtle"
                                className="flex-1"
                                onClick={() => setShowAssignForm(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                disabled={!selectedDriverId}
                                onClick={() => assignMutation.mutate(selectedDriverId)}
                              >
                                Assign
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Kick to Brokerage */}
                        {!showKickForm ? (
                          <Button
                            variant="subtle"
                            className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            onClick={() => setShowKickForm(true)}
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Kick to Brokerage
                          </Button>
                        ) : (
                          <div className="space-y-2 p-3 bg-zinc-900/50 rounded-lg">
                            <Input
                              placeholder="Reason (optional)"
                              value={kickReason}
                              onChange={(e) => setKickReason(e.target.value)}
                              className="bg-zinc-800 border-zinc-700"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="subtle"
                                className="flex-1"
                                onClick={() => setShowKickForm(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-amber-600 hover:bg-amber-700"
                                onClick={() => kickMutation.mutate(kickReason)}
                              >
                                Kick
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {isBrokerageBoard && !order.postedToCarriers && (
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={() => postMutation.mutate()}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Post to Carriers
                      </Button>
                    )}

                    {order.postedToCarriers && (
                      <div className="text-center text-xs text-purple-400 py-2">
                        <CheckCircle2 className="h-4 w-4 inline mr-1" />
                        Posted {order.postedAt && new Date(order.postedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                  <History className="h-4 w-4 text-zinc-400" />
                  Activity Log
                </h2>

                {order.activityLog.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">No activity yet</p>
                ) : (
                  <div className="space-y-3">
                    {order.activityLog.slice(0, 10).map((activity) => (
                      <div key={activity.id} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-zinc-300">
                            {actionLabels[activity.actionType] || activity.actionType}
                          </p>
                          {activity.notes && (
                            <p className="text-xs text-zinc-500">{activity.notes}</p>
                          )}
                          <p className="text-xs text-zinc-600">
                            {new Date(activity.performedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Internal Notes */}
            {order.internalNotes && (
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-sm font-semibold text-zinc-100 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-zinc-400" />
                    Internal Notes
                  </h2>
                  <p className="text-sm text-zinc-400">{order.internalNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
