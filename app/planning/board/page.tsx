'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import { OrderListItem, TripListItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Truck, Package, MapPin, Calendar, ArrowRight } from 'lucide-react';

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
      className="group p-3 mb-3 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm cursor-move hover:border-zinc-600 hover:bg-zinc-800 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-xs text-blue-400 font-medium">{order.orderNumber || order.reference}</span>
        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-zinc-700 text-zinc-400">
          {order.status}
        </Badge>
      </div>
      <div className="text-sm font-medium text-zinc-200 mb-2 truncate">{order.customer}</div>
      
      <div className="space-y-1.5">
        <div className="flex items-center text-xs text-zinc-500">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
          <span className="truncate">{order.pickup}</span>
        </div>
        <div className="pl-[3px] border-l border-zinc-800 ml-[3px] h-2" />
        <div className="flex items-center text-xs text-zinc-500">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
          <span className="truncate">{order.delivery}</span>
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

export default function PlanningBoardPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [trips, setTrips] = useState<TripListItem[]>([]);
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
      const tripId = String(over.id).replace('trip-', '');

      const targetTrip = trips.find(t => t.id === tripId);
      if (targetTrip?.orderId) {
          alert("This trip already has an order assigned.");
          return;
      }

      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      setOrders(orders.filter(o => o.id !== orderId));

      setTrips(trips.map(t => {
          if (t.id === tripId) {
              return { ...t, orderId: orderId }; 
          }
          return t;
      }));

      try {
        const res = await fetch(`/api/trips/${tripId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
        });
        if (!res.ok) {
            console.error("Failed to assign order");
            alert("Failed to assign order on server.");
        }
      } catch (e) {
          console.error(e);
          alert("Error assigning order.");
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
        </div>
      </div>
      
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Unassigned Orders */}
          <div className="w-[350px] flex flex-col border-r border-zinc-800 bg-zinc-950/50">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950">
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Unassigned Orders</h2>
            </div>
            <ScrollArea className="flex-1 p-4">
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
            </ScrollArea>
          </div>

          {/* Right Panel: Active Trips */}
          <div className="flex-1 flex flex-col bg-black">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950">
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Active Fleet & Trips</h2>
            </div>
            <ScrollArea className="flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {trips.map(trip => (
                    <DroppableTrip key={trip.id} trip={trip} />
                  ))}
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
