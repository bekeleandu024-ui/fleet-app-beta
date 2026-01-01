"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Truck,
  Building2,
  ArrowRight,
  User,
  Clock,
  MapPin,
  Package,
  DollarSign,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCw,
  Filter,
  Search,
  GripVertical,
  Send,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  useDispatchStore,
  selectFleetOrdersFiltered,
  selectBrokerageOrdersFiltered,
  selectSelectedOrder,
  type DispatchOrder,
  type DispatchStatus,
} from "@/lib/stores/dispatch-store";

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

const statusConfig: Record<DispatchStatus, { label: string; color: string; bg: string }> = {
  NEW: { label: 'New', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  FLEET_DISPATCH: { label: 'Fleet Assigned', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  BROKERAGE_PENDING: { label: 'Brokerage', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  POSTED_EXTERNAL: { label: 'Posted', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  COVERED_INTERNAL: { label: 'Covered (Fleet)', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  COVERED_EXTERNAL: { label: 'Covered (Carrier)', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
};

function StatusBadge({ status }: { status: DispatchStatus }) {
  const config = statusConfig[status] || statusConfig.NEW;
  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium border", config.bg, config.color)}>
      {config.label}
    </span>
  );
}

// ============================================================================
// ORDER CARD COMPONENT
// ============================================================================

interface OrderCardProps {
  order: DispatchOrder;
  board: 'fleet' | 'brokerage';
  onSelect: () => void;
  isSelected: boolean;
}

function OrderCard({ order, board, onSelect, isSelected }: OrderCardProps) {
  const { openAssignModal, openKickModal, postToCarriers, openBidDrawer } = useDispatchStore();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-150 hover:border-zinc-600",
        isSelected && "ring-1 ring-emerald-500/50 border-emerald-500/50"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-zinc-600 cursor-grab" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-zinc-100">
                  #{order.orderNumber}
                </span>
                <StatusBadge status={order.dispatchStatus} />
              </div>
              <div className="text-xs text-zinc-500">{order.customerName}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm font-bold text-emerald-400">
              ${order.quotedRate?.toLocaleString() || '---'}
            </div>
            {order.targetRate && (
              <div className="text-xs text-zinc-500">
                Target: ${order.targetRate.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Route Row */}
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
          <span className="text-zinc-400 truncate max-w-[120px]">{order.pickupLocation}</span>
          <ArrowRight className="h-3 w-3 text-zinc-600 shrink-0" />
          <MapPin className="h-3 w-3 text-red-500 shrink-0" />
          <span className="text-zinc-400 truncate max-w-[120px]">{order.dropoffLocation}</span>
        </div>

        {/* Meta Row */}
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Truck className="h-3 w-3" />
            {order.equipmentType || 'Van'}
          </span>
          {order.totalWeightLbs && (
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {Math.round(order.totalWeightLbs / 1000)}K lbs
            </span>
          )}
          {order.pickupTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(order.pickupTime).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Fleet-specific: Driver Assignment */}
        {board === 'fleet' && order.assignedDriverName && (
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
            <User className="h-3 w-3 text-emerald-400" />
            <span className="text-xs text-emerald-400">
              {order.assignedDriverName}
              {order.assignedUnitNumber && ` • Unit ${order.assignedUnitNumber}`}
            </span>
          </div>
        )}

        {/* Brokerage-specific: Bid Info */}
        {board === 'brokerage' && (
          <div className="flex items-center justify-between gap-2">
            {order.postedToCarriers ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-400">
                  {order.bidCount} bids
                </span>
                {order.lowestBid && (
                  <span className="text-xs text-zinc-400">
                    Low: ${order.lowestBid.toLocaleString()}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-zinc-500">Not posted</span>
            )}
          </div>
        )}

        {/* Expanded Details */}
        {expanded && (
          <div className="pt-2 mt-2 border-t border-zinc-800 space-y-2 text-xs">
            {order.kickReason && (
              <div className="flex items-start gap-2 text-amber-400">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                <span>Kicked: {order.kickReason}</span>
              </div>
            )}
            <div className="text-zinc-500">
              Created: {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pt-1">
          {board === 'fleet' ? (
            <>
              <Button
                size="sm"
                variant="subtle"
                className="h-7 text-xs flex-1 border-zinc-700 hover:border-emerald-500 hover:text-emerald-400"
                onClick={(e) => { e.stopPropagation(); openAssignModal(order.id); }}
              >
                <User className="h-3 w-3 mr-1" />
                {order.assignedDriverId ? 'Reassign' : 'Assign'}
              </Button>
              <Button
                size="sm"
                variant="subtle"
                className="h-7 text-xs flex-1 border-zinc-700 hover:border-amber-500 hover:text-amber-400"
                onClick={(e) => { e.stopPropagation(); openKickModal(order.id); }}
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Kick to Broker
              </Button>
            </>
          ) : (
            <>
              {!order.postedToCarriers ? (
                <Button
                  size="sm"
                  variant="subtle"
                  className="h-7 text-xs flex-1 border-zinc-700 hover:border-purple-500 hover:text-purple-400"
                  onClick={(e) => { e.stopPropagation(); postToCarriers(order.id); }}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Post to Carriers
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="subtle"
                  className="h-7 text-xs flex-1 border-zinc-700 hover:border-cyan-500 hover:text-cyan-400"
                  onClick={(e) => { e.stopPropagation(); openBidDrawer(order.id); }}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  View Bids ({order.bidCount})
                </Button>
              )}
              <Button
                size="sm"
                variant="subtle"
                className="h-7 text-xs border-zinc-700 hover:border-emerald-500 hover:text-emerald-400"
                onClick={(e) => { e.stopPropagation(); openBidDrawer(order.id); }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="plain"
            className="h-7 w-7 p-0 text-zinc-500"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DISPATCH BOARD PANEL
// ============================================================================

interface BoardPanelProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  orders: DispatchOrder[];
  board: 'fleet' | 'brokerage';
  filter: React.ReactNode;
}

function BoardPanel({ title, icon, iconColor, orders, board, filter }: BoardPanelProps) {
  const { selectedOrderId, selectOrder } = useDispatchStore();
  
  return (
    <div className="flex flex-col h-full border border-zinc-800 rounded-lg bg-zinc-950/50">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded", iconColor)}>
            {icon}
          </div>
          <div>
            <h2 className="font-semibold text-zinc-100">{title}</h2>
            <p className="text-xs text-zinc-500">{orders.length} orders</p>
          </div>
        </div>
        {filter}
      </div>

      {/* Order List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
            <Package className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No orders</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              board={board}
              onSelect={() => selectOrder(order.id)}
              isSelected={selectedOrderId === order.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMMAND CENTER PAGE
// ============================================================================

export default function DispatchCommandCenterPage() {
  const {
    fleetOrders,
    brokerageOrders,
    isLoading,
    fleetFilter,
    brokerageFilter,
    setFleetFilter,
    setBrokerageFilter,
    refreshAll,
    isBidDrawerOpen,
    closeBidDrawer,
    selectedOrderId,
    selectedOrderBids,
    isAssignModalOpen,
    closeAssignModal,
    isKickModalOpen,
    closeKickModal,
    drivers,
    units,
    assignToFleet,
    kickToBrokerage,
    addBid,
    awardBid,
  } = useDispatchStore();

  // Fetch data on mount
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Get filtered orders
  const filteredFleetOrders = selectFleetOrdersFiltered(useDispatchStore.getState());
  const filteredBrokerageOrders = selectBrokerageOrdersFiltered(useDispatchStore.getState());
  const selectedOrder = selectSelectedOrder(useDispatchStore.getState());

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Command Center Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Dispatch Command Center</h1>
          <p className="text-xs text-zinc-500">Fleet First, Brokerage Second</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="subtle"
            className="border-zinc-700 hover:border-zinc-500"
            onClick={() => refreshAll()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Split Pane Content */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4 overflow-hidden">
        {/* Fleet Ops Panel */}
        <BoardPanel
          title="Fleet Ops"
          icon={<Truck className="h-4 w-4 text-emerald-400" />}
          iconColor="bg-emerald-500/20"
          orders={filteredFleetOrders}
          board="fleet"
          filter={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
                <Input
                  placeholder="Search..."
                  value={fleetFilter.search}
                  onChange={(e) => setFleetFilter({ search: e.target.value })}
                  className="w-32 h-7 pl-7 text-xs bg-zinc-900 border-zinc-700"
                />
              </div>
            </div>
          }
        />

        {/* Brokerage Ops Panel */}
        <BoardPanel
          title="Brokerage Ops"
          icon={<Building2 className="h-4 w-4 text-amber-400" />}
          iconColor="bg-amber-500/20"
          orders={filteredBrokerageOrders}
          board="brokerage"
          filter={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
                <Input
                  placeholder="Search..."
                  value={brokerageFilter.search}
                  onChange={(e) => setBrokerageFilter({ search: e.target.value })}
                  className="w-32 h-7 pl-7 text-xs bg-zinc-900 border-zinc-700"
                />
              </div>
              <Button
                size="sm"
                variant={brokerageFilter.hasBids ? "primary" : "subtle"}
                className={cn("h-7 text-xs", brokerageFilter.hasBids && "bg-purple-600")}
                onClick={() => setBrokerageFilter({ hasBids: !brokerageFilter.hasBids })}
              >
                Has Bids
              </Button>
            </div>
          }
        />
      </div>

      {/* Bid Drawer */}
      {isBidDrawerOpen && selectedOrder && (
        <BidDrawer
          order={selectedOrder}
          bids={selectedOrderBids}
          onClose={closeBidDrawer}
          onAddBid={(bid) => addBid(selectedOrder.id, bid)}
          onAwardBid={(bidId) => awardBid(selectedOrder.id, bidId)}
        />
      )}

      {/* Assign Modal */}
      {isAssignModalOpen && selectedOrderId && (
        <AssignModal
          orderId={selectedOrderId}
          drivers={drivers}
          units={units}
          onClose={closeAssignModal}
          onAssign={(driverId, unitId) => {
            assignToFleet(selectedOrderId, driverId, unitId);
            closeAssignModal();
          }}
        />
      )}

      {/* Kick Modal */}
      {isKickModalOpen && selectedOrderId && (
        <KickModal
          orderId={selectedOrderId}
          onClose={closeKickModal}
          onKick={(reason) => {
            kickToBrokerage(selectedOrderId, reason);
            closeKickModal();
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// BID DRAWER COMPONENT
// ============================================================================

import type { CarrierBid } from "@/lib/stores/dispatch-store";

interface BidDrawerProps {
  order: DispatchOrder;
  bids: CarrierBid[];
  onClose: () => void;
  onAddBid: (bid: Omit<CarrierBid, 'id' | 'orderId' | 'status' | 'isLowestCost' | 'isFastest' | 'receivedAt'>) => void;
  onAwardBid: (bidId: string) => void;
}

function BidDrawer({ order, bids, onClose, onAddBid, onAwardBid }: BidDrawerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBid, setNewBid] = useState({
    carrierName: '',
    contactName: '',
    contactPhone: '',
    bidAmount: '',
    notes: '',
  });

  const handleAddBid = () => {
    if (!newBid.carrierName || !newBid.bidAmount) return;
    onAddBid({
      carrierId: null,
      carrierName: newBid.carrierName,
      contactName: newBid.contactName || null,
      contactPhone: newBid.contactPhone || null,
      contactEmail: null,
      mcNumber: null,
      bidAmount: parseFloat(newBid.bidAmount),
      currency: 'USD',
      transitTimeHours: null,
      pickupAvailableAt: null,
      deliveryEta: null,
      receivedVia: 'MANUAL',
      expiresAt: null,
      notes: newBid.notes || null,
    });
    setNewBid({ carrierName: '', contactName: '', contactPhone: '', bidAmount: '', notes: '' });
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 flex flex-col">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div>
          <h3 className="font-bold text-zinc-100">Carrier Bids</h3>
          <p className="text-xs text-zinc-500">Order #{order.orderNumber}</p>
        </div>
        <Button size="sm" variant="plain" onClick={onClose}>
          <XCircle className="h-4 w-4" />
        </Button>
      </div>

      {/* Order Summary */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-between text-sm">
          <div>
            <div className="text-zinc-400">{order.pickupLocation}</div>
            <ArrowRight className="h-3 w-3 text-zinc-600 my-1" />
            <div className="text-zinc-400">{order.dropoffLocation}</div>
          </div>
          <div className="text-right">
            <div className="font-mono font-bold text-emerald-400">
              Target: ${order.targetRate?.toLocaleString() || '---'}
            </div>
            <div className="text-xs text-zinc-500">
              Quoted: ${order.quotedRate?.toLocaleString() || '---'}
            </div>
          </div>
        </div>
      </div>

      {/* Bid List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No bids yet</p>
          </div>
        ) : (
          bids.map((bid) => (
            <div
              key={bid.id}
              className={cn(
                "p-3 rounded-lg border",
                bid.isLowestCost
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-zinc-800 bg-zinc-900/50"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-100">{bid.carrierName}</span>
                    {bid.isLowestCost && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                        Lowest
                      </Badge>
                    )}
                    {bid.isFastest && (
                      <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                        Fastest
                      </Badge>
                    )}
                  </div>
                  {bid.contactName && (
                    <div className="text-xs text-zinc-500 mt-1">
                      {bid.contactName} {bid.contactPhone && `• ${bid.contactPhone}`}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-lg text-zinc-100">
                    ${bid.bidAmount.toLocaleString()}
                  </div>
                  {bid.transitTimeHours && (
                    <div className="text-xs text-zinc-500">{bid.transitTimeHours}h transit</div>
                  )}
                </div>
              </div>

              {bid.notes && (
                <div className="mt-2 text-xs text-zinc-400 bg-zinc-800/50 rounded px-2 py-1">
                  {bid.notes}
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800">
                <div className="text-xs text-zinc-500">
                  {bid.receivedVia} • {new Date(bid.receivedAt).toLocaleString()}
                </div>
                {bid.status === 'PENDING' && (
                  <Button
                    size="sm"
                    className="h-6 text-xs bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onAwardBid(bid.id)}
                  >
                    <Award className="h-3 w-3 mr-1" />
                    Award
                  </Button>
                )}
                {bid.status === 'ACCEPTED' && (
                  <Badge className="bg-emerald-500/20 text-emerald-400">Awarded</Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Bid Form */}
      <div className="border-t border-zinc-800 p-4">
        {showAddForm ? (
          <div className="space-y-3">
            <Input
              placeholder="Carrier Name"
              value={newBid.carrierName}
              onChange={(e) => setNewBid({ ...newBid, carrierName: e.target.value })}
              className="bg-zinc-900 border-zinc-700"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Contact Name"
                value={newBid.contactName}
                onChange={(e) => setNewBid({ ...newBid, contactName: e.target.value })}
                className="bg-zinc-900 border-zinc-700"
              />
              <Input
                placeholder="Phone"
                value={newBid.contactPhone}
                onChange={(e) => setNewBid({ ...newBid, contactPhone: e.target.value })}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <Input
              placeholder="Bid Amount ($)"
              type="number"
              value={newBid.bidAmount}
              onChange={(e) => setNewBid({ ...newBid, bidAmount: e.target.value })}
              className="bg-zinc-900 border-zinc-700"
            />
            <Input
              placeholder="Notes"
              value={newBid.notes}
              onChange={(e) => setNewBid({ ...newBid, notes: e.target.value })}
              className="bg-zinc-900 border-zinc-700"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="subtle"
                className="flex-1 border-zinc-700"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleAddBid}
              >
                Add Bid
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Log New Bid
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ASSIGN MODAL COMPONENT
// ============================================================================

import type { Driver, Unit } from "@/lib/stores/dispatch-store";

interface AssignModalProps {
  orderId: string;
  drivers: Driver[];
  units: Unit[];
  onClose: () => void;
  onAssign: (driverId: string, unitId?: string) => void;
}

function AssignModal({ orderId, drivers, units, onClose, onAssign }: AssignModalProps) {
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl w-full max-w-md">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h3 className="font-bold text-zinc-100">Assign Driver</h3>
          <p className="text-xs text-zinc-500">Select a driver and optionally a unit</p>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Driver *</label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full h-9 rounded bg-zinc-900 border border-zinc-700 text-sm text-zinc-200 px-2"
            >
              <option value="">Select a driver...</option>
              {drivers.filter(d => d.isActive).map((driver) => (
                <option key={driver.driverId} value={driver.driverId}>
                  {driver.driverName} {driver.unitNumber && `(Unit ${driver.unitNumber})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Unit (optional)</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full h-9 rounded bg-zinc-900 border border-zinc-700 text-sm text-zinc-200 px-2"
            >
              <option value="">Auto-assign from driver...</option>
              {units.filter(u => u.isActive).map((unit) => (
                <option key={unit.unitId} value={unit.unitId}>
                  Unit {unit.unitNumber} - {unit.unitType || 'Unknown Type'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-800">
          <Button
            variant="subtle"
            className="flex-1 border-zinc-700"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={!selectedDriverId}
            onClick={() => onAssign(selectedDriverId, selectedUnitId || undefined)}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KICK MODAL COMPONENT
// ============================================================================

interface KickModalProps {
  orderId: string;
  onClose: () => void;
  onKick: (reason?: string) => void;
}

function KickModal({ orderId, onClose, onKick }: KickModalProps) {
  const [reason, setReason] = useState('');
  const presetReasons = [
    'No available drivers',
    'Equipment mismatch',
    'Location out of range',
    'Customer requested broker',
    'Driver declined',
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl w-full max-w-md">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h3 className="font-bold text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Kick to Brokerage
          </h3>
          <p className="text-xs text-zinc-500">This order will be moved to the brokerage queue</p>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-2">Quick Reasons</label>
            <div className="flex flex-wrap gap-2">
              {presetReasons.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setReason(preset)}
                  className={cn(
                    "px-2 py-1 rounded text-xs border transition-colors",
                    reason === preset
                      ? "border-amber-500 bg-amber-500/20 text-amber-400"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Custom Reason</label>
            <Input
              placeholder="Enter reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-zinc-900 border-zinc-700"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-800">
          <Button
            variant="subtle"
            className="flex-1 border-zinc-700"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-amber-600 hover:bg-amber-700"
            onClick={() => onKick(reason || undefined)}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Kick to Brokerage
          </Button>
        </div>
      </div>
    </div>
  );
}
