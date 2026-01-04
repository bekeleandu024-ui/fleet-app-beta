"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft,
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search,
  ChevronRight,
  MapPin,
  Truck,
  RefreshCw,
  DollarSign,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchTrips } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { FinalizeLoadModal } from "@/components/billing/finalize-load-modal";

const statusColors: Record<string, string> = {
  "Completed": "bg-zinc-500/20 text-zinc-500 border-zinc-500/30",
  "Closed": "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
  "Cancelled": "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const billingStatusColors: Record<string, string> = {
  "PENDING": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "AUDITED": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "INVOICED": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "PAID": "bg-zinc-500/20 text-zinc-500 border-zinc-500/30",
};

type SortField = "tripNumber" | "customer" | "status" | "driver" | "eta" | "pickup" | "delivery";
type SortDirection = "asc" | "desc" | null;
type BillingFilter = "all" | "pending" | "audited" | "invoiced";

export default function ClosedTripsPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useQuery({ 
    queryKey: queryKeys.trips({ status: "closed" }), 
    queryFn: () => fetchTrips("closed") 
  });

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [billingFilter, setBillingFilter] = useState<BillingFilter>("all");
  const [finalizeOrderId, setFinalizeOrderId] = useState<string | null>(null);

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

    // Filter by billing status
    if (billingFilter !== "all") {
      filtered = filtered.filter(trip => {
        const status = (trip.billingStatus || "PENDING").toUpperCase();
        return status === billingFilter.toUpperCase();
      });
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
  }, [data?.data, searchQuery, sortField, sortDirection, billingFilter]);

  // Count pending audits
  const pendingAuditCount = useMemo(() => {
    if (!data?.data) return 0;
    return data.data.filter(trip => (trip.billingStatus || "PENDING") === "PENDING").length;
  }, [data?.data]);

  if (isLoading) {
    return <div className="p-8 text-zinc-500">Loading closed trips...</div>;
  }

  if (isError || !data) {
    return <div className="p-8 text-rose-500">Error loading closed trips.</div>;
  }

  return (
    <>
    {/* Finalize Modal */}
    {finalizeOrderId && (
      <FinalizeLoadModal
        orderId={finalizeOrderId}
        onClose={() => setFinalizeOrderId(null)}
        onSuccess={() => refetch()}
      />
    )}
    
    <div className="flex flex-col gap-0 rounded-lg border border-zinc-800 bg-zinc-950 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="plain"
            size="sm"
            onClick={() => router.push("/trips")}
            className="h-8 w-8 rounded-sm p-0 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-zinc-100">Closed Trips</h1>
          
          {/* Billing Status Filter Tabs */}
          <div className="hidden md:flex items-center gap-1 ml-4">
            <button
              onClick={() => setBillingFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                billingFilter === "all" 
                  ? "bg-zinc-700 text-white" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setBillingFilter("pending")}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors flex items-center gap-1.5 ${
                billingFilter === "pending" 
                  ? "bg-amber-600/30 text-amber-400 border border-amber-600/50" 
                  : "text-zinc-400 hover:text-amber-400 hover:bg-amber-950/30"
              }`}
            >
              <AlertCircle className="h-3 w-3" />
              Pending Audit
              {pendingAuditCount > 0 && (
                <span className="bg-amber-500/30 text-amber-400 text-[10px] px-1.5 rounded-full">
                  {pendingAuditCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setBillingFilter("audited")}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors flex items-center gap-1.5 ${
                billingFilter === "audited" 
                  ? "bg-emerald-600/30 text-emerald-400 border border-emerald-600/50" 
                  : "text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/30"
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              Audited
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search history..." 
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
                Billing
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("eta")} className="flex items-center hover:text-zinc-300">
                  Completed <SortIcon field="eta" />
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
                <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                  {billingFilter === "pending" 
                    ? "No trips pending audit." 
                    : "No closed trips found."
                  }
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((trip, idx) => {
                const statusStyle = statusColors[trip.status] || "bg-zinc-800 text-zinc-400 border-zinc-700";
                const billingStatus = trip.billingStatus || "PENDING";
                const billingStyle = billingStatusColors[billingStatus] || billingStatusColors["PENDING"];
                
                return (
                  <tr 
                    key={trip.id} 
                    className={`group transition-colors hover:bg-zinc-900/60 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-zinc-900/20'}`}
                  >
                    {/* Trip ID */}
                    <td className="px-4 py-2 align-middle">
                      <span className="font-mono font-medium text-zinc-400 group-hover:text-zinc-300">
                        {trip.tripNumber}
                      </span>
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

                    {/* Billing Status */}
                    <td className="px-4 py-2 align-middle">
                      <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium ${billingStyle}`}>
                        {billingStatus === "PENDING" && <AlertCircle className="h-2.5 w-2.5 mr-1" />}
                        {billingStatus === "AUDITED" && <CheckCircle2 className="h-2.5 w-2.5 mr-1" />}
                        {billingStatus}
                      </span>
                      {trip.quotedRate && (
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          ${parseFloat(trip.quotedRate).toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Completed Date (using eta field as proxy or completedAt if available) */}
                    <td className="px-4 py-2 align-middle">
                      <span className="text-zinc-400 font-mono">
                        {trip.completedAt || trip.eta}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        {billingStatus === "PENDING" && trip.orderId && (
                          <button 
                            onClick={() => setFinalizeOrderId(trip.orderId)}
                            className="flex items-center gap-1 rounded-sm bg-amber-600/20 px-2 py-1 text-[10px] font-medium text-amber-400 hover:bg-amber-600/30 border border-amber-600/30"
                          >
                            <DollarSign className="h-3 w-3" />
                            Finalize
                          </button>
                        )}
                        <button 
                          onClick={() => router.push(`/trips/${trip.id}`)}
                          className="flex items-center gap-1 rounded-sm bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-300 hover:bg-zinc-700 border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
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
    </>
  );
}
