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
  ChevronRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  User
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query";
import type { CustomsResponse, CustomsClearanceListItem } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

async function fetchCustomsClearances(): Promise<CustomsResponse> {
  const response = await fetch("/api/customs", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch customs clearances");
  }
  return response.json();
}

const statusColors: Record<string, string> = {
  "PENDING_DOCS": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "DOCS_SUBMITTED": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "UNDER_REVIEW": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "APPROVED": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "REJECTED": "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "CLEARED": "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const priorityColors: Record<string, string> = {
  "URGENT": "text-rose-400 font-bold",
  "HIGH": "text-amber-400 font-medium",
  "NORMAL": "text-blue-400",
  "LOW": "text-zinc-500",
};

type SortField = "tripNumber" | "status" | "priority" | "borderCrossingPoint" | "estimatedCrossingTime" | "assignedAgent";
type SortDirection = "asc" | "desc" | null;

export default function CustomsPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.customs(),
    queryFn: fetchCustomsClearances,
    refetchInterval: 30000,
  });

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterPriority, setFilterPriority] = useState<string>("All");
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
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    if (filterPriority !== "All") {
      filtered = filtered.filter((item) => item.priority === filterPriority);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.tripNumber.toLowerCase().includes(q) ||
        item.driverName.toLowerCase().includes(q) ||
        item.unitNumber.toLowerCase().includes(q) ||
        item.borderCrossingPoint.toLowerCase().includes(q) ||
        (item.assignedAgent && item.assignedAgent.toLowerCase().includes(q))
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
  }, [data?.data, filterStatus, filterPriority, searchQuery, sortField, sortDirection]);

  if (isLoading) {
    return <div className="p-8 text-zinc-500">Loading customs data...</div>;
  }

  if (isError || !data) {
    return <div className="p-8 text-rose-500">Error loading customs data.</div>;
  }

  const stats = data.stats;

  return (
    <div className="flex flex-col gap-0 rounded-lg border border-zinc-800 bg-zinc-950 shadow-sm overflow-hidden">
      {/* Header & Stats Ribbon */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold text-zinc-100">Customs Clearance</h1>
          
          {/* Stats Ribbon */}
          <div className="hidden items-center gap-4 text-xs font-mono md:flex">
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500">Pending Docs</span>
              <span className="font-bold text-amber-400">{stats.pendingDocs}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500">Under Review</span>
              <span className="font-bold text-blue-400">{stats.underReview}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500">Urgent</span>
              <span className="font-bold text-rose-400">{stats.urgent}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500">Approved</span>
              <span className="font-bold text-emerald-400">{stats.approved}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search customs..." 
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
          {data.filters.statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="h-7 rounded-sm border border-zinc-800 bg-black px-2 text-xs text-zinc-300 focus:border-blue-800 focus:outline-none"
        >
          <option value="All">Priority: All</option>
          {data.filters.priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {(filterStatus !== "All" || filterPriority !== "All" || searchQuery) && (
          <button 
            onClick={() => {
              setFilterStatus("All");
              setFilterPriority("All");
              setSearchQuery("");
            }}
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
          >
            Clear all
          </button>
        )}
        
        <div className="ml-auto text-xs text-zinc-500">
          Showing {filteredAndSortedData.length} records
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/80 text-zinc-500">
            <tr className="border-b border-zinc-800">
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("tripNumber")} className="flex items-center hover:text-zinc-300">
                  Trip / Driver <SortIcon field="tripNumber" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("status")} className="flex items-center hover:text-zinc-300">
                  Status <SortIcon field="status" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("priority")} className="flex items-center hover:text-zinc-300">
                  Priority <SortIcon field="priority" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("borderCrossingPoint")} className="flex items-center hover:text-zinc-300">
                  Border Crossing <SortIcon field="borderCrossingPoint" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                Documents
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("assignedAgent")} className="flex items-center hover:text-zinc-300">
                  Agent <SortIcon field="assignedAgent" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("estimatedCrossingTime")} className="flex items-center hover:text-zinc-300">
                  Est. Crossing <SortIcon field="estimatedCrossingTime" />
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
                  No customs records found.
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((item, idx) => {
                const statusStyle = statusColors[item.status] || "bg-zinc-800 text-zinc-400 border-zinc-700";
                const priorityStyle = priorityColors[item.priority] || "text-zinc-500";
                
                return (
                  <tr 
                    key={item.id} 
                    className={`group transition-colors hover:bg-zinc-900/60 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-zinc-900/20'}`}
                  >
                    {/* Trip / Driver */}
                    <td className="px-4 py-2 align-middle">
                      <div className="flex flex-col">
                        <span className="font-mono font-medium text-blue-400 group-hover:text-blue-300">
                          {item.tripNumber}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
                          <User className="h-3 w-3" />
                          <span>{item.driverName}</span>
                          <span className="text-zinc-600">•</span>
                          <span>Unit {item.unitNumber}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2 align-middle">
                      <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium ${statusStyle}`}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-2 align-middle">
                      <span className={`text-[10px] ${priorityStyle}`}>
                        {item.priority}
                      </span>
                    </td>

                    {/* Border Crossing */}
                    <td className="px-4 py-2 align-middle text-zinc-400">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <MapPin className="h-3 w-3 text-zinc-600" />
                          <span className="truncate max-w-[150px]" title={item.borderCrossingPoint}>{item.borderCrossingPoint}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 pl-4.5">
                          {item.crossingDirection.replace(/_/g, " ").replace("TO", "→")}
                        </span>
                      </div>
                    </td>

                    {/* Documents */}
                    <td className="px-4 py-2 align-middle">
                      <div className="flex items-center gap-1.5">
                        <FileText className={`h-3 w-3 ${item.submittedDocsCount >= item.requiredDocsCount ? "text-emerald-500" : "text-amber-500"}`} />
                        <span className={`font-mono ${item.submittedDocsCount >= item.requiredDocsCount ? "text-emerald-400" : "text-amber-400"}`}>
                          {item.submittedDocsCount}
                        </span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-zinc-500">{item.requiredDocsCount}</span>
                      </div>
                    </td>

                    {/* Agent */}
                    <td className="px-4 py-2 align-middle text-zinc-400">
                      {item.assignedAgent || <span className="text-zinc-600 italic">Unassigned</span>}
                    </td>

                    {/* Est. Crossing */}
                    <td className="px-4 py-2 align-middle">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <Clock className="h-3 w-3 text-zinc-600" />
                        <span className="font-mono">
                          {item.estimatedCrossingTime ? formatDateTime(item.estimatedCrossingTime) : "TBD"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2 align-middle text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => router.push(`/customs/${item.id}`)}
                          className="flex items-center gap-1 rounded-sm bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
                        >
                          Review <ChevronRight className="h-3 w-3" />
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

