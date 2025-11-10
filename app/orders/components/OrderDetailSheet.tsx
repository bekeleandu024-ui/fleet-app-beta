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
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-[640px] flex-col bg-fleet-primary shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-fleet p-4">
          <div>
            <h2 className="text-lg font-semibold text-fleet-primary">Order Details</h2>
            <code className="font-mono text-sm text-fleet-secondary">{order.id}</code>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-fleet-secondary transition-colors hover:bg-fleet-secondary hover:text-fleet-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-fleet px-4">
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
              className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-fleet-accent text-fleet-primary"
                  : "border-transparent text-fleet-secondary hover:text-fleet-primary"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
  <div className="flex-1 space-y-4 overflow-y-auto p-4">
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
      <div className="space-y-3 rounded-lg border border-fleet bg-fleet-secondary p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="mb-1 text-xs text-fleet-muted">Customer</div>
            <div className="text-fleet-primary">{order.customer}</div>
          </div>
          <div>
            <div className="mb-1 text-xs text-fleet-muted">Order Type</div>
            <div className="capitalize text-fleet-primary">{order.type.replace("_", " ")}</div>
          </div>
          <div>
            <div className="mb-1 text-xs text-fleet-muted">Origin</div>
            <div className="text-fleet-primary">
              {order.origin.city}, {order.origin.state}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs text-fleet-muted">Destination</div>
            <div className="text-fleet-primary">
              {order.destination.city}, {order.destination.state}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs text-fleet-muted">Distance</div>
            <div className="text-fleet-primary">{order.miles} mi</div>
          </div>
          <div>
            <div className="mb-1 text-xs text-fleet-muted">AI Risk</div>
            <div className="text-fleet-warning">{order.aiRisk}/100</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-fleet bg-fleet-secondary p-4">
        <h3 className="mb-3 text-sm font-medium text-fleet-primary">Timeline</h3>
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
                className={`h-2 w-2 rounded-full ${
                  step.completed ? "bg-fleet-success" : "bg-fleet-tertiary"
                }`}
              />
              <div className="flex-1">
                <div className="text-sm text-fleet-primary">{step.label}</div>
                <div className="text-xs text-fleet-muted">{step.time ? formatDateTime(step.time) : "Pending"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className="rounded-lg border border-fleet bg-fleet-secondary p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-fleet-primary">
            <AlertCircle className="h-4 w-4 text-fleet-warning" />
            Special Instructions
          </h3>
          <p className="text-sm text-fleet-secondary">{order.specialInstructions}</p>
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
      <div className="rounded-lg border border-fleet bg-fleet-secondary p-4">
        <h3 className="mb-3 text-sm font-medium text-fleet-primary">Cost Breakdown</h3>
        <div className="space-y-2 text-sm text-fleet-primary">
          <div className="flex justify-between">
            <span className="text-fleet-secondary">Fixed Costs</span>
            <span className="font-mono">{formatCurrency(breakdown.fixed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fleet-secondary">Wage Costs</span>
            <span className="font-mono">{formatCurrency(breakdown.wage)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fleet-secondary">Rolling Costs</span>
            <span className="font-mono">{formatCurrency(breakdown.rolling)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fleet-secondary">Accessorials</span>
            <span className="font-mono">{formatCurrency(breakdown.accessorials)}</span>
          </div>
          <div className="flex justify-between border-t border-fleet pt-2 font-medium">
            <span>Total Cost</span>
            <span className="font-mono">{formatCurrency(breakdown.total)}</span>
          </div>
        </div>
      </div>

      {/* Revenue & Margin */}
      <div className="rounded-lg border border-fleet bg-fleet-secondary p-4">
        <h3 className="mb-3 text-sm font-medium text-fleet-primary">Revenue & Margin</h3>
        <div className="space-y-2 text-sm text-fleet-primary">
          <div className="flex justify-between">
            <span className="text-fleet-secondary">Revenue</span>
            <span className="font-mono">{formatCurrency(order.revenueUsd)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fleet-secondary">Cost</span>
            <span className="font-mono">{formatCurrency(breakdown.total)}</span>
          </div>
          <div className="flex justify-between border-t border-fleet pt-2 font-medium">
            <span>Margin</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{formatCurrency(margin)}</span>
              <span className={`px-2 py-0.5 rounded-md text-xs border ${marginColor(marginPct)}`}>
                {formatPercentage(marginPct)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Market Insight */}
      {order.marketRate && (
        <div className="rounded-lg border border-fleet-accent/20 bg-fleet-accent/10 p-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-0.5 h-4 w-4 text-fleet-accent" />
            <div>
              <div className="mb-1 text-sm font-medium text-fleet-primary">🤖 AI Market Insight</div>
              <p className="text-sm text-fleet-secondary">
                Market rate for this lane: <span className="text-fleet-accent">{formatCurrency(order.marketRate)}/mi</span>
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
        <div className="rounded-lg border border-fleet bg-fleet-secondary p-4">
          <h3 className="mb-3 text-sm font-medium text-fleet-primary">Assigned Driver</h3>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-fleet-accent/20 font-medium text-fleet-accent">
              {order.driver.initials}
            </div>
            <div>
              <div className="font-medium text-fleet-primary">{order.driver.name}</div>
              <div className="text-sm text-fleet-muted">ID: {order.driver.id}</div>
            </div>
          </div>
          {order.driver.hosRemaining !== undefined && (
            <div className="text-sm">
              <span className="text-fleet-secondary">HOS Remaining: </span>
              <span className="text-fleet-primary">{order.driver.hosRemaining.toFixed(1)} hours</span>
            </div>
          )}
        </div>
      )}

      {/* Unit */}
      {order.unit && (
        <div className="rounded-lg border border-fleet bg-fleet-secondary p-4">
          <h3 className="mb-3 text-sm font-medium text-fleet-primary">Assigned Unit</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="mb-1 text-xs text-fleet-muted">Unit ID</div>
              <div className="text-fleet-primary">{order.unit.id}</div>
            </div>
            <div>
              <div className="mb-1 text-xs text-fleet-muted">Make & Model</div>
              <div className="text-fleet-primary">
                {order.unit.make} {order.unit.model}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alternative Drivers */}
      {order.alternateDrivers && order.alternateDrivers.length > 0 && (
        <div className="rounded-lg border border-fleet bg-fleet-secondary p-4">
          <h3 className="mb-3 text-sm font-medium text-fleet-primary">🤖 Alternative Drivers</h3>
          <div className="space-y-2">
            {order.alternateDrivers.map((alt) => (
              <div
                key={alt.driver.id}
                className="flex items-center justify-between rounded-lg border border-fleet bg-fleet-primary p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-fleet-accent/20 text-xs font-medium text-fleet-accent">
                    {alt.driver.initials}
                  </div>
                  <div>
                    <div className="text-sm text-fleet-primary">{alt.driver.name}</div>
                    <div className="text-xs text-fleet-muted">
                      {alt.costDelta > 0 ? "+" : ""}
                      {formatCurrency(alt.costDelta)} • {alt.etaDelta > 0 ? "+" : ""}
                      {alt.etaDelta.toFixed(1)}h ETA
                    </div>
                  </div>
                </div>
                <button className="text-xs text-fleet-accent hover:underline">Reassign</button>
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
      <div className="rounded-lg border border-fleet bg-fleet-secondary p-4">
        <h3 className="mb-3 text-sm font-medium text-fleet-primary">Event History</h3>
        {order.events && order.events.length > 0 ? (
          <div className="space-y-3">
            {order.events.map((event, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-fleet-success" />
                <div className="flex-1">
                  <div className="text-sm text-fleet-primary">{event.event}</div>
                  <div className="text-xs text-fleet-muted">
                    {formatDateTime(event.timestamp)}
                    {event.location && ` • ${event.location}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-fleet-muted">No tracking events yet</p>
        )}
      </div>
    </div>
  );
}

function DocumentsTab({ order }: { order: OrderDetail }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-fleet bg-fleet-secondary p-4">
        <h3 className="mb-3 text-sm font-medium text-fleet-primary">Documents</h3>
        {order.documents && order.documents.length > 0 ? (
          <div className="space-y-2">
            {order.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-fleet bg-fleet-primary p-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-fleet-secondary" />
                  <div>
                    <div className="text-sm text-fleet-primary">{doc.type}</div>
                    <div className="text-xs text-fleet-muted">Uploaded {formatDate(doc.uploadedAt)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-fleet-accent hover:underline">View</button>
                  <button className="text-xs text-fleet-accent hover:underline">Download</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-fleet-muted">No documents uploaded yet</p>
        )}
      </div>
      <button className="w-full rounded-lg border border-dashed border-fleet py-2 text-sm text-fleet-secondary transition-colors hover:border-fleet-accent/40 hover:text-fleet-primary">
        Upload Document
      </button>
    </div>
  );
}
