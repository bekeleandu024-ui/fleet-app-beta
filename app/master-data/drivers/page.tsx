"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  User, 
  Truck, 
  Clock, 
  DollarSign, 
  Filter,
  Users,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { SectionBanner } from "@/components/section-banner";
import { queryKeys } from "@/lib/query";

type DriverRecord = {
  id: string;
  name: string;
  unitNumber: string;
  driverType: string;
  driverCategory: string;
  status: string;
  currentStatus: string;
  hosHoursRemaining: number;
  baseWageCpm: number;
  effectiveWageCpm: number;
  availableAt: string | null;
  lastShiftEnd: string | null;
  isActive: boolean;
  updated: string;
};

type DriverResponse = {
  filters: {
    categories: string[];
    statuses: string[];
    types: string[];
  };
  data: DriverRecord[];
  summary: {
    total: number;
    active: number;
    available: number;
    lowHos: number;
  };
};

async function fetchDrivers(): Promise<DriverResponse> {
  const res = await fetch("/api/master-data/drivers");
  if (!res.ok) throw new Error("Failed to fetch drivers");
  return res.json();
}

export default function DriversMasterDataPage() {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.masterData.drivers,
    queryFn: fetchDrivers,
  });

  if (isLoading && !data) {
    return <MasterDataSkeleton title="Driver Directory" />;
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Driver Directory" subtitle="Fleet driver roster and availability." aria-live="polite">
        <p className="text-sm text-zinc-400">Drivers not available.</p>
      </SectionBanner>
    );
  }

  const filteredData = data.data.filter((driver) => {
    if (categoryFilter !== "All" && driver.driverCategory !== categoryFilter) return false;
    if (statusFilter !== "All" && driver.currentStatus !== statusFilter) return false;
    return true;
  });

  const columns: DataTableColumn<DriverRecord>[] = [
    { 
      key: "name", 
      header: "Driver", 
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${row.isActive ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
          <span className="font-medium text-zinc-100">{row.name}</span>
        </div>
      ), 
      widthClass: "min-w-[180px]" 
    },
    { 
      key: "unitNumber", 
      header: "Unit #", 
      accessor: (row) => (
        <span className="font-mono text-xs text-zinc-400">{row.unitNumber}</span>
      ),
      widthClass: "w-[100px]"
    },
    { 
      key: "driverCategory", 
      header: "Category", 
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          row.driverCategory === 'Highway' ? 'bg-blue-500/20 text-blue-400' :
          row.driverCategory === 'Local' ? 'bg-amber-500/20 text-amber-400' :
          'bg-purple-500/20 text-purple-400'
        }`}>
          {row.driverCategory}
        </span>
      ),
      widthClass: "w-[100px]"
    },
    { 
      key: "driverType", 
      header: "Type", 
      accessor: (row) => (
        <span className="text-xs text-zinc-500">{row.driverType}</span>
      ),
      widthClass: "w-[80px]"
    },
    { 
      key: "currentStatus", 
      header: "Status", 
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          row.currentStatus === 'Driving' ? 'bg-emerald-500/20 text-emerald-400' :
          row.currentStatus === 'On Duty' ? 'bg-blue-500/20 text-blue-400' :
          'bg-zinc-500/20 text-zinc-400'
        }`}>
          {row.currentStatus}
        </span>
      ),
      widthClass: "w-[100px]"
    },
    { 
      key: "hosHoursRemaining", 
      header: "HOS Remaining", 
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-zinc-800 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${
                row.hosHoursRemaining < 3 ? 'bg-red-500' : 
                row.hosHoursRemaining < 6 ? 'bg-amber-500' : 'bg-emerald-500'
              }`} 
              style={{ width: `${Math.min(100, (row.hosHoursRemaining / 11) * 100)}%` }}
            />
          </div>
          <span className={`text-xs font-mono ${
            row.hosHoursRemaining < 3 ? 'text-red-400' : 
            row.hosHoursRemaining < 6 ? 'text-amber-400' : 'text-zinc-400'
          }`}>
            {row.hosHoursRemaining.toFixed(1)}h
          </span>
        </div>
      ),
      widthClass: "w-[140px]"
    },
    { 
      key: "effectiveWageCpm", 
      header: "Rate (CPM)", 
      accessor: (row) => (
        <span className="text-xs font-mono text-zinc-400">
          ${row.effectiveWageCpm.toFixed(2)}
        </span>
      ),
      widthClass: "w-[100px]"
    },
  ];

  return (
    <SectionBanner
      title="Driver Directory"
      subtitle="Fleet driver roster, availability, and HOS compliance."
      aria-live="polite"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
            <Users className="w-3.5 h-3.5" />
            Total Drivers
          </div>
          <div className="text-2xl font-bold text-zinc-100">{data.summary.total}</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Active
          </div>
          <div className="text-2xl font-bold text-emerald-400">{data.summary.active}</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            Available (8h+)
          </div>
          <div className="text-2xl font-bold text-blue-400">{data.summary.available}</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            Low HOS (&lt;4h)
          </div>
          <div className="text-2xl font-bold text-red-400">{data.summary.lowHos}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700"
          >
            {data.filters.categories.map((cat) => (
              <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
            ))}
          </select>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700"
        >
          {data.filters.statuses.map((status) => (
            <option key={status} value={status}>{status === "All" ? "All Statuses" : status}</option>
          ))}
        </select>
        <span className="text-xs text-zinc-500 self-center ml-auto">
          Showing {filteredData.length} of {data.data.length} drivers
        </span>
      </div>

      <div className="-mx-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
        <DataTable columns={columns} data={filteredData} getRowId={(row) => row.id} />
      </div>
    </SectionBanner>
  );
}

function MasterDataSkeleton({ title }: { title: string }) {
  return (
    <SectionBanner title={title} subtitle="Loading directory..." aria-live="polite">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-900/50" />
        ))}
      </div>
      <div className="h-[420px] animate-pulse rounded-lg bg-zinc-900/50" />
    </SectionBanner>
  );
}

