"use client";

import { useState } from "react";
import { ArrowUpDown, MoreVertical } from "lucide-react";
import clsx from "clsx";

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
        return "bg-red-50 text-red-800 border-red-200";
      case "risk":
        return "bg-orange-50 text-orange-800 border-orange-200";
      case "watch":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
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
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Exceptions at a Glance
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {exceptions.length} active exceptions requiring attention
          </p>
        </div>
        {selectedRows.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedRows.length} selected
            </span>
            <button className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Assign
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Snooze
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Export
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-12 px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.length === exceptions.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Order/Trip
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <button className="flex items-center gap-1 hover:text-gray-900">
                  Issue
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ETA Impact
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <button className="flex items-center gap-1 hover:text-gray-900">
                  SLA
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {exceptions.map((exception, index) => (
              <tr
                key={exception.id}
                className={clsx(
                  "hover:bg-gray-50 transition-colors cursor-pointer",
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                )}
                onClick={() => toggleRowSelection(exception.id)}
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(exception.id)}
                    onChange={() => toggleRowSelection(exception.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-blue-600 hover:underline">
                    {exception.orderTrip}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">{exception.issue}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getSeverityStyles(
                      exception.severity
                    )}`}
                  >
                    {getSeverityLabel(exception.severity)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">
                    {exception.etaImpact}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">{exception.owner}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm ${getSLAStyles(exception.slaStatus)}`}>
                    {exception.sla}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Action menu for", exception.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
