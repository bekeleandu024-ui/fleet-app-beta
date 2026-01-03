import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

// ============================================================================
// TYPES
// ============================================================================

export type DispatchStatus = 
  | 'NEW'
  | 'PLANNED'
  | 'FLEET_DISPATCH'
  | 'BROKERAGE_PENDING'
  | 'POSTED_EXTERNAL'
  | 'COVERED_INTERNAL'
  | 'COVERED_EXTERNAL';

// Draft Trip - Consolidated Shipment in Planning stage
export interface DraftTrip {
  id: string;
  tripNumber: string;
  orderIds: string[];
  orders: DispatchOrder[];
  // Aggregated data
  totalWeightLbs: number;
  totalPallets: number;
  totalStops: number;
  projectedRevenue: number;
  projectedCost: number;
  projectedMargin: number;
  // Route info
  pickupLocations: string[];
  dropoffLocations: string[];
  equipmentType: string;
  // Assignment info
  assignedResourceId: string | null;
  assignedResourceType: 'driver' | 'carrier' | null;
  assignedResourceName: string | null;
  // Metadata
  createdAt: string;
  status: 'draft' | 'ready' | 'published';
}

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
  driverCategory: string | null;
  region: string | null;
  status: string | null;
  hosHoursRemaining: string | null;
  baseWageCpm: string | null;
  effectiveWageCpm: string | null;
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
  demandOrders: DispatchOrder[]; // NEW status orders (Order Pool)
  draftTrips: DraftTrip[]; // Planning/Staging area
  drivers: Driver[];
  units: Unit[];
  selectedOrderId: string | null;
  selectedOrderBids: CarrierBid[];
  selectedOrderIds: string[]; // Multi-select for grouping
  selectedTripId: string | null;
  
  // UI State
  isLoading: boolean;
  isBidModalOpen: boolean;
  isBidDrawerOpen: boolean;
  isAssignModalOpen: boolean;
  isKickModalOpen: boolean;
  draggedOrderId: string | null;
  draggedTripId: string | null;
  activeColumn: 'demand' | 'planning' | 'execution' | null;
  executionTab: 'fleet' | 'brokerage';
  
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
  demandFilter: {
    search: string;
    equipmentType: string | null;
    customer: string | null;
  };
}

