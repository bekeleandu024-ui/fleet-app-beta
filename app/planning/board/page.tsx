'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import { OrderListItem, TripListItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Truck, Package, MapPin, Calendar, ArrowRight, Plus } from 'lucide-react';

interface UnitItem {
  id: string;
  code: string;
  driverName: string;
  status: string;
}

function DraggableOrder({ order }: { order: OrderListItem }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `order-${order.id}`,
    data: { order },
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes} 
      className="group w-full p-3 mb-3 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm cursor-move hover:border-zinc-600 hover:bg-zinc-800 transition-colors"
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className="font-mono text-xs text-blue-400 font-medium truncate flex-1 min-w-0" title={order.orderNumber || order.reference}>
          {order.orderNumber || order.reference}
        </span>
        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-zinc-700 text-zinc-400 shrink-0">
          {order.status}
        </Badge>
      </div>
      <div className="text-sm font-medium text-zinc-200 mb-2 truncate" title={order.customer}>{order.customer}</div>
      
      <div className="space-y-1.5">
        <div className="flex items-center text-xs text-zinc-500">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shrink-0" />
          <span className="truncate flex-1 min-w-0" title={order.pickup}>{order.pickup}</span>
        </div>
        <div className="pl-[3px] border-l border-zinc-800 ml-[3px] h-2" />
        <div className="flex items-center text-xs text-zinc-500">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 shrink-0" />
          <span className="truncate flex-1 min-w-0" title={order.delivery}>{order.delivery}</span>
        </div>
      </div>
    </div>
  );
}

function DroppableTrip({ trip, children }: { trip: TripListItem; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `trip-${trip.id}`,
    data: { trip },
    disabled: !!trip.orderId,
  });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`p-4 border rounded-lg transition-colors ${
        isOver 
          ? 'bg-blue-950/30 border-blue-500/50' 
          : 'bg-zinc-900 border-zinc-800'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-zinc-400" />
            <span className="font-mono font-bold text-zinc-200">{trip.tripNumber}</span>
          </div>
          <div className="text-xs text-zinc-500 flex items-center gap-2">
            <span>{trip.driver}</span>
            <span className="text-zinc-700">•</span>
            <span>{trip.unit}</span>
          </div>
        </div>
        <Badge 
          variant="secondary" 
          className={`
            ${trip.status === 'active' ? 'bg-emerald-950 text-emerald-400 border-emerald-900' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}
          `}
        >
          {trip.status}
        </Badge>
      </div>

      <Separator className="bg-zinc-800 my-3" />

      {children}
      
      {trip.orderId ? (
         <div className="mt-2 p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-md">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-1">
              <Package className="w-3 h-3" />
              <span>Assigned Order</span>
            </div>
            <div className="text-sm text-zinc-300 font-mono">{trip.orderId}</div>
         </div>
      ) : (
        <div className={`
          mt-2 p-4 border border-dashed rounded-md text-center text-xs transition-colors
          ${isOver ? 'border-blue-500/50 text-blue-400 bg-blue-950/20' : 'border-zinc-800 text-zinc-600'}
        `}>
          Drop Order Here
        </div>
      )}
    </div>
  );
}

function DroppableUnit({ unit, children }: { unit: UnitItem; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `unit-${unit.id}`,
    data: { unit, type: 'unit' },
  });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`p-4 border rounded-lg transition-colors ${
        isOver 
          ? 'bg-blue-950/30 border-blue-500/50' 
          : 'bg-zinc-900 border-zinc-800'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-zinc-400" />
            <span className="font-mono font-bold text-zinc-200">{unit.code}</span>
          </div>
          <div className="text-xs text-zinc-500 flex items-center gap-2">
            <span>{unit.driverName || 'No Driver'}</span>
          </div>
        </div>
        <Badge variant="secondary" className="bg-emerald-950 text-emerald-400 border-emerald-900">
          Available
        </Badge>
      </div>
      
      <Separator className="bg-zinc-800 my-3" />
      
      {children}

      <div className={`
          mt-2 p-4 border border-dashed rounded-md text-center text-xs transition-colors flex flex-col items-center justify-center gap-2
          ${isOver ? 'border-blue-500/50 text-blue-400 bg-blue-950/20' : 'border-zinc-800 text-zinc-600'}
        `}>
          <Plus className="w-4 h-4" />
          <span>Create Trip</span>
      </div>
    </div>
  );
}

