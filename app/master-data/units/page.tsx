"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Truck, 
  MapPin, 
  Package, 
  Filter,
  Fuel,
  DollarSign,
  Scale,
  Box
} from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { SectionBanner } from "@/components/section-banner";
import { queryKeys } from "@/lib/query";

type UnitRecord = {
  id: string;
  unitNumber: string;
  driverName: string | null;
  unitType: string;
  configuration: string;
  status: string;
  currentLocation: string;
  maxWeight: number;
  maxVolume: number;
  palletPositions: number;
  fuelConsumption: number;
  weeklyCost: number;
  attachedTrailer: string | null;
  isActive: boolean;
  updated: string;
};

type UnitResponse = {
  filters: {
    types: string[];
    configurations: string[];
    locations: string[];
  };
  data: UnitRecord[];
  summary: {
    total: number;
    active: number;
    bobtail: number;
    coupled: number;
    totalWeeklyCost: number;
  };
};

async function fetchUnits(): Promise<UnitResponse> {
  const res = await fetch("/api/master-data/units");
  if (!res.ok) throw new Error("Failed to fetch units");
  return res.json();
}

export default function UnitsMasterDataPage() {
  const [configFilter, setConfigFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.masterData.units,
    queryFn: fetchUnits,
  });

  if (isLoading && !data) {
    return <MasterDataSkeleton title="Unit Directory" />;
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Unit Directory" subtitle="Fleet asset inventory and readiness." aria-live="polite">
        <p className="text-sm text-zinc-400">Units not available.</p>
      </SectionBanner>
    );
  }

  const filteredData = data.data.filter((unit) => {
    if (configFilter !== "All" && unit.configuration !== configFilter) return false;
    if (locationFilter !== "All" && unit.currentLocation !== locationFilter) return false;
    return true;
  });

  const columns: DataTableColumn<UnitRecord>[] = [
    { 
      key: "unitNumber", 
      header: "Unit #", 
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${row.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="font-mono font-bold text-zinc-100">{row.unitNumber}</span>
        </div>
      ), 
      widthClass: "w-[120px]" 
    },
    { 
      key: "driverName", 
      header: "Assigned Driver", 
      accessor: (row) => (
        <span className={row.driverName ? "text-zinc-200" : "text-zinc-600 italic"}>
          {row.driverName || "Unassigned"}
        </span>
      ),
      widthClass: "min-w-[160px]"
    },
    { 
      key: "configuration", 
      header: "Config", 
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          row.configuration === 'Coupled' ? 'bg-emerald-500/20 text-emerald-400' :
          'bg-amber-500/20 text-amber-400'
        }`}>
          {row.configuration}
        </span>
      ),
      widthClass: "w-[100px]"
    },
    { 
      key: "attachedTrailer", 
      header: "Trailer", 
      accessor: (row) => (
        <span className={`font-mono text-xs ${row.attachedTrailer ? 'text-zinc-300' : 'text-zinc-600'}`}>
          {row.attachedTrailer || "-"}
        </span>
      ),
      widthClass: "w-[80px]"
    },
    { 
      key: "currentLocation", 
      header: "Location", 
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-zinc-500" />
          <span className="text-xs text-zinc-400 truncate max-w-[180px]" title={row.currentLocation}>
            {row.currentLocation}
          </span>
        </div>
      ),
      widthClass: "min-w-[200px]"
    },
    { 
      key: "unitType", 
      header: "Type", 
      accessor: (row) => (
        <span className="text-xs text-zinc-500">{row.unitType}</span>
      ),
      widthClass: "w-[100px]"
    },
    { 
      key: "capacity", 
      header: "Capacity", 
      accessor: (row) => (
        <div className="flex items-center gap-3 text-xs">
          <span className="text-zinc-400" title="Max Weight">
            <Scale className="w-3 h-3 inline mr-1 text-zinc-600" />
            {(row.maxWeight / 1000).toFixed(0)}K lbs
          </span>
          <span className="text-zinc-500" title="Pallets">
            <Box className="w-3 h-3 inline mr-1 text-zinc-600" />
            {row.palletPositions}
          </span>
        </div>
      ),
      widthClass: "w-[160px]"
    },
    { 
      key: "fuelConsumption", 
      header: "MPG", 
      accessor: (row) => (
        <span className="text-xs font-mono text-zinc-400">
          {row.fuelConsumption.toFixed(1)}
        </span>
      ),
      widthClass: "w-[60px]"
    },
    { 
      key: "weeklyCost", 
      header: "Weekly Cost", 
      accessor: (row) => (
        <span className="text-xs font-mono text-zinc-400">
          ${row.weeklyCost.toLocaleString()}
        </span>
      ),
      widthClass: "w-[100px]"
    },
  ];

  return (
    <SectionBanner title="Unit Directory" subtitle="Fleet asset inventory, configuration, and cost analysis." aria-live="polite">
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
            <Truck className="w-3.5 h-3.5" />
            Total Units
          </div>
          <div className="text-2xl font-bold text-zinc-100">{data.summary.total}</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
            <Package className="w-3.5 h-3.5 text-emerald-500" />
            Coupled
          </div>
          <div className="text-2xl font-bold text-emerald-400">{data.summary.coupled}</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
            <Truck className="w-3.5 h-3.5 text-amber-500" />
            Bobtail
          </div>
          <div className="text-2xl font-bold text-amber-400">{data.summary.bobtail}</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
            <Fuel className="w-3.5 h-3.5 text-blue-500" />
            Active
          </div>
          <div className="text-2xl font-bold text-blue-400">{data.summary.active}</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5 text-violet-500" />
            Weekly Fleet Cost
          </div>
          <div className="text-2xl font-bold text-violet-400">
            ${(data.summary.totalWeeklyCost / 1000).toFixed(1)}K
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select
            value={configFilter}
            onChange={(e) => setConfigFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700"
          >
            {data.filters.configurations.map((config) => (
              <option key={config} value={config}>{config === "All" ? "All Configurations" : config}</option>
            ))}
          </select>
        </div>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 max-w-[250px]"
        >
          {data.filters.locations.map((loc) => (
            <option key={loc} value={loc}>{loc === "All" ? "All Locations" : loc}</option>
          ))}
        </select>
        <span className="text-xs text-zinc-500 self-center ml-auto">
          Showing {filteredData.length} of {data.data.length} units
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
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-900/50" />
        ))}
      </div>
      <div className="h-[420px] animate-pulse rounded-lg bg-zinc-900/50" />
    </SectionBanner>
  );
}

