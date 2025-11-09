"use client";

import { useState } from "react";
import { ArrowUpDown, MoreVertical } from "lucide-react";
import clsx from "clsx";
import { darkERPTheme } from "@/app/lib/theme-config";

interface Exception {
  id: string;
  orderTrip: string;
  issue: string;
  severity: "breach" | "risk" | "watch";
  etaImpact: string;
  owner: string;
  sla: string;
  slaStatus: "good" | "warning" | "breach";
}

export default function ExceptionsTable() {
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Mock exception data
  const exceptions: Exception[] = [
    {
      id: "1",
      orderTrip: "#1234",
      issue: "HOS risk in 2h. Predicted 14m over.",
      severity: "breach",
      etaImpact: "+25m",
      owner: "John Smith",
      sla: "2h 15m",
      slaStatus: "breach",
    },
    {
      id: "2",
      orderTrip: "#5678",
      issue: "Cost 23% above normal range for lane",
      severity: "risk",
      etaImpact: "—",
      owner: "Sarah Johnson",
      sla: "4h 30m",
      slaStatus: "warning",
    },
    {
      id: "3",
      orderTrip: "#9012",
      issue: "Border delay detected (30m wait)",
      severity: "watch",
      etaImpact: "+30m",
      owner: "Mike Wilson",
      sla: "6h 45m",
      slaStatus: "good",
    },
    {
      id: "4",
      orderTrip: "#3456",
      issue: "Driver route deviation (12 miles)",
      severity: "watch",
      etaImpact: "+15m",
      owner: "Emily Brown",
      sla: "8h 20m",
      slaStatus: "good",
    },
    {
      id: "5",
      orderTrip: "#7890",
      issue: "Fuel stop required (tank at 15%)",
      severity: "risk",
      etaImpact: "+20m",
      owner: "David Lee",
      sla: "3h 10m",
      slaStatus: "warning",
    },
  ];

  const getSeverityStyles = (severity: Exception["severity"]) => {
    switch (severity) {
      case "breach":
        return { bg: darkERPTheme.severity.breach, text: '#FFFFFF' };
      case "risk":
        return { bg: darkERPTheme.severity.risk, text: '#000000' };
      case "watch":
        return { bg: darkERPTheme.severity.watch, text: '#000000' };
    }
  };

  const getSeverityLabel = (severity: Exception["severity"]) => {
    switch (severity) {
      case "breach":
        return "Breach";
      case "risk":
        return "Risk";
      case "watch":
        return "Watch";
    }
  };

  const getSLAStyles = (status: Exception["slaStatus"]) => {
    switch (status) {
      case "breach":
        return "text-red-600 font-semibold";
      case "warning":
        return "text-yellow-600 font-semibold";
      case "good":
        return "text-gray-600";
    }
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedRows(
      selectedRows.length === exceptions.length ? [] : exceptions.map((e) => e.id)
    );
  };

  return (
    <div
      className="rounded-lg"
      style={{
        backgroundColor: darkERPTheme.surface,
        border: `1px solid ${darkERPTheme.border}`,
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${darkERPTheme.border}` }}
      >
        <div>
          <h2 className="text-base font-semibold" style={{ color: darkERPTheme.textPrimary }}>
            Exceptions at a Glance
          </h2>
          <p className="text-sm mt-0.5" style={{ color: darkERPTheme.textMuted }}>
            {exceptions.length} active exceptions requiring attention
          </p>
        </div>
        {selectedRows.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: darkERPTheme.textMuted }}>
              {selectedRows.length} selected
            </span>
            <button
              className="px-3 py-1.5 text-sm font-medium rounded transition-colors"
              style={{
                color: darkERPTheme.textPrimary,
                border: `1px solid ${darkERPTheme.border}`,
                backgroundColor: darkERPTheme.surface2,
              }}
            >
              Assign
            </button>
            <button
              className="px-3 py-1.5 text-sm font-medium rounded transition-colors"
              style={{
                color: darkERPTheme.textPrimary,
                border: `1px solid ${darkERPTheme.border}`,
                backgroundColor: darkERPTheme.surface2,
              }}
            >
              Snooze
            </button>
            <button
              className="px-3 py-1.5 text-sm font-medium rounded transition-colors"
              style={{
                color: darkERPTheme.textPrimary,
                border: `1px solid ${darkERPTheme.border}`,
                backgroundColor: darkERPTheme.surface2,
              }}
            >
              Export
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ backgroundColor: darkERPTheme.surface2, borderBottom: `1px solid ${darkERPTheme.border}` }}>
            <tr>
              <th className="w-12 px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.length === exceptions.length}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: darkERPTheme.textMuted }}>
                Order/Trip
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: darkERPTheme.textMuted }}>
                <button className="flex items-center gap-1 hover:opacity-80">
                  Issue
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: darkERPTheme.textMuted }}>
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: darkERPTheme.textMuted }}>
                ETA Impact
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: darkERPTheme.textMuted }}>
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: darkERPTheme.textMuted }}>
                <button className="flex items-center gap-1 hover:opacity-80">
                  SLA
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: darkERPTheme.textMuted }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody style={{ borderTop: `1px solid ${darkERPTheme.border}` }}>
            {exceptions.map((exception, index) => {
              const severityStyle = getSeverityStyles(exception.severity);
              return (
                <tr
                  key={exception.id}
                  className="hover:opacity-90 transition-opacity cursor-pointer"
                  style={{
                    backgroundColor: index % 2 === 0 ? darkERPTheme.surface : darkERPTheme.surface2,
                    borderBottom: `1px solid ${darkERPTheme.border}`,
                  }}
                  onClick={() => toggleRowSelection(exception.id)}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(exception.id)}
                      onChange={() => toggleRowSelection(exception.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium hover:underline" style={{ color: darkERPTheme.brandAccent }}>
                      {exception.orderTrip}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm" style={{ color: darkERPTheme.textPrimary }}>
                      {exception.issue}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex px-2 py-1 text-xs font-medium rounded"
                      style={{
                        backgroundColor: severityStyle.bg,
                        color: severityStyle.text,
                      }}
                    >
                      {getSeverityLabel(exception.severity)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium" style={{ color: darkERPTheme.textPrimary }}>
                      {exception.etaImpact}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm" style={{ color: darkERPTheme.textMuted }}>
                      {exception.owner}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="text-sm font-medium"
                      style={{
                        color:
                          exception.slaStatus === 'breach'
                            ? darkERPTheme.severity.breach
                            : exception.slaStatus === 'warning'
                            ? darkERPTheme.severity.watch
                            : darkERPTheme.textMuted,
                      }}
                    >
                      {exception.sla}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Action menu for", exception.id);
                      }}
                      className="p-1 rounded transition-opacity hover:opacity-70"
                      style={{ backgroundColor: darkERPTheme.surface2 }}
                    >
                      <MoreVertical className="h-4 w-4" style={{ color: darkERPTheme.textMuted }} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
