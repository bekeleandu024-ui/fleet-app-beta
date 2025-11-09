"use client";

import { X, Clock, DollarSign, User, MapPin, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { OrderDetail } from "../types";
import { formatCurrency, formatDateTime, formatDate, formatPercentage, marginColor } from "../utils";
import { useState } from "react";

interface OrderDetailSheetProps {
  order: OrderDetail | null;
  onClose: () => void;
}

export function OrderDetailSheet({ order, onClose }: OrderDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "costing" | "driver" | "tracking" | "documents">(
    "overview"
  );

  if (!order) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[640px] bg-[#0B1020] z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="border-b border-[#1E2638] p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#E6EAF2]">Order Details</h2>
            <code className="text-sm text-[#9AA4B2] font-mono">{order.id}</code>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1E2638] rounded-md transition-colors text-[#9AA4B2] hover:text-[#E6EAF2]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#1E2638] px-4 flex gap-6">
          {[
            { id: "overview", label: "Overview", icon: Clock },
            { id: "costing", label: "Costing", icon: DollarSign },
            { id: "driver", label: "Driver & Unit", icon: User },
            { id: "tracking", label: "Tracking", icon: MapPin },
            { id: "documents", label: "Documents", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-[#60A5FA] text-[#E6EAF2]"
                  : "border-transparent text-[#9AA4B2] hover:text-[#E6EAF2]"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "overview" && <OverviewTab order={order} />}
          {activeTab === "costing" && <CostingTab order={order} />}
          {activeTab === "driver" && <DriverTab order={order} />}
          {activeTab === "tracking" && <TrackingTab order={order} />}
          {activeTab === "documents" && <DocumentsTab order={order} />}
        </div>
      </div>
    </>
  );
}

function OverviewTab({ order }: { order: OrderDetail }) {
  return (
    <div className="space-y-4">
      {/* Key Details */}
      <div className="bg-[#121826] border border-[#1E2638] rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-[#6C7484] text-xs mb-1">Customer</div>
            <div className="text-[#E6EAF2]">{order.customer}</div>
          </div>
          <div>
            <div className="text-[#6C7484] text-xs mb-1">Order Type</div>
            <div className="text-[#E6EAF2] capitalize">{order.type.replace("_", " ")}</div>
          </div>
          <div>
            <div className="text-[#6C7484] text-xs mb-1">Origin</div>
            <div className="text-[#E6EAF2]">
              {order.origin.city}, {order.origin.state}
            </div>
          </div>
          <div>
            <div className="text-[#6C7484] text-xs mb-1">Destination</div>
            <div className="text-[#E6EAF2]">
              {order.destination.city}, {order.destination.state}
            </div>
          </div>
          <div>
            <div className="text-[#6C7484] text-xs mb-1">Distance</div>
            <div className="text-[#E6EAF2]">{order.miles} mi</div>
          </div>
          <div>
            <div className="text-[#6C7484] text-xs mb-1">AI Risk</div>
            <div className="text-[#FFC857]">{order.aiRisk}/100</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-[#121826] border border-[#1E2638] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#E6EAF2] mb-3">Timeline</h3>
        <div className="space-y-3">
          {[
            { label: "Created", time: order.timeline.created, completed: true },
            { label: "Assigned", time: order.timeline.assigned, completed: !!order.timeline.assigned },
            { label: "Pickup", time: order.timeline.pickup, completed: !!order.timeline.pickup },
            { label: "Delivery", time: order.timeline.delivery, completed: !!order.timeline.delivery },
            { label: "Completed", time: order.timeline.completed, completed: !!order.timeline.completed },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  step.completed ? "bg-[#24D67B]" : "bg-[#1E2638]"
                }`}
              />
              <div className="flex-1">
                <div className="text-sm text-[#E6EAF2]">{step.label}</div>
                <div className="text-xs text-[#6C7484]">{step.time ? formatDateTime(step.time) : "Pending"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className="bg-[#121826] border border-[#1E2638] rounded-lg p-4">
          <h3 className="text-sm font-medium text-[#E6EAF2] mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#FFC857]" />
            Special Instructions
          </h3>
          <p className="text-sm text-[#9AA4B2]">{order.specialInstructions}</p>
        </div>
      )}
    </div>
  );
}

function CostingTab({ order }: { order: OrderDetail }) {
  const breakdown = order.costBreakdown;
  const margin = order.revenueUsd - breakdown.total;
  const marginPct = order.marginPct;

  return (
    <div className="space-y-4">
      {/* Cost Breakdown */}
      <div className="bg-[#121826] border border-[#1E2638] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#E6EAF2] mb-3">Cost Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#9AA4B2]">Fixed Costs</span>
            <span className="text-[#E6EAF2] font-mono">{formatCurrency(breakdown.fixed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9AA4B2]">Wage Costs</span>
            <span className="text-[#E6EAF2] font-mono">{formatCurrency(breakdown.wage)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9AA4B2]">Rolling Costs</span>
            <span className="text-[#E6EAF2] font-mono">{formatCurrency(breakdown.rolling)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9AA4B2]">Accessorials</span>
            <span className="text-[#E6EAF2] font-mono">{formatCurrency(breakdown.accessorials)}</span>
          </div>
          <div className="border-t border-[#1E2638] pt-2 flex justify-between font-medium">
            <span className="text-[#E6EAF2]">Total Cost</span>
            <span className="text-[#E6EAF2] font-mono">{formatCurrency(breakdown.total)}</span>
          </div>
        </div>
      </div>

      {/* Revenue & Margin */}
      <div className="bg-[#121826] border border-[#1E2638] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#E6EAF2] mb-3">Revenue & Margin</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#9AA4B2]">Revenue</span>
            <span className="text-[#E6EAF2] font-mono">{formatCurrency(order.revenueUsd)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9AA4B2]">Cost</span>
            <span className="text-[#E6EAF2] font-mono">{formatCurrency(breakdown.total)}</span>
          </div>
          <div className="border-t border-[#1E2638] pt-2 flex justify-between font-medium">
            <span className="text-[#E6EAF2]">Margin</span>
            <div className="flex items-center gap-2">
              <span className="text-[#E6EAF2] font-mono">{formatCurrency(margin)}</span>
              <span className={`px-2 py-0.5 rounded-md text-xs border ${marginColor(marginPct)}`}>
                {formatPercentage(marginPct)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Market Insight */}
      {order.marketRate && (
        <div className="bg-[#60A5FA]/5 border border-[#60A5FA]/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-[#60A5FA] mt-0.5" />
            <div>
              <div className="text-sm font-medium text-[#E6EAF2] mb-1">🤖 AI Market Insight</div>
              <p className="text-sm text-[#9AA4B2]">
                Market rate for this lane: <span className="text-[#60A5FA]">{formatCurrency(order.marketRate)}/mi</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DriverTab({ order }: { order: OrderDetail }) {
  return (
    <div className="space-y-4">
      {/* Current Driver */}
      {order.driver && (
        <div className="bg-[#121826] border border-[#1E2638] rounded-lg p-4">
          <h3 className="text-sm font-medium text-[#E6EAF2] mb-3">Assigned Driver</h3>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-[#60A5FA]/20 flex items-center justify-center text-[#60A5FA] font-medium">
              {order.driver.initials}
            </div>
            <div>
              <div className="text-[#E6EAF2] font-medium">{order.driver.name}</div>
              <div className="text-sm text-[#6C7484]">ID: {order.driver.id}</div>
            </div>
          </div>
          {order.driver.hosRemaining !== undefined && (
            <div className="text-sm">
              <span className="text-[#9AA4B2]">HOS Remaining: </span>
              <span className="text-[#E6EAF2]">{order.driver.hosRemaining.toFixed(1)} hours</span>
            </div>
          )}
        </div>
      )}

      {/* Unit */}
      {order.unit && (
        <div className="bg-[#121826] border border-[#1E2638] rounded-lg p-4">
          <h3 className="text-sm font-medium text-[#E6EAF2] mb-3">Assigned Unit</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[#6C7484] text-xs mb-1">Unit ID</div>
              <div className="text-[#E6EAF2]">{order.unit.id}</div>
            </div>
            <div>
              <div className="text-[#6C7484] text-xs mb-1">Make & Model</div>
              <div className="text-[#E6EAF2]">
                {order.unit.make} {order.unit.model}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alternative Drivers */}
      {order.alternateDrivers && order.alternateDrivers.length > 0 && (
        <div className="bg-[#121826] border border-[#1E2638] rounded-lg p-4">
          <h3 className="text-sm font-medium text-[#E6EAF2] mb-3">🤖 Alternative Drivers</h3>
          <div className="space-y-2">
            {order.alternateDrivers.map((alt) => (
              <div
                key={alt.driver.id}
                className="flex items-center justify-between p-3 bg-[#0B1020] rounded-lg border border-[#1E2638]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#60A5FA]/20 flex items-center justify-center text-[#60A5FA] text-xs font-medium">
                    {alt.driver.initials}
                  </div>
                  <div>
                    <div className="text-sm text-[#E6EAF2]">{alt.driver.name}</div>
                    <div className="text-xs text-[#6C7484]">
                      {alt.costDelta > 0 ? "+" : ""}
                      {formatCurrency(alt.costDelta)} • {alt.etaDelta > 0 ? "+" : ""}
                      {alt.etaDelta.toFixed(1)}h ETA
                    </div>
                  </div>
                </div>
                <button className="text-xs text-[#60A5FA] hover:underline">Reassign</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrackingTab({ order }: { order: OrderDetail }) {
  return (
    <div className="space-y-4">
      {/* Event History */}
      <div className="bg-[#121826] border border-[#1E2638] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#E6EAF2] mb-3">Event History</h3>
        {order.events && order.events.length > 0 ? (
          <div className="space-y-3">
            {order.events.map((event, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-[#24D67B] mt-1.5" />
                <div className="flex-1">
                  <div className="text-sm text-[#E6EAF2]">{event.event}</div>
                  <div className="text-xs text-[#6C7484]">
                    {formatDateTime(event.timestamp)}
                    {event.location && ` • ${event.location}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6C7484]">No tracking events yet</p>
        )}
      </div>
    </div>
  );
}

function DocumentsTab({ order }: { order: OrderDetail }) {
  return (
    <div className="space-y-4">
      <div className="bg-[#121826] border border-[#1E2638] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#E6EAF2] mb-3">Documents</h3>
        {order.documents && order.documents.length > 0 ? (
          <div className="space-y-2">
            {order.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-[#0B1020] rounded-lg border border-[#1E2638]"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-[#9AA4B2]" />
                  <div>
                    <div className="text-sm text-[#E6EAF2]">{doc.type}</div>
                    <div className="text-xs text-[#6C7484]">Uploaded {formatDate(doc.uploadedAt)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-[#60A5FA] hover:underline">View</button>
                  <button className="text-xs text-[#60A5FA] hover:underline">Download</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6C7484]">No documents uploaded yet</p>
        )}
      </div>
      <button className="w-full py-2 border border-dashed border-[#1E2638] rounded-lg text-sm text-[#9AA4B2] hover:border-[#60A5FA]/40 hover:text-[#E6EAF2] transition-colors">
        Upload Document
      </button>
    </div>
  );
}
