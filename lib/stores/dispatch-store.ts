import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type DispatchStatus = 
  | 'NEW'
  | 'FLEET_DISPATCH'
  | 'BROKERAGE_PENDING'
  | 'POSTED_EXTERNAL'
  | 'COVERED_INTERNAL'
  | 'COVERED_EXTERNAL';

export interface DispatchOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string | null;
  dropoffTime: string | null;
  dispatchStatus: DispatchStatus;
  equipmentType: string;
  totalWeightLbs: number | null;
  totalPallets: number | null;
  quotedRate: number | null;
  targetRate: number | null;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  assignedUnitId: string | null;
  assignedUnitNumber: string | null;
  postedToCarriers: boolean;
  postedAt: string | null;
  kickedToBrokerageAt: string | null;
  kickReason: string | null;
  awardedCarrierId: string | null;
  awardedBidId: string | null;
  bidCount: number;
  lowestBid: number | null;
  createdAt: string;
}

export interface CarrierBid {
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
  pickupAvailableAt: string | null;
  deliveryEta: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'WITHDRAWN';
  isLowestCost: boolean;
  isFastest: boolean;
  receivedVia: string | null;
  receivedAt: string;
  expiresAt: string | null;
  notes: string | null;
}

export interface Driver {
  driverId: string;
  driverName: string;
  unitNumber: string | null;
  driverType: string;
  region: string | null;
  status: string | null;
  isActive: boolean;
}

export interface Unit {
  unitId: string;
  unitNumber: string;
  driverId: string | null;
  unitType: string | null;
  maxWeight: number;
  maxCube: number;
  linearFeet: number;
  region: string | null;
  currentLocation: string | null;
  isActive: boolean;
}

// ============================================================================
// STORE STATE
// ============================================================================

interface DispatchState {
  // Data
  fleetOrders: DispatchOrder[];
  brokerageOrders: DispatchOrder[];
  drivers: Driver[];
  units: Unit[];
  selectedOrderId: string | null;
  selectedOrderBids: CarrierBid[];
  
  // UI State
  isLoading: boolean;
  isBidModalOpen: boolean;
  isBidDrawerOpen: boolean;
  isAssignModalOpen: boolean;
  isKickModalOpen: boolean;
  draggedOrderId: string | null;
  
  // Filters
  fleetFilter: {
    search: string;
    equipmentType: string | null;
    dateRange: [string | null, string | null];
  };
  brokerageFilter: {
    search: string;
    postedOnly: boolean;
    hasBids: boolean;
  };
}