export default function PlanningBoardPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<OrderListItem | null>(null);

  useEffect(() => {
    fetch('/api/orders').then(res => res.json()).then(data => {
        if (data.data) {
            setOrders(data.data.filter((o: OrderListItem) => o.status === 'New'));
        }
    });
    fetch('/api/trips?status=active').then(res => res.json()).then(data => {
        if (data.data) {
            setTrips(data.data);
        }
    });
    fetch('/api/units?active=true').then(res => res.json()).then(data => {
        if (data.data) {
            setUnits(data.data.filter((u: UnitItem) => u.status === 'Available'));
        }
    });
  }, []);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
    setActiveOrder(event.active.data.current?.order);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveOrder(null);

    if (over && active.id !== over.id) {
      const orderId = String(active.id).replace('order-', '');
      const targetId = String(over.id);
      
      // Optimistic update helper
      const removeOrder = () => setOrders(prev => prev.filter(o => o.id !== orderId));

      if (targetId.startsWith('trip-')) {
          const tripId = targetId.replace('trip-', '');
          const targetTrip = trips.find(t => t.id === tripId);
          
          if (targetTrip?.orderId) {
              alert("This trip already has an order assigned.");
              return;
          }

          removeOrder();
          setTrips(trips.map(t => t.id === tripId ? { ...t, orderId } : t));

          try {
            const res = await fetch(`/api/trips/${tripId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });
            if (!res.ok) throw new Error("Failed to assign");
          } catch (e) {
              console.error(e);
              alert("Error assigning order.");
              // Ideally revert state here
          }
      } else if (targetId.startsWith('unit-')) {
          const unitId = targetId.replace('unit-', '');
          
          removeOrder();
          // Remove unit from available list as it's now becoming a trip
          setUnits(prev => prev.filter(u => u.id !== unitId));
          
          // Add a temporary trip to the list for immediate feedback
          const unit = units.find(u => u.id === unitId);
          const tempTrip: TripListItem = {
              id: 'temp-' + Date.now(),
              tripNumber: 'CREATING...',
              driver: unit?.driverName || 'Unknown',
              unit: unit?.code || 'Unknown',
              status: 'active',
              orderId: orderId,
              pickup: '...',
              delivery: '...',
              eta: '...',
              lastPing: new Date().toISOString(),
              exceptions: 0
          };
          setTrips(prev => [tempTrip, ...prev]);

          try {
            const res = await fetch('/api/trips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, unitId })
            });
            
            if (res.ok) {
                // Refresh trips to get the real one
                const data = await res.json();
                // Could replace temp trip with real one, or just re-fetch
                fetch('/api/trips?status=active').then(r => r.json()).then(d => {
                    if (d.data) setTrips(d.data);
                });
            } else {
                throw new Error("Failed to create trip");
            }
          } catch (e) {
              console.error(e);
              alert("Error creating trip.");
          }
      }
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-black text-zinc-300">
      <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Load Planning Board</h1>
          <p className="text-xs text-zinc-500 mt-1">Drag unassigned orders to active trips to build manifests</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-800">
              {orders.length} Unassigned
           </Badge>
           <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-800">
              {trips.length} Active Trips
           </Badge>
           <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-800">
              {units.length} Available Units
           </Badge>
        </div>
      </div>
      
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Unassigned Orders */}
          <div className="w-[420px] flex flex-col border-r border-zinc-800 bg-zinc-950/50 min-h-0">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Unassigned Orders</h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 pr-6">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
                      <Package className="w-8 h-8 mb-2 opacity-20" />
                      <span className="text-sm">No unassigned orders</span>
                    </div>
                ) : (
                    orders.map(order => (
                      <DraggableOrder key={order.id} order={order} />
                    ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: Active Trips */}
          <div className="flex-1 flex flex-col bg-black min-h-0">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Active Fleet & Trips</h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Active Trips */}
                  {trips.map(trip => (
                    <DroppableTrip key={trip.id} trip={trip} />
                  ))}
                  
                  {/* Available Units */}
                  {units.map(unit => (
                    <DroppableUnit key={unit.id} unit={unit} />
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
        <DragOverlay>
            {activeOrder ? (
                 <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl w-[300px] opacity-90">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400 font-medium">{activeOrder.orderNumber || activeOrder.reference}</span>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-zinc-600 text-zinc-400">
                        {activeOrder.status}
                      </Badge>
                    </div>
                    <div className="text-sm font-medium text-zinc-200 mb-1">{activeOrder.customer}</div>
                 </div>
            ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
