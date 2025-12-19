"use client";

import React, { useEffect, useState } from "react";
import { LifecycleTimeline } from "./LifecycleTimeline";
import { ServicePanel } from "./ServicePanel";
import { TimelineDrawer } from "./TimelineDrawer";
import { JSONViewer } from "./JSONViewer";
import { ExportButton } from "./ExportButton";
import { RefreshCw, AlertCircle } from "lucide-react";

interface LifecycleDashboardProps {
  orderId: string;
}

export function LifecycleDashboard({ orderId }: LifecycleDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jsonModal, setJsonModal] = useState<{ isOpen: boolean; data: any; title: string }>({
    isOpen: false,
    data: null,
    title: "",
  });

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/order-lifecycle/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch lifecycle data");
      const jsonData = await res.json();
      setData(jsonData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading lifecycle data...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-red-400">
        <AlertCircle className="w-6 h-6 mr-2" />
        {error}
      </div>
    );
  }

  const { orderService, trackingService, dispatchService, masterDataService, timeline, stats } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">ORDER LIFECYCLE DASHBOARD</h1>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
              <span className="font-mono text-blue-400">{orderId}</span>
              <span>→</span>
              <span className="font-mono text-green-400">{data.tripId || "Pending"}</span>
              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs border border-green-500/20 ml-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Live
              </span>
            </div>
          </div>
          <ExportButton />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Visual Flow */}
        <LifecycleTimeline 
          statusHistory={orderService.statusHistory} 
          currentStatus={orderService.order?.status || "New"} 
        />

        {/* Service Inspector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Orders Service */}
          <ServicePanel
            title="ORDERS SERVICE"
            color="blue"
            data={orderService}
            onViewJson={() => setJsonModal({ isOpen: true, data: orderService, title: "Orders Service Data" })}
            onViewQuery={() => setJsonModal({ isOpen: true, data: { query: `SELECT * FROM orders WHERE id = '${orderId}'` }, title: "Orders Database Query" })}
            checks={[
              { label: "Order Record Stored", value: `ID: ${orderService.order?.id}` },
              { label: "Status History", value: `${orderService.statusHistory?.length || 0} states recorded` },
              { label: "Pricing Data", value: `Revenue: $${orderService.order?.revenue}` },
            ]}
          />

          {/* Tracking Service */}
          <ServicePanel
            title="TRACKING SERVICE"
            color="green"
            data={trackingService}
            onViewJson={() => setJsonModal({ isOpen: true, data: trackingService, title: "Tracking Service Data" })}
            onViewQuery={() => setJsonModal({ isOpen: true, data: { query: `SELECT * FROM trips WHERE order_id = '${orderId}'` }, title: "Tracking Database Query" })}
            checks={[
              { label: "Trip Record Stored", value: `ID: ${trackingService.trip?.id || "N/A"}` },
              { label: "Location Updates", value: `${trackingService.locationUpdates?.count || 0} records` },
              { label: "Events", value: `${trackingService.events?.length || 0} recorded` },
            ]}
          />

          {/* Dispatch Service */}
          <ServicePanel
            title="DISPATCH SERVICE"
            color="orange"
            data={dispatchService}
            onViewJson={() => setJsonModal({ isOpen: true, data: dispatchService, title: "Dispatch Service Data" })}
            onViewQuery={() => setJsonModal({ isOpen: true, data: { query: `SELECT * FROM assignments WHERE order_id = '${orderId}'` }, title: "Dispatch Database Query" })}
            checks={[
              { label: "Assignment Created", value: `ID: ${dispatchService.assignment?.id || "N/A"}` },
              { label: "Resources Linked", value: dispatchService.assignment?.driverId ? "Driver & Unit Linked" : "Pending" },
              { label: "Status Transitions", value: `${dispatchService.statusHistory?.length || 0} transitions` },
            ]}
          />

          {/* Master Data Service */}
          <ServicePanel
            title="MASTER DATA SERVICE"
            color="purple"
            data={masterDataService}
            onViewJson={() => setJsonModal({ isOpen: true, data: masterDataService, title: "Master Data Service Data" })}
            onViewQuery={() => setJsonModal({ isOpen: true, data: { query: `SELECT * FROM drivers WHERE id = '${masterDataService.driver?.id || "..."}'` }, title: "Master Data Database Query" })}
            checks={[
              { label: "Driver Record Accessed", value: masterDataService.driver?.name || "N/A" },
              { label: "Unit Record Accessed", value: masterDataService.unit?.unitNumber || "N/A" },
              { label: "Customer Record", value: masterDataService.customer?.name || "N/A" },
            ]}
          />
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mt-8 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.totalOperations}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Total Operations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.servicesTouched}/4</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Services Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.durationMinutes}m</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Lifecycle Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.locationUpdatesStored}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Telemetry Points</div>
          </div>
        </div>
      </div>

      {/* Timeline Drawer */}
      <TimelineDrawer events={timeline} />

      {/* JSON Modal */}
      <JSONViewer 
        isOpen={jsonModal.isOpen} 
        onClose={() => setJsonModal({ ...jsonModal, isOpen: false })} 
        data={jsonModal.data} 
        title={jsonModal.title} 
      />
    </div>
  );
}