interface DispatchActions {
  // Data Fetching
  fetchFleetOrders: () => Promise<void>;
  fetchBrokerageOrders: () => Promise<void>;
  fetchDrivers: () => Promise<void>;
  fetchUnits: () => Promise<void>;
  fetchOrderBids: (orderId: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Order Actions
  selectOrder: (orderId: string | null) => void;
  assignToFleet: (orderId: string, driverId: string, unitId?: string) => Promise<void>;
  unassignFromFleet: (orderId: string) => Promise<void>;
  kickToBrokerage: (orderId: string, reason?: string) => Promise<void>;
  postToCarriers: (orderId: string) => Promise<void>;
  unpostFromCarriers: (orderId: string) => Promise<void>;
  
  // Bid Actions
  addBid: (orderId: string, bid: Omit<CarrierBid, 'id' | 'orderId' | 'status' | 'isLowestCost' | 'isFastest' | 'receivedAt'>) => Promise<void>;
  awardBid: (orderId: string, bidId: string) => Promise<void>;
  rejectBid: (bidId: string, reason?: string) => Promise<void>;
  
  // UI Actions
  openBidModal: () => void;
  closeBidModal: () => void;
  openBidDrawer: (orderId: string) => void;
  closeBidDrawer: () => void;
  openAssignModal: (orderId: string) => void;
  closeAssignModal: () => void;
  openKickModal: (orderId: string) => void;
  closeKickModal: () => void;
  setDraggedOrder: (orderId: string | null) => void;
  
  // Filters
  setFleetFilter: (filter: Partial<DispatchState['fleetFilter']>) => void;
  setBrokerageFilter: (filter: Partial<DispatchState['brokerageFilter']>) => void;
  
  // Optimistic Updates
  moveOrderToFleet: (orderId: string) => void;
  moveOrderToBrokerage: (orderId: string) => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useDispatchStore = create<DispatchState & DispatchActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial State
      fleetOrders: [],
      brokerageOrders: [],
      drivers: [],
      units: [],
      selectedOrderId: null,
      selectedOrderBids: [],
      
      isLoading: false,
      isBidModalOpen: false,
      isBidDrawerOpen: false,
      isAssignModalOpen: false,
      isKickModalOpen: false,
      draggedOrderId: null,
      
      fleetFilter: {
        search: '',
        equipmentType: null,
        dateRange: [null, null],
      },
      brokerageFilter: {
        search: '',
        postedOnly: false,
        hasBids: false,
      },
      
      // ========================================
      // DATA FETCHING
      // ========================================
      
      fetchFleetOrders: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/dispatch/orders?board=fleet');
          const data = await response.json();
          if (data.success) {
            set({ fleetOrders: data.data });
          }
        } catch (error) {
          console.error('Failed to fetch fleet orders:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      fetchBrokerageOrders: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/dispatch/orders?board=brokerage');
          const data = await response.json();
          if (data.success) {
            set({ brokerageOrders: data.data });
          }
        } catch (error) {
          console.error('Failed to fetch brokerage orders:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      fetchDrivers: async () => {
        try {
          const response = await fetch('/api/dispatch/drivers');
          const data = await response.json();
          if (data.success) {
            set({ drivers: data.data });
          }
        } catch (error) {
          console.error('Failed to fetch drivers:', error);
        }
      },
      
      fetchUnits: async () => {
        try {
          const response = await fetch('/api/dispatch/units');
          const data = await response.json();
          if (data.success) {
            set({ units: data.data });
          }
        } catch (error) {
          console.error('Failed to fetch units:', error);
        }
      },
      
      fetchOrderBids: async (orderId: string) => {
        try {
          const response = await fetch(`/api/dispatch/orders/${orderId}/bids`);
          const data = await response.json();
          if (data.success) {
            set({ selectedOrderBids: data.data });
          }
        } catch (error) {
          console.error('Failed to fetch bids:', error);
        }
      },
      
      refreshAll: async () => {
        const { fetchFleetOrders, fetchBrokerageOrders, fetchDrivers, fetchUnits } = get();
        await Promise.all([
          fetchFleetOrders(),
          fetchBrokerageOrders(),
          fetchDrivers(),
          fetchUnits(),
        ]);
      },
      
      // ========================================
      // ORDER ACTIONS
      // ========================================
      
      selectOrder: (orderId) => {
        set({ selectedOrderId: orderId });
        if (orderId) {
          get().fetchOrderBids(orderId);
        } else {
          set({ selectedOrderBids: [] });
        }
      },
      
      assignToFleet: async (orderId, driverId, unitId) => {
        try {
          const response = await fetch(`/api/dispatch/orders/${orderId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driverId, unitId }),
          });
          const data = await response.json();
          if (data.success) {
            get().refreshAll();
          }
        } catch (error) {
          console.error('Failed to assign order:', error);
        }
      },
      
      unassignFromFleet: async (orderId) => {
        try {
          const response = await fetch(`/api/dispatch/orders/${orderId}/unassign`, {
            method: 'POST',
          });
          const data = await response.json();
          if (data.success) {
            get().refreshAll();
          }
        } catch (error) {
          console.error('Failed to unassign order:', error);
        }
      },
      
      kickToBrokerage: async (orderId, reason) => {
        // Optimistic update
        get().moveOrderToBrokerage(orderId);
        
        try {
          const response = await fetch(`/api/dispatch/orders/${orderId}/kick`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          });
          const data = await response.json();
          if (!data.success) {
            // Revert on failure
            get().refreshAll();
          }
        } catch (error) {
          console.error('Failed to kick order:', error);
          get().refreshAll();
        }
      },
      
      postToCarriers: async (orderId) => {
        try {
          const response = await fetch(`/api/dispatch/orders/${orderId}/post`, {
            method: 'POST',
          });
          const data = await response.json();
          if (data.success) {
            set((state) => ({
              brokerageOrders: state.brokerageOrders.map((o) =>
                o.id === orderId
                  ? { ...o, postedToCarriers: true, postedAt: new Date().toISOString(), dispatchStatus: 'POSTED_EXTERNAL' as DispatchStatus }
                  : o
              ),
            }));
          }
        } catch (error) {
          console.error('Failed to post order:', error);
        }
      },
      
      unpostFromCarriers: async (orderId) => {
        try {
          const response = await fetch(`/api/dispatch/orders/${orderId}/unpost`, {
            method: 'POST',
          });
          const data = await response.json();
          if (data.success) {
            set((state) => ({
              brokerageOrders: state.brokerageOrders.map((o) =>
                o.id === orderId
                  ? { ...o, postedToCarriers: false, postedAt: null, dispatchStatus: 'BROKERAGE_PENDING' as DispatchStatus }
                  : o
              ),
            }));
          }
        } catch (error) {
          console.error('Failed to unpost order:', error);
        }
      },
      
      // ========================================
      // BID ACTIONS
      // ========================================
      
      addBid: async (orderId, bid) => {
        try {
          const response = await fetch(`/api/dispatch/orders/${orderId}/bids`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bid),
          });
          const data = await response.json();
          if (data.success) {
            get().fetchOrderBids(orderId);
            get().fetchBrokerageOrders();
          }
        } catch (error) {
          console.error('Failed to add bid:', error);
        }
      },
      
      awardBid: async (orderId, bidId) => {
        try {
          const response = await fetch(`/api/dispatch/orders/${orderId}/award`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bidId }),
          });
          const data = await response.json();
          if (data.success) {
            // Remove from brokerage, it's now covered
            set((state) => ({
              brokerageOrders: state.brokerageOrders.filter((o) => o.id !== orderId),
            }));
            get().closeBidDrawer();
          }
        } catch (error) {
          console.error('Failed to award bid:', error);
        }
      },
      
      rejectBid: async (bidId, reason) => {
        try {
          const response = await fetch(`/api/dispatch/bids/${bidId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          });
          const data = await response.json();
          if (data.success) {
            const { selectedOrderId } = get();
            if (selectedOrderId) {
              get().fetchOrderBids(selectedOrderId);
            }
          }
        } catch (error) {
          console.error('Failed to reject bid:', error);
        }
      },
      
      // ========================================
      // UI ACTIONS
      // ========================================
      
      openBidModal: () => set({ isBidModalOpen: true }),
      closeBidModal: () => set({ isBidModalOpen: false }),
      
      openBidDrawer: (orderId) => {
        set({ selectedOrderId: orderId, isBidDrawerOpen: true });
        get().fetchOrderBids(orderId);
      },
      closeBidDrawer: () => set({ isBidDrawerOpen: false, selectedOrderId: null, selectedOrderBids: [] }),
      
      openAssignModal: (orderId) => set({ selectedOrderId: orderId, isAssignModalOpen: true }),
      closeAssignModal: () => set({ isAssignModalOpen: false }),
      
      openKickModal: (orderId) => set({ selectedOrderId: orderId, isKickModalOpen: true }),
      closeKickModal: () => set({ isKickModalOpen: false }),
      
      setDraggedOrder: (orderId) => set({ draggedOrderId: orderId }),
      
      // ========================================
      // FILTERS
      // ========================================
      
      setFleetFilter: (filter) =>
        set((state) => ({
          fleetFilter: { ...state.fleetFilter, ...filter },
        })),
      
      setBrokerageFilter: (filter) =>
        set((state) => ({
          brokerageFilter: { ...state.brokerageFilter, ...filter },
        })),
      
      // ========================================
      // OPTIMISTIC UPDATES
      // ========================================
      
      moveOrderToFleet: (orderId) => {
        set((state) => {
          const order = state.brokerageOrders.find((o) => o.id === orderId);
          if (!order) return state;
          
          return {
            brokerageOrders: state.brokerageOrders.filter((o) => o.id !== orderId),
            fleetOrders: [
              ...state.fleetOrders,
              { ...order, dispatchStatus: 'FLEET_DISPATCH' as DispatchStatus },
            ],
          };
        });
      },
      
      moveOrderToBrokerage: (orderId) => {
        set((state) => {
          const order = state.fleetOrders.find((o) => o.id === orderId);
          if (!order) return state;
          
          return {
            fleetOrders: state.fleetOrders.filter((o) => o.id !== orderId),
            brokerageOrders: [
              ...state.brokerageOrders,
              { 
                ...order, 
                dispatchStatus: 'BROKERAGE_PENDING' as DispatchStatus,
                assignedDriverId: null,
                assignedDriverName: null,
                assignedUnitId: null,
                assignedUnitNumber: null,
              },
            ],
          };
        });
      },
    })),
    { name: 'dispatch-store' }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectFleetOrdersFiltered = (state: DispatchState) => {
  let orders = state.fleetOrders;
  const { search, equipmentType } = state.fleetFilter;
  
  if (search) {
    const s = search.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(s) ||
        o.customerName?.toLowerCase().includes(s) ||
        o.pickupLocation?.toLowerCase().includes(s) ||
        o.dropoffLocation?.toLowerCase().includes(s)
    );
  }
  
  if (equipmentType) {
    orders = orders.filter((o) => o.equipmentType === equipmentType);
  }
  
  return orders;
};

export const selectBrokerageOrdersFiltered = (state: DispatchState) => {
  let orders = state.brokerageOrders;
  const { search, postedOnly, hasBids } = state.brokerageFilter;
  
  if (search) {
    const s = search.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(s) ||
        o.customerName?.toLowerCase().includes(s) ||
        o.pickupLocation?.toLowerCase().includes(s) ||
        o.dropoffLocation?.toLowerCase().includes(s)
    );
  }
  
  if (postedOnly) {
    orders = orders.filter((o) => o.postedToCarriers);
  }
  
  if (hasBids) {
    orders = orders.filter((o) => o.bidCount > 0);
  }
  
  return orders;
};

export const selectSelectedOrder = (state: DispatchState) => {
  if (!state.selectedOrderId) return null;
  return (
    state.fleetOrders.find((o) => o.id === state.selectedOrderId) ||
    state.brokerageOrders.find((o) => o.id === state.selectedOrderId) ||
    null
  );
};

export const selectAvailableDrivers = (state: DispatchState) => {
  return state.drivers.filter((d) => d.isActive);
};

export const selectAvailableUnits = (state: DispatchState) => {
  return state.units.filter((u) => u.isActive);
};
