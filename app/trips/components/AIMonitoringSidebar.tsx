"use client";

import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Clock,
  Users,
  Truck,
  Activity,
} from "lucide-react";
import { DispatchOrder, Driver } from "../types";
import { useMemo } from "react";

const fleetTokens = {
  bgPrimary: "bg-fleet-primary",
  bgSecondary: "bg-fleet-secondary",
  bgTertiary: "bg-fleet-tertiary",
  border: "border-fleet",
  textPrimary: "text-fleet-primary",
  textSecondary: "text-fleet-secondary",
  textMuted: "text-fleet-muted",
};

interface AIMonitoringSidebarProps {
  trips: DispatchOrder[];
  drivers: Driver[];
}

export function AIMonitoringSidebar({ trips, drivers }: AIMonitoringSidebarProps) {
  // Calculate metrics
  const metrics = useMemo(() => {
    const activeTrips = trips.filter(
      (t) => t.status !== "unassigned" && t.status !== "completed"
    );
    const completedTrips = trips.filter((t) => t.status === "completed");
    const delayedTrips = trips.filter((t) => t.dwellTime && t.dwellTime > 30);
    const highPriorityTrips = trips.filter((t) => t.priority === "high");
    const lowMarginTrips = trips.filter((t) => t.margin < 10);

    const avgMargin =
      completedTrips.length > 0
        ? completedTrips.reduce((sum, t) => sum + t.margin, 0) / completedTrips.length
        : 0;

    const availableDrivers = drivers.filter((d) => d.status === "available").length;
    const onTripDrivers = drivers.filter((d) => d.status === "on_trip").length;
    const lowHosDrivers = drivers.filter((d) => d.hosRemaining < 4).length;

    return {
      activeTrips: activeTrips.length,
      completedTrips: completedTrips.length,
      delayedTrips: delayedTrips.length,
      highPriorityTrips: highPriorityTrips.length,
      lowMarginTrips: lowMarginTrips.length,
      avgMargin,
      availableDrivers,
      onTripDrivers,
      lowHosDrivers,
      utilizationRate:
        drivers.length > 0 ? ((onTripDrivers / drivers.length) * 100).toFixed(1) : "0",
    };
  }, [trips, drivers]);

  // Generate alerts
  const alerts = useMemo(() => {
    const alertsList: Array<{
      id: string;
      type: "critical" | "warning" | "info";
      title: string;
      message: string;
    }> = [];

    if (metrics.delayedTrips > 0) {
      alertsList.push({
        id: "dwell-alert",
        type: "critical",
        title: "Excessive Dwell Time",
        message: `${metrics.delayedTrips} trip(s) experiencing dwell time >30 minutes`,
      });
    }

    if (metrics.lowHosDrivers > 0) {
      alertsList.push({
        id: "hos-alert",
        type: "warning",
        title: "Low HOS Drivers",
        message: `${metrics.lowHosDrivers} driver(s) have less than 4 hours HOS remaining`,
      });
    }

    if (metrics.lowMarginTrips > 0) {
      alertsList.push({
        id: "margin-alert",
        type: "warning",
        title: "Low Margin Trips",
        message: `${metrics.lowMarginTrips} trip(s) running below 10% margin threshold`,
      });
    }

    if (metrics.highPriorityTrips > 0) {
      alertsList.push({
        id: "priority-alert",
        type: "info",
        title: "High Priority Trips",
        message: `${metrics.highPriorityTrips} high-priority trip(s) require attention`,
      });
    }

    return alertsList;
  }, [metrics]);

  const getAlertColor = (type: "critical" | "warning" | "info") => {
    switch (type) {
      case "critical":
        return "border-[#FF4D4D]/30 bg-[#FF4D4D]/5 text-[#FF4D4D]";
      case "warning":
        return "border-[#FFC857]/30 bg-[#FFC857]/5 text-[#FFC857]";
      case "info":
        return "border-[#60A5FA]/30 bg-[#60A5FA]/5 text-[#60A5FA]";
    }
  };

  const getAlertIcon = (type: "critical" | "warning" | "info") => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-fleet-danger" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-fleet-warning" />;
      case "info":
        return <Activity className="h-4 w-4 text-fleet-accent" />;
    }
  };

  return (
    <div className={`w-80 ${fleetTokens.bgPrimary} border-l ${fleetTokens.border} flex flex-col h-full`}>
      {/* Header */}
      <div className={`p-4 border-b ${fleetTokens.border}`}>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-5 w-5 text-[#A78BFA]" />
          <h2 className={`text-lg font-semibold ${fleetTokens.textPrimary}`}>AI Monitoring</h2>
        </div>
        <p className={`text-xs ${fleetTokens.textMuted}`}>
          Real-time performance tracking and exception reporting
        </p>
      </div>

      {/* Performance Metrics */}
      <div className={`p-4 border-b ${fleetTokens.border}`}>
        <h3 className={`text-xs font-medium ${fleetTokens.textMuted} mb-3 uppercase`}>
          Performance Metrics
        </h3>
        <div className="space-y-3">
          {/* Active Trips */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-fleet-accent" />
              <span className={`text-xs ${fleetTokens.textSecondary}`}>Active Trips</span>
            </div>
            <span className={`text-sm font-semibold ${fleetTokens.textPrimary}`}>
              {metrics.activeTrips}
            </span>
          </div>

          {/* Completed Today */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-fleet-success" />
              <span className={`text-xs ${fleetTokens.textSecondary}`}>Completed Today</span>
            </div>
            <span className={`text-sm font-semibold ${fleetTokens.textPrimary}`}>
              {metrics.completedTrips}
            </span>
          </div>

          {/* Avg Margin */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-fleet-warning" />
              <span className={`text-xs ${fleetTokens.textSecondary}`}>Avg Margin</span>
            </div>
            <span className={`text-sm font-semibold ${fleetTokens.textPrimary}`}>
              {metrics.avgMargin.toFixed(1)}%
            </span>
          </div>

          {/* Delayed Trips */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-fleet-alert" />
              <span className={`text-xs ${fleetTokens.textSecondary}`}>Delayed Trips</span>
            </div>
            <span className="text-sm font-semibold text-fleet-alert">
              {metrics.delayedTrips}
            </span>
          </div>
        </div>
      </div>

      {/* Fleet Status */}
      <div className={`p-4 border-b ${fleetTokens.border}`}>
        <h3 className={`text-xs font-medium ${fleetTokens.textMuted} mb-3 uppercase`}>
          Fleet Status
        </h3>
        <div className="space-y-3">
          {/* Available Drivers */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-fleet-success" />
              <span className={`text-xs ${fleetTokens.textSecondary}`}>Available</span>
            </div>
            <span className={`text-sm font-semibold ${fleetTokens.textPrimary}`}>
              {metrics.availableDrivers}
            </span>
          </div>

          {/* On Trip */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-fleet-accent" />
              <span className={`text-xs ${fleetTokens.textSecondary}`}>On Trip</span>
            </div>
            <span className={`text-sm font-semibold ${fleetTokens.textPrimary}`}>
              {metrics.onTripDrivers}
            </span>
          </div>

          {/* Utilization Rate */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#A78BFA]" />
              <span className={`text-xs ${fleetTokens.textSecondary}`}>Utilization</span>
            </div>
            <span className={`text-sm font-semibold ${fleetTokens.textPrimary}`}>
              {metrics.utilizationRate}%
            </span>
          </div>

          {/* Low HOS Drivers */}
          {metrics.lowHosDrivers > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-fleet-warning" />
                <span className={`text-xs ${fleetTokens.textSecondary}`}>Low HOS</span>
              </div>
              <span className="text-sm font-semibold text-fleet-warning">
                {metrics.lowHosDrivers}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Alerts & Exceptions */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className={`text-xs font-medium ${fleetTokens.textMuted} mb-3 uppercase`}>
          Alerts & Exceptions
        </h3>
        <div className="space-y-2">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className={`h-10 w-10 ${fleetTokens.textMuted} mb-2 opacity-30`} />
              <p className={`text-xs ${fleetTokens.textMuted}`}>No active alerts</p>
              <p className={`text-xs ${fleetTokens.textMuted} mt-1`}>All systems nominal</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-3 ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start gap-2 mb-1">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className={`text-xs font-medium ${fleetTokens.textPrimary} mb-1`}>
                      {alert.title}
                    </div>
                    <p className={`text-xs ${fleetTokens.textSecondary} leading-relaxed`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className={`p-4 border-t ${fleetTokens.border} ${fleetTokens.bgSecondary}`}>
        <div className={`text-xs ${fleetTokens.textMuted} mb-2`}>Last Updated</div>
        <div className={`text-sm font-medium ${fleetTokens.textPrimary}`}>
          {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
