"use client";

import { useState, useMemo } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { KanbanColumn } from "./components/KanbanColumn";
import { DriverAvailabilityBar } from "./components/DriverAvailabilityBar";
import { AICopilotSidebar } from "./components/AICopilotSidebar";
import { MOCK_DISPATCH_ORDERS, MOCK_DRIVERS, MOCK_AI_RECOMMENDATIONS } from "./mockData";
import {
  DispatchOrder,
  Driver,
  AIRecommendation,
  DispatchStatus,
  DispatchFilters,
} from "./types";

const STATUS_COLUMNS: { status: DispatchStatus; title: string }[] = [
  { status: "unassigned", title: "Unassigned" },
  { status: "assigned", title: "Assigned" },
  { status: "en_route_pickup", title: "En Route to Pickup" },
  { status: "at_pickup", title: "At Pickup" },
  { status: "in_transit", title: "In Transit" },
  { status: "at_delivery", title: "At Delivery" },
  { status: "completed", title: "Completed" },
];

export default function DispatchBoardPage() {
  // Filters
  const [filters, setFilters] = useState<DispatchFilters>({
    date: new Date().toISOString().split("T")[0],
    driverTypes: [],
    region: "All Regions",
  });
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);

  // Data
  const [orders, setOrders] = useState<DispatchOrder[]>(MOCK_DISPATCH_ORDERS);
  const [drivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(
    MOCK_AI_RECOMMENDATIONS
  );

  // Selected driver for assignment
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Filter orders by date and region
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Date filter (simplified - in real app, check pickup date)
      // For demo, just show all orders
      
      // Region filter - skip since origin/destination don't have region field
      // In real app would filter by region

      return true;
    });
  }, [orders, filters.date, filters.region]);

  // Filter drivers by type
  const filteredDrivers = useMemo(() => {
    if (filters.driverTypes.length === 0) return drivers;
    return drivers.filter((d) => filters.driverTypes.includes(d.type));
  }, [drivers, filters.driverTypes]);

  // Group orders by status
  const ordersByStatus = useMemo(() => {
    const grouped: Record<DispatchStatus, DispatchOrder[]> = {
      unassigned: [],
      assigned: [],
      en_route_pickup: [],
      at_pickup: [],
      in_transit: [],
      at_delivery: [],
      completed: [],
    };

    filteredOrders.forEach((order) => {
      grouped[order.status].push(order);
    });

    return grouped;
  }, [filteredOrders]);

  // Available drivers count
  const availableDriversCount = useMemo(() => {
    return filteredDrivers.filter((d) => d.status === "available").length;
  }, [filteredDrivers]);

  // Pending orders count
  const pendingOrdersCount = useMemo(() => {
    return ordersByStatus.unassigned.length + ordersByStatus.assigned.length;
  }, [ordersByStatus]);

  // Handle driver selection for assignment
  const handleDriverSelect = (driverId: string) => {
    setSelectedDriverId(driverId);
    console.log("Selected driver for assignment:", driverId);
    // In real app, show assignment UI or auto-assign next unassigned order
  };

  // Handle order assignment (drag-and-drop or click)
  const handleOrderAssign = (orderId: string, driverId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const foundDriver = drivers.find((d) => d.id === driverId);
          return {
            ...order,
            status: "assigned" as const,
            driver: foundDriver
              ? {
                  id: foundDriver.id,
                  name: foundDriver.name,
                  initials: foundDriver.initials,
                }
              : undefined,
          };
        }
        return order;
      })
    );
    setSelectedDriverId(null);
  };

  // Handle AI recommendation apply
  const handleApplyRecommendation = (rec: AIRecommendation) => {
    console.log("Applying recommendation:", rec);
    handleOrderAssign(rec.orderId, rec.driverId);
    setRecommendations((prev) => prev.filter((r) => r.id !== rec.id));
  };

  // Handle AI recommendation dismiss
  const handleDismissRecommendation = (recId: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== recId));
  };

  // Handle drag start (for future drag-and-drop implementation)
  const handleDragStart = (order: DispatchOrder) => {
    console.log("Drag started for order:", order.id);
    // In real app, implement drag-and-drop with dataTransfer
    // For now, just log the event
  };

  return (
    <div className="flex h-screen bg-[#0A0F1E] overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Control Panel */}
        <ControlPanel
          filters={filters}
          onFiltersChange={setFilters}
          availableDrivers={availableDriversCount}
          pendingOrders={pendingOrdersCount}
          autoDispatchEnabled={aiEnabled}
          onAutoDispatchToggle={setAiEnabled}
        />

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-4">
          <div className="flex gap-4 h-full min-w-max">
            {STATUS_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.status}
                title={col.title}
                orders={ordersByStatus[col.status]}
                onDragStart={handleDragStart}
                onOrderClick={(order) => console.log("Order clicked:", order.id)}
              />
            ))}
          </div>
        </div>

        {/* Driver Availability Bar */}
        <DriverAvailabilityBar
          drivers={filteredDrivers}
          onDriverClick={(driver) => handleDriverSelect(driver.id)}
        />
      </div>

      {/* AI Copilot Sidebar */}
      {aiEnabled && (
        <AICopilotSidebar
          recommendations={recommendations}
          onApplyRecommendation={handleApplyRecommendation}
          onDismissRecommendation={handleDismissRecommendation}
        />
      )}
    </div>
  );
}
