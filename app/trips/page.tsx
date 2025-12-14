"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { 
  RefreshCw, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  Search,
  MoreHorizontal,
  ChevronRight,
  MapPin,
  Truck,
  Calendar,
  AlertTriangle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchTrips } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import type { TripListItem } from "@/lib/types";

const statusColors: Record<string, string> = {
  "Assigned": "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  "Dispatched": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "At Pickup": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "In Transit": "bg-blue-600/20 text-blue-400 border-blue-600/30",
  "At Delivery": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Delivered": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Completed": "bg-zinc-500/20 text-zinc-500 border-zinc-500/30",
  "Cancelled": "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

type SortField = "tripNumber" | "customer" | "status" | "driver" | "eta" | "pickup" | "delivery";
type SortDirection = "asc" | "desc" | null;

export default function TripsPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useQuery({ 
    queryKey: queryKeys.trips(), 
    queryFn: () => fetchTrips() 
  });

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterException, setFilterException] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-20" />;
    if (sortDirection === "asc") return <ArrowUp className="ml-1 h-3 w-3 text-blue-400" />;
    if (sortDirection === "desc") return <ArrowDown className="ml-1 h-3 w-3 text-blue-400" />;
    return null;
  };

  const filteredAndSortedData = useMemo(() => {
    if (!data?.data) return [];

    let filtered = data.data;

    if (filterStatus !== "All") {
      filtered = filtered.filter((trip) => trip.status === filterStatus);
    }
    // Note: Exception filtering logic would go here if we had exception data on the list item
    // For now we'll just filter if the exceptions count > 0 if "Has Exceptions" is selected
    if (filterException === "Has Exceptions") {
      filtered = filtered.filter((trip) => trip.exceptions > 0);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(trip => 
        trip.tripNumber.toLowerCase().includes(q) ||
        trip.customer?.toLowerCase().includes(q) ||
        trip.driver.toLowerCase().includes(q) ||
        trip.unit.toLowerCase().includes(q) ||
        trip.pickup.toLowerCase().includes(q) ||
        trip.delivery.toLowerCase().includes(q)
      );
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any = a[sortField];
        let bVal: any = b[sortField];

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data?.data, filterStatus, filterException, searchQuery, sortField, sortDirection]);

  if (isLoading) {
    return <div className="p-8 text-zinc-500">Loading trips...</div>;
  }

  if (isError || !data) {
    return <div className="p-8 text-rose-500">Error loading trips.</div>;
  }

  const stats = data.stats;

  return (
    <div className="flex flex-col gap-0 rounded-lg border border-zinc-800 bg-zinc-950 shadow-sm overflow-hidden">
      {/* Header & Stats Ribbon */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold text-zinc-100">Trips & Tracking</h1>
          
          {/* Stats Ribbon */}
          <div className="hidden items-center gap-4 text-xs font-mono md:flex">
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500">Active</span>
              <span className="font-bold text-blue-400">{stats.active}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500">Late</span>
              <span className="font-bold text-amber-400">{stats.late}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500">Exceptions</span>
              <span className="font-bold text-rose-400">{stats.exception}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search trips..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 rounded-sm border border-zinc-800 bg-black pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
          </div>
          <Button
            size="sm"
            variant="plain"
            onClick={() => void refetch()}
            className="h-8 w-8 rounded-sm p-0 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="subtle"
            onClick={() => router.push("/trips/closed")}
            className="h-8 rounded-sm border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            Closed Trips
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-900/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400">Filters:</span>
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-7 rounded-sm border border-zinc-800 bg-black px-2 text-xs text-zinc-300 focus:border-blue-800 focus:outline-none"
        >
          <option value="All">Status: All</option>
          {data.filters.statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filterException}
          onChange={(e) => setFilterException(e.target.value)}
          className="h-7 rounded-sm border border-zinc-800 bg-black px-2 text-xs text-zinc-300 focus:border-blue-800 focus:outline-none"
        >
          <option value="All">Exceptions: All</option>
          <option value="Has Exceptions">Has Exceptions</option>
          {data.filters.exceptions.map(e => <option key={e} value={e}>{e}</option>)}
        </select>

        {(filterStatus !== "All" || filterException !== "All" || searchQuery) && (
          <button 
            onClick={() => {
              setFilterStatus("All");
              setFilterException("All");
              setSearchQuery("");
            }}
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
          >
            Clear all
          </button>
        )}
        
        <div className="ml-auto text-xs text-zinc-500">
          Showing {filteredAndSortedData.length} trips
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/80 text-zinc-500">
            <tr className="border-b border-zinc-800">
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("tripNumber")} className="flex items-center hover:text-zinc-300">
                  Trip ID <SortIcon field="tripNumber" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("status")} className="flex items-center hover:text-zinc-300">
                  Status <SortIcon field="status" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("customer")} className="flex items-center hover:text-zinc-300">
                  Customer <SortIcon field="customer" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("pickup")} className="flex items-center hover:text-zinc-300">
                  Origin <SortIcon field="pickup" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("delivery")} className="flex items-center hover:text-zinc-300">
                  Destination <SortIcon field="delivery" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("driver")} className="flex items-center hover:text-zinc-300">
                  Driver / Unit <SortIcon field="driver" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("eta")} className="flex items-center hover:text-zinc-300">
                  ETA <SortIcon field="eta" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 bg-black/20">
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  No trips found.
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((trip, idx) => {
                const statusStyle = statusColors[trip.status] || "bg-zinc-800 text-zinc-400 border-zinc-700";
                
                return (
                  <tr 
                    key={trip.id} 
                    className={`group transition-colors hover:bg-zinc-900/60 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-zinc-900/20'}`}
                  >
                    {/* Trip ID */}
                    <td className="px-4 py-2 align-middle">
                      <div className="flex flex-col">
                        <span className="font-mono font-medium text-blue-400 group-hover:text-blue-300">
                          {trip.tripNumber}
                        </span>
                        {trip.exceptions > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-rose-400 mt-0.5">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{trip.exceptions} Alert{trip.exceptions > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2 align-middle">
                      <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium ${statusStyle}`}>
                        {trip.status}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-2 align-middle font-medium text-zinc-300">
                      {trip.customer || "—"}
                    </td>

                    {/* Origin */}
                    <td className="px-4 py-2 align-middle text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-zinc-600" />
                        <span className="truncate max-w-[150px]" title={trip.pickup}>{trip.pickup}</span>
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="px-4 py-2 align-middle text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-zinc-600" />
                        <span className="truncate max-w-[150px]" title={trip.delivery}>{trip.delivery}</span>
                      </div>
                    </td>

                    {/* Driver / Unit */}
                    <td className="px-4 py-2 align-middle">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Truck className="h-3 w-3 text-zinc-500" />
                          <span>{trip.driver}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 pl-4.5">
                          Unit {trip.unit}
                        </span>
                      </div>
                    </td>

                    {/* ETA */}
                    <td className="px-4 py-2 align-middle">
                      <div className="flex flex-col">
                        <span className="text-zinc-300 font-mono">
                          {trip.eta}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Last ping: {trip.lastPing}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2 align-middle text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => router.push(`/trips/${trip.id}`)}
                          className="flex items-center gap-1 rounded-sm bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
                        >
                          Details <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