interface DispatchActions {
  // Data Fetching
  fetchFleetOrders: () => Promise<void>;
  fetchBrokerageOrders: () => Promise<void>;
  fetchDemandOrders: () => Promise<void>;
  fetchDrivers: () => Promise<void>;
  fetchUnits: () => Promise<void>;
  fetchOrderBids: (orderId: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Order Actions
  selectOrder: (orderId: string | null) => void;
  toggleOrderSelection: (orderId: string) => void;
  clearOrderSelection: () => void;
  selectAllOrders: (orderIds: string[]) => void;
  assignToFleet: (orderId: string, driverId: string, unitId?: string) => Promise<void>;
  unassignFromFleet: (orderId: string) => Promise<void>;
  kickToBrokerage: (orderId: string, reason?: string) => Promise<void>;
  postToCarriers: (orderId: string) => Promise<void>;
  unpostFromCarriers: (orderId: string) => Promise<void>;
  
  // Draft Trip Actions (NEW)
  createDraftTrip: (orderIds: string[]) => void;
  addOrderToTrip: (tripId: string, orderId: string) => void;
  removeOrderFromTrip: (tripId: string, orderId: string) => void;
  deleteDraftTrip: (tripId: string) => void;
  publishTrip: (tripId: string, resourceId: string, resourceType: 'driver' | 'carrier') => Promise<boolean>;
  selectTrip: (tripId: string | null) => void;
  
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
  setDraggedTrip: (tripId: string | null) => void;
  setActiveColumn: (column: 'demand' | 'planning' | 'execution' | null) => void;
  setExecutionTab: (tab: 'fleet' | 'brokerage') => void;
  
  // Filters
  setFleetFilter: (filter: Partial<DispatchState['fleetFilter']>) => void;
  setBrokerageFilter: (filter: Partial<DispatchState['brokerageFilter']>) => void;
  setDemandFilter: (filter: Partial<DispatchState['demandFilter']>) => void;
  
  // Optimistic Updates
  moveOrderToFleet: (orderId: string) => void;
  moveOrderToBrokerage: (orderId: string) => void;
  moveOrderToPlanning: (orderId: string, tripId?: string) => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useDispatchStore = create<DispatchState & DispatchActions>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
      // Initial State
      fleetOrders: [],
      brokerageOrders: [],
      demandOrders: [],
      draftTrips: [],
      drivers: [],
      units: [],
      selectedOrderId: null,
      selectedOrderBids: [],
      selectedOrderIds: [],
      selectedTripId: null,
      
      isLoading: false,
      isBidModalOpen: false,
      isBidDrawerOpen: false,
      isAssignModalOpen: false,
      isKickModalOpen: false,
      draggedOrderId: null,
      draggedTripId: null,
      activeColumn: null,
      executionTab: 'fleet',
      
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
      demandFilter: {
        search: '',
        equipmentType: null,
        customer: null,
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
      
      fetchDemandOrders: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/dispatch/orders?status=NEW');
          const data = await response.json();
          if (data.success) {
            set({ demandOrders: data.data });
          }
        } catch (error) {
          console.error('Failed to fetch demand orders:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      fetchDrivers: async () => {
        try {
          console.log('[fetchDrivers] Fetching...');
          const response = await fetch('/api/dispatch/drivers');
          const data = await response.json();
          console.log('[fetchDrivers] Response:', data);
          if (data.success) {
            set({ drivers: data.data });
            console.log('[fetchDrivers] Set drivers:', data.data.length);
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
        const { fetchFleetOrders, fetchBrokerageOrders, fetchDemandOrders, fetchDrivers, fetchUnits } = get();
        await Promise.all([
          fetchFleetOrders(),
          fetchBrokerageOrders(),
          fetchDemandOrders(),
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
      
      toggleOrderSelection: (orderId) => {
        set((state) => {
          const isSelected = state.selectedOrderIds.includes(orderId);
          return {
            selectedOrderIds: isSelected
              ? state.selectedOrderIds.filter((id) => id !== orderId)
              : [...state.selectedOrderIds, orderId],
          };
        });
      },
      
      clearOrderSelection: () => {
        set({ selectedOrderIds: [] });
      },
      
      selectAllOrders: (orderIds) => {
        set({ selectedOrderIds: orderIds });
      },
      
      // ========================================
      // DRAFT TRIP ACTIONS
      // ========================================
      
      createDraftTrip: (orderIds) => {
        console.log('[createDraftTrip] Called with orderIds:', orderIds);
        
        const state = get();
        
        // Deduplicate orderIds
        const uniqueOrderIds = [...new Set(orderIds)];
        console.log('[createDraftTrip] Unique orderIds:', uniqueOrderIds);
        
        // Check for duplicates in source data
        const allOrders = [...state.demandOrders, ...state.fleetOrders];
        console.log('[createDraftTrip] All demandOrders:', state.demandOrders.map(o => o.orderNumber));
        console.log('[createDraftTrip] All fleetOrders:', state.fleetOrders.map(o => o.orderNumber));
        
        const orders = allOrders.filter((o) => uniqueOrderIds.includes(o.id));
        
        console.log('[createDraftTrip] Matched orders:', orders.length, orders.map(o => ({ id: o.id, num: o.orderNumber })));
        
        if (orders.length === 0) return;
        
        // Deduplicate orders by id as well (in case source has duplicates)
        const uniqueOrders = orders.filter((order, index, self) => 
          index === self.findIndex((o) => o.id === order.id)
        );
        
        console.log('[createDraftTrip] After dedup, uniqueOrders:', uniqueOrders.length, uniqueOrders.map(o => o.orderNumber));
        
        const tripId = nanoid(10);
        const tripNumber = `DFT-${Date.now().toString(36).toUpperCase()}`;
        
        // Aggregate order data using deduplicated orders
        const totalWeightLbs = uniqueOrders.reduce((sum, o) => sum + (o.totalWeightLbs || 0), 0);
        const totalPallets = uniqueOrders.reduce((sum, o) => sum + (o.totalPallets || 0), 0);
        const projectedRevenue = uniqueOrders.reduce((sum, o) => sum + (o.quotedRate || 0), 0);
        const projectedCost = projectedRevenue * 0.85; // Estimate 85% cost ratio
        
        const newTrip: DraftTrip = {
          id: tripId,
          tripNumber,
          orderIds: uniqueOrderIds,
          orders: uniqueOrders,
          totalWeightLbs,
          totalPallets,
          totalStops: uniqueOrders.length * 2, // Pickup + Delivery per order
          projectedRevenue,
          projectedCost,
          projectedMargin: projectedRevenue - projectedCost,
          pickupLocations: [...new Set(uniqueOrders.map((o) => o.pickupLocation))],
          dropoffLocations: [...new Set(uniqueOrders.map((o) => o.dropoffLocation))],
          equipmentType: uniqueOrders[0]?.equipmentType || 'Van',
          assignedResourceId: null,
          assignedResourceType: null,
          assignedResourceName: null,
          createdAt: new Date().toISOString(),
          status: 'draft',
        };
        
        set((state) => ({
          draftTrips: [...state.draftTrips, newTrip],
          demandOrders: state.demandOrders.filter((o) => !uniqueOrderIds.includes(o.id)),
          selectedOrderIds: [],
        }));
      },
      
      addOrderToTrip: (tripId, orderId) => {
        set((state) => {
          const order = state.demandOrders.find((o) => o.id === orderId);
          if (!order) return state;
          
          const tripIndex = state.draftTrips.findIndex((t) => t.id === tripId);
          if (tripIndex === -1) return state;
          
          const trip = state.draftTrips[tripIndex];
          
          // Prevent duplicate orders in the same trip
          if (trip.orderIds.includes(orderId)) return state;
          const updatedTrip: DraftTrip = {
            ...trip,
            orderIds: [...trip.orderIds, orderId],
            orders: [...trip.orders, order],
            totalWeightLbs: trip.totalWeightLbs + (order.totalWeightLbs || 0),
            totalPallets: trip.totalPallets + (order.totalPallets || 0),
            totalStops: trip.totalStops + 2,
            projectedRevenue: trip.projectedRevenue + (order.quotedRate || 0),
            projectedCost: (trip.projectedRevenue + (order.quotedRate || 0)) * 0.85,
            projectedMargin: (trip.projectedRevenue + (order.quotedRate || 0)) * 0.15,
            pickupLocations: [...new Set([...trip.pickupLocations, order.pickupLocation])],
            dropoffLocations: [...new Set([...trip.dropoffLocations, order.dropoffLocation])],
          };
          
          const newTrips = [...state.draftTrips];
          newTrips[tripIndex] = updatedTrip;
          
          return {
            draftTrips: newTrips,
            demandOrders: state.demandOrders.filter((o) => o.id !== orderId),
          };
        });
      },
      
      removeOrderFromTrip: (tripId, orderId) => {
        set((state) => {
          const tripIndex = state.draftTrips.findIndex((t) => t.id === tripId);
          if (tripIndex === -1) return state;
          
          const trip = state.draftTrips[tripIndex];
          const order = trip.orders.find((o) => o.id === orderId);
          if (!order) return state;
          
          // If only one order, delete the whole trip
          if (trip.orderIds.length === 1) {
            return {
              draftTrips: state.draftTrips.filter((t) => t.id !== tripId),
              demandOrders: [...state.demandOrders, order],
            };
          }
          
          const updatedTrip: DraftTrip = {
            ...trip,
            orderIds: trip.orderIds.filter((id) => id !== orderId),
            orders: trip.orders.filter((o) => o.id !== orderId),
            totalWeightLbs: trip.totalWeightLbs - (order.totalWeightLbs || 0),
            totalPallets: trip.totalPallets - (order.totalPallets || 0),
            totalStops: trip.totalStops - 2,
            projectedRevenue: trip.projectedRevenue - (order.quotedRate || 0),
            projectedCost: (trip.projectedRevenue - (order.quotedRate || 0)) * 0.85,
            projectedMargin: (trip.projectedRevenue - (order.quotedRate || 0)) * 0.15,
          };
          
          const newTrips = [...state.draftTrips];
          newTrips[tripIndex] = updatedTrip;
          
          return {
            draftTrips: newTrips,
            demandOrders: [...state.demandOrders, order],
          };
        });
      },
      
      deleteDraftTrip: (tripId) => {
        set((state) => {
          const trip = state.draftTrips.find((t) => t.id === tripId);
          if (!trip) return state;
          
          return {
            draftTrips: state.draftTrips.filter((t) => t.id !== tripId),
            demandOrders: [...state.demandOrders, ...trip.orders],
          };
        });
      },
      
      publishTrip: async (tripId, resourceId, resourceType) => {
        console.log('[publishTrip] Called with:', { tripId, resourceId, resourceType });
        const trip = get().draftTrips.find((t) => t.id === tripId);
        if (!trip) {
          console.log('[publishTrip] Trip not found in draftTrips');
          return false;
        }
        
        // Deduplicate orderIds
        const uniqueOrderIds = [...new Set(trip.orderIds)];
        console.log('[publishTrip] Publishing trip with orders:', uniqueOrderIds);
        
        try {
          const response = await fetch('/api/dispatch/trips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tripId,
              orderIds: uniqueOrderIds,
              resourceId,
              resourceType,
            }),
          });
          
          const data = await response.json();
          console.log('[publishTrip] API response:', data);
          if (data.success) {
            set((state) => ({
              draftTrips: state.draftTrips.filter((t) => t.id !== tripId),
            }));
            get().refreshAll();
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to publish trip:', error);
          return false;
        }
      },
      
      selectTrip: (tripId) => {
        set({ selectedTripId: tripId });
      },
      
      // ========================================
      // ORDER ACTIONS
      // ========================================
      
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
      setDraggedTrip: (tripId) => set({ draggedTripId: tripId }),
      setActiveColumn: (column) => set({ activeColumn: column }),
      setExecutionTab: (tab) => set({ executionTab: tab }),
      
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
      
      setDemandFilter: (filter) =>
        set((state) => ({
          demandFilter: { ...state.demandFilter, ...filter },
        })),
      
      // ========================================
      // OPTIMISTIC UPDATES
      // ========================================
      
      moveOrderToFleet: (orderId) => {
        set((state) => {
          const order = state.brokerageOrders.find((o) => o.id === orderId) 
            || state.demandOrders.find((o) => o.id === orderId);
          if (!order) return state;
          
          return {
            brokerageOrders: state.brokerageOrders.filter((o) => o.id !== orderId),
            demandOrders: state.demandOrders.filter((o) => o.id !== orderId),
            fleetOrders: [
              ...state.fleetOrders,
              { ...order, dispatchStatus: 'FLEET_DISPATCH' as DispatchStatus },
            ],
          };
        });
      },
      
      moveOrderToBrokerage: (orderId) => {
        set((state) => {
          const order = state.fleetOrders.find((o) => o.id === orderId)
            || state.demandOrders.find((o) => o.id === orderId);
          if (!order) return state;
          
          return {
            fleetOrders: state.fleetOrders.filter((o) => o.id !== orderId),
            demandOrders: state.demandOrders.filter((o) => o.id !== orderId),
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
      
      moveOrderToPlanning: (orderId, tripId) => {
        const state = get();
        const order = state.demandOrders.find((o) => o.id === orderId);
        if (!order) return;
        
        if (tripId) {
          // Add to existing trip
          get().addOrderToTrip(tripId, orderId);
        } else {
          // Create new trip with single order
          get().createDraftTrip([orderId]);
        }
      },
    })),
    {
      name: 'dispatch-draft-trips',
      partialize: (state) => ({ draftTrips: state.draftTrips }),
    }
    ),
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
    state.demandOrders.find((o) => o.id === state.selectedOrderId) ||
    null
  );
};

export const selectAvailableDrivers = (state: DispatchState) => {
  // Show all drivers - they can be assigned regardless of current status
  return state.drivers;
};

export const selectAvailableUnits = (state: DispatchState) => {
  return state.units.filter((u) => u.isActive);
};

// NEW SELECTORS for Kanban Board

export const selectDemandOrdersFiltered = (state: DispatchState) => {
  // Get all order IDs that are already in draft trips
  const orderIdsInDraftTrips = new Set(
    state.draftTrips.flatMap((trip) => trip.orderIds)
  );
  
  // Start with orders NOT already in a draft trip
  let orders = state.demandOrders.filter((o) => !orderIdsInDraftTrips.has(o.id));
  
  const { search, equipmentType, customer } = state.demandFilter;
  
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
  
  if (customer) {
    orders = orders.filter((o) => o.customerName === customer);
  }
  
  return orders;
};

export const selectDraftTrips = (state: DispatchState) => {
  return state.draftTrips;
};

export const selectSelectedTrip = (state: DispatchState) => {
  if (!state.selectedTripId) return null;
  return state.draftTrips.find((t) => t.id === state.selectedTripId) || null;
};

export const selectSelectedOrders = (state: DispatchState) => {
  return state.demandOrders.filter((o) => state.selectedOrderIds.includes(o.id));
};
