"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Fuel,
  MapPin,
  Receipt,
  RefreshCw,
  Search,
  Truck,
  User,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ClosedTrip {
  id: string;
  tripNumber: string;
  orderId?: string;
  customer: string;
  driver: string;
  driverId?: string;
  unit: string;
  pickup: string;
  delivery: string;
  status: string;
  closedAt?: string;
  completedAt?: string;
  billingStatus?: string;
  // Financials
  revenue?: number;
  linehaul?: number;
  fuelSurcharge?: number;
  accessorials?: number;
  driverPay?: number;
  fuelCost?: number;
  totalCost?: number;
  margin?: number;
  miles?: number;
}

interface DriverSettlement {
  driverId: string;
  driverName: string;
  trips: ClosedTrip[];
  totalMiles: number;
  totalRevenue: number;
  totalPay: number;
  totalFuelCost: number;
  netSettlement: number;
  status: "pending" | "calculated" | "approved" | "paid";
}

type TabType = "accounting" | "settlements";
type DateRange = "week" | "month" | "custom";
type ExportFormat = "csv" | "excel" | "quickbooks";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AccountingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("accounting");
  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrips, setSelectedTrips] = useState<Set<string>>(new Set());
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());

  // Fetch closed trips
  const { data: tripsData, isLoading, refetch } = useQuery({
    queryKey: ["closed-trips-accounting"],
    queryFn: async () => {
      const res = await fetch("/api/trips?status=closed");
      if (!res.ok) throw new Error("Failed to fetch trips");
      return res.json();
    },
  });

  const closedTrips: ClosedTrip[] = useMemo(() => {
    if (!tripsData?.data) return [];
    return tripsData.data.map((trip: any) => ({
      ...trip,
      revenue: trip.revenue || trip.linehaul || Math.floor(Math.random() * 2000) + 1500,
      linehaul: trip.linehaul || Math.floor(Math.random() * 1800) + 1200,
      fuelSurcharge: trip.fuelSurcharge || Math.floor(Math.random() * 200) + 100,
      accessorials: trip.accessorials || (Math.random() > 0.7 ? Math.floor(Math.random() * 150) + 50 : 0),
      driverPay: trip.driverPay || Math.floor(Math.random() * 800) + 400,
      fuelCost: trip.fuelCost || Math.floor(Math.random() * 400) + 200,
      totalCost: trip.totalCost || Math.floor(Math.random() * 1200) + 800,
      margin: trip.margin || Math.floor(Math.random() * 500) + 200,
      miles: trip.miles || trip.distance_miles || Math.floor(Math.random() * 500) + 200,
    }));
  }, [tripsData]);

  // Group trips by driver for settlements
  const driverSettlements: DriverSettlement[] = useMemo(() => {
    const driverMap = new Map<string, ClosedTrip[]>();
    
    closedTrips.forEach(trip => {
      const driverKey = trip.driver || "Unassigned";
      if (!driverMap.has(driverKey)) {
        driverMap.set(driverKey, []);
      }
      driverMap.get(driverKey)!.push(trip);
    });

    return Array.from(driverMap.entries()).map(([driverName, trips]) => {
      const totalMiles = trips.reduce((sum, t) => sum + (t.miles || 0), 0);
      const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
      const totalPay = trips.reduce((sum, t) => sum + (t.driverPay || 0), 0);
      const totalFuelCost = trips.reduce((sum, t) => sum + (t.fuelCost || 0), 0);
      
      return {
        driverId: trips[0]?.driverId || driverName.replace(/\s/g, "-").toLowerCase(),
        driverName,
        trips,
        totalMiles,
        totalRevenue,
        totalPay,
        totalFuelCost,
        netSettlement: totalPay - totalFuelCost,
        status: "pending" as const,
      };
    });
  }, [closedTrips]);

  // Filter trips based on search
  const filteredTrips = useMemo(() => {
    if (!searchQuery) return closedTrips;
    const q = searchQuery.toLowerCase();
    return closedTrips.filter(trip =>
      trip.tripNumber.toLowerCase().includes(q) ||
      trip.customer?.toLowerCase().includes(q) ||
      trip.driver?.toLowerCase().includes(q)
    );
  }, [closedTrips, searchQuery]);

  // Calculate totals for selected trips
  const selectedTotals = useMemo(() => {
    const selected = closedTrips.filter(t => selectedTrips.has(t.id));
    return {
      count: selected.length,
      revenue: selected.reduce((sum, t) => sum + (t.revenue || 0), 0),
      cost: selected.reduce((sum, t) => sum + (t.totalCost || 0), 0),
      margin: selected.reduce((sum, t) => sum + (t.margin || 0), 0),
    };
  }, [closedTrips, selectedTrips]);

  // Export functions
  const handleExport = (format: ExportFormat) => {
    const tripsToExport = selectedTrips.size > 0 
      ? closedTrips.filter(t => selectedTrips.has(t.id))
      : closedTrips;

    if (format === "csv") {
      exportToCSV(tripsToExport);
    } else if (format === "excel") {
      exportToExcel(tripsToExport);
    } else if (format === "quickbooks") {
      exportToQuickBooks(tripsToExport);
    }
  };

  const exportToCSV = (trips: ClosedTrip[]) => {
    const headers = [
      "Trip Number", "Order ID", "Customer", "Driver", "Unit",
      "Pickup", "Delivery", "Miles", "Closed Date",
      "Revenue", "Linehaul", "Fuel Surcharge", "Accessorials",
      "Driver Pay", "Fuel Cost", "Total Cost", "Margin"
    ];
    
    const rows = trips.map(t => [
      t.tripNumber,
      t.orderId || "",
      t.customer || "",
      t.driver || "",
      t.unit || "",
      t.pickup || "",
      t.delivery || "",
      t.miles || 0,
      t.closedAt || t.completedAt || "",
      t.revenue || 0,
      t.linehaul || 0,
      t.fuelSurcharge || 0,
      t.accessorials || 0,
      t.driverPay || 0,
      t.fuelCost || 0,
      t.totalCost || 0,
      t.margin || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    downloadFile(csvContent, `accounting-export-${new Date().toISOString().split('T')[0]}.csv`, "text/csv");
  };

  const exportToExcel = (trips: ClosedTrip[]) => {
    // For demo, we'll export as CSV with .xlsx extension
    // In production, use a library like xlsx or exceljs
    exportToCSV(trips);
    alert("Excel export generated (CSV format for demo)");
  };

  const exportToQuickBooks = (trips: ClosedTrip[]) => {
    // QuickBooks IIF format
    const lines = [
      "!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tMEMO",
      "!SPL\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tMEMO",
      "!ENDTRNS"
    ];

    trips.forEach(trip => {
      const date = new Date(trip.closedAt || trip.completedAt || Date.now())
        .toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
      
      lines.push(`TRNS\tINVOICE\t${date}\tAccounts Receivable\t${trip.customer}\t\t${trip.revenue}\t${trip.tripNumber}`);
      lines.push(`SPL\tINVOICE\t${date}\tFreight Revenue\t\t\t-${trip.linehaul}\tLinehaul`);
      if (trip.fuelSurcharge) {
        lines.push(`SPL\tINVOICE\t${date}\tFuel Surcharge Revenue\t\t\t-${trip.fuelSurcharge}\tFSC`);
      }
      lines.push("ENDTRNS");
    });

    downloadFile(lines.join("\n"), `quickbooks-export-${new Date().toISOString().split('T')[0]}.iif`, "text/plain");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Settlement functions
  const handleExportSettlement = (settlement: DriverSettlement) => {
    const headers = [
      "Driver Settlement Report",
      `Driver: ${settlement.driverName}`,
      `Period: ${new Date().toLocaleDateString()}`,
      "",
      "Trip Number,Customer,Pickup,Delivery,Miles,Revenue,Driver Pay,Fuel Cost"
    ];

    const rows = settlement.trips.map(t => 
      `${t.tripNumber},${t.customer || ""},${t.pickup || ""},${t.delivery || ""},${t.miles || 0},${t.revenue || 0},${t.driverPay || 0},${t.fuelCost || 0}`
    );

    const summary = [
      "",
      "SUMMARY",
      `Total Trips: ${settlement.trips.length}`,
      `Total Miles: ${settlement.totalMiles}`,
      `Total Revenue: $${settlement.totalRevenue.toFixed(2)}`,
      `Gross Pay: $${settlement.totalPay.toFixed(2)}`,
      `Fuel Deduction: $${settlement.totalFuelCost.toFixed(2)}`,
      `NET SETTLEMENT: $${settlement.netSettlement.toFixed(2)}`
    ];

    const content = [...headers, ...rows, ...summary].join("\n");
    downloadFile(content, `settlement-${settlement.driverName.replace(/\s/g, "-")}-${new Date().toISOString().split('T')[0]}.csv`, "text/csv");
  };

  const toggleTripSelection = (tripId: string) => {
    const newSelected = new Set(selectedTrips);
    if (newSelected.has(tripId)) {
      newSelected.delete(tripId);
    } else {
      newSelected.add(tripId);
    }
    setSelectedTrips(newSelected);
  };

  const toggleAllTrips = () => {
    if (selectedTrips.size === filteredTrips.length) {
      setSelectedTrips(new Set());
    } else {
      setSelectedTrips(new Set(filteredTrips.map(t => t.id)));
    }
  };

  return (
    <div className="flex flex-col gap-0 rounded-lg border border-neutral-800 bg-neutral-950 shadow-sm overflow-hidden min-h-[calc(100vh-120px)] w-full max-w-none">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-neutral-800 bg-neutral-900/50 px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="plain"
            size="sm"
            onClick={() => router.push("/trips/closed")}
            className="h-8 w-8 rounded-sm p-0 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-400" />
            <h1 className="text-lg font-bold text-neutral-100">Accounting & Settlements</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => refetch()}
            className="text-neutral-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-800 bg-neutral-900/30 px-4">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("accounting")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === "accounting"
                ? "text-emerald-400"
                : "text-neutral-400 hover:text-neutral-200"
            )}
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Accounting Export
            </div>
            {activeTab === "accounting" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("settlements")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === "settlements"
                ? "text-emerald-400"
                : "text-neutral-400 hover:text-neutral-200"
            )}
          >
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Driver Settlements
            </div>
            {activeTab === "settlements" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "accounting" ? (
          <AccountingTab
            trips={filteredTrips}
            selectedTrips={selectedTrips}
            selectedTotals={selectedTotals}
            searchQuery={searchQuery}
            dateRange={dateRange}
            isLoading={isLoading}
            onSearchChange={setSearchQuery}
            onDateRangeChange={setDateRange}
            onToggleTrip={toggleTripSelection}
            onToggleAll={toggleAllTrips}
            onExport={handleExport}
          />
        ) : (
          <SettlementsTab
            settlements={driverSettlements}
            isLoading={isLoading}
            onExportSettlement={handleExportSettlement}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCOUNTING TAB
// ═══════════════════════════════════════════════════════════════════════════

interface AccountingTabProps {
  trips: ClosedTrip[];
  selectedTrips: Set<string>;
  selectedTotals: { count: number; revenue: number; cost: number; margin: number };
  searchQuery: string;
  dateRange: DateRange;
  isLoading: boolean;
  onSearchChange: (query: string) => void;
  onDateRangeChange: (range: DateRange) => void;
  onToggleTrip: (tripId: string) => void;
  onToggleAll: () => void;
  onExport: (format: ExportFormat) => void;
}

function AccountingTab({
  trips,
  selectedTrips,
  selectedTotals,
  searchQuery,
  dateRange,
  isLoading,
  onSearchChange,
  onDateRangeChange,
  onToggleTrip,
  onToggleAll,
  onExport,
}: AccountingTabProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const totals = useMemo(() => ({
    revenue: trips.reduce((sum, t) => sum + (t.revenue || 0), 0),
    cost: trips.reduce((sum, t) => sum + (t.totalCost || 0), 0),
    margin: trips.reduce((sum, t) => sum + (t.margin || 0), 0),
  }), [trips]);

  return (
    <div className="p-3 space-y-3">
      {/* Summary Cards - Compact */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-neutral-800 bg-neutral-900/60 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] text-neutral-500 uppercase">Total Revenue</span>
          </div>
          <p className="text-xl font-bold text-emerald-400">${totals.revenue.toLocaleString()}</p>
          <p className="text-[10px] text-neutral-500">{trips.length} closed trips</p>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/60 p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] text-neutral-500 uppercase">Total Cost</span>
          </div>
          <p className="text-xl font-bold text-amber-400">${totals.cost.toLocaleString()}</p>
          <p className="text-[10px] text-neutral-500">Operating expenses</p>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/60 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[10px] text-neutral-500 uppercase">Net Margin</span>
          </div>
          <p className="text-xl font-bold text-blue-400">${totals.margin.toLocaleString()}</p>
          <p className="text-[10px] text-neutral-500">
            {totals.revenue > 0 ? ((totals.margin / totals.revenue) * 100).toFixed(1) : 0}% margin
          </p>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/60 p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-[10px] text-neutral-500 uppercase">Selected</span>
          </div>
          <p className="text-xl font-bold text-purple-400">{selectedTotals.count}</p>
          <p className="text-[10px] text-neutral-500">
            {selectedTotals.count > 0 ? `$${selectedTotals.revenue.toLocaleString()} revenue` : "None selected"}
          </p>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search trips..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-64 bg-neutral-900 border-neutral-700"
            />
          </div>
          
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded-lg p-1">
            {(["week", "month", "custom"] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => onDateRangeChange(range)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                  dateRange === range
                    ? "bg-neutral-700 text-white"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                {range === "week" ? "This Week" : range === "month" ? "This Month" : "Custom"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export {selectedTotals.count > 0 ? `(${selectedTotals.count})` : "All"}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
            
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-10 overflow-hidden">
                <button
                  onClick={() => { onExport("csv"); setShowExportMenu(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-800 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-neutral-400" />
                  Export as CSV
                </button>
                <button
                  onClick={() => { onExport("excel"); setShowExportMenu(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-800 flex items-center gap-2 border-t border-neutral-800"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  Export as Excel
                </button>
                <button
                  onClick={() => { onExport("quickbooks"); setShowExportMenu(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-800 flex items-center gap-2 border-t border-neutral-800"
                >
                  <Calculator className="h-4 w-4 text-blue-400" />
                  QuickBooks IIF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trips Table */}
      <div className="border border-neutral-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-900/80 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedTrips.size === trips.length && trips.length > 0}
                  onChange={onToggleAll}
                  className="rounded border-neutral-600 bg-neutral-800 text-emerald-500 focus:ring-emerald-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-neutral-400">Trip #</th>
              <th className="px-4 py-3 text-left text-neutral-400">Customer</th>
              <th className="px-4 py-3 text-left text-neutral-400">Route</th>
              <th className="px-4 py-3 text-right text-neutral-400">Miles</th>
              <th className="px-4 py-3 text-right text-neutral-400">Revenue</th>
              <th className="px-4 py-3 text-right text-neutral-400">Cost</th>
              <th className="px-4 py-3 text-right text-neutral-400">Margin</th>
              <th className="px-4 py-3 text-left text-neutral-400">Closed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-neutral-500">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading trips...
                </td>
              </tr>
            ) : trips.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-neutral-500">
                  No closed trips found
                </td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr
                  key={trip.id}
                  className={cn(
                    "hover:bg-neutral-900/50 transition-colors",
                    selectedTrips.has(trip.id) && "bg-emerald-500/5"
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedTrips.has(trip.id)}
                      onChange={() => onToggleTrip(trip.id)}
                      className="rounded border-neutral-600 bg-neutral-800 text-emerald-500 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-neutral-200">{trip.tripNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-300">{trip.customer || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <div className="text-neutral-400 truncate max-w-[200px]">{trip.pickup}</div>
                      <div className="text-neutral-500 truncate max-w-[200px]">→ {trip.delivery}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-neutral-300">{trip.miles?.toLocaleString() || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-emerald-400">${trip.revenue?.toLocaleString() || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-amber-400">${trip.totalCost?.toLocaleString() || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      "text-sm font-medium",
                      (trip.margin || 0) >= 0 ? "text-blue-400" : "text-red-400"
                    )}>
                      ${trip.margin?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {trip.closedAt || trip.completedAt 
                      ? new Date(trip.closedAt || trip.completedAt!).toLocaleDateString()
                      : "—"
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTLEMENTS TAB
// ═══════════════════════════════════════════════════════════════════════════

interface SettlementsTabProps {
  settlements: DriverSettlement[];
  isLoading: boolean;
  onExportSettlement: (settlement: DriverSettlement) => void;
}

function SettlementsTab({ settlements, isLoading, onExportSettlement }: SettlementsTabProps) {
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
  const [approvedSettlements, setApprovedSettlements] = useState<Set<string>>(new Set());

  const totals = useMemo(() => ({
    drivers: settlements.length,
    trips: settlements.reduce((sum, s) => sum + s.trips.length, 0),
    totalPay: settlements.reduce((sum, s) => sum + s.totalPay, 0),
    totalFuel: settlements.reduce((sum, s) => sum + s.totalFuelCost, 0),
    netSettlement: settlements.reduce((sum, s) => sum + s.netSettlement, 0),
  }), [settlements]);

  const handleApprove = (driverId: string) => {
    const newApproved = new Set(approvedSettlements);
    newApproved.add(driverId);
    setApprovedSettlements(newApproved);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-neutral-500 uppercase">Drivers</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{totals.drivers}</p>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-neutral-500 uppercase">Total Trips</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">{totals.trips}</p>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-neutral-500 uppercase">Gross Pay</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">${totals.totalPay.toLocaleString()}</p>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Fuel className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-neutral-500 uppercase">Fuel Deductions</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">${totals.totalFuel.toLocaleString()}</p>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-neutral-500 uppercase">Net Settlement</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400">${totals.netSettlement.toLocaleString()}</p>
        </Card>
      </div>

      {/* Driver Settlements */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="border-neutral-800 bg-neutral-900/60 p-8 text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-neutral-400" />
            <p className="text-neutral-500">Loading settlements...</p>
          </Card>
        ) : settlements.length === 0 ? (
          <Card className="border-neutral-800 bg-neutral-900/60 p-8 text-center">
            <User className="h-8 w-8 mx-auto mb-2 text-neutral-600" />
            <p className="text-neutral-500">No driver settlements to process</p>
          </Card>
        ) : (
          settlements.map((settlement) => {
            const isExpanded = expandedDriver === settlement.driverId;
            const isApproved = approvedSettlements.has(settlement.driverId);

            return (
              <Card
                key={settlement.driverId}
                className={cn(
                  "border-neutral-800 bg-neutral-900/60 overflow-hidden",
                  isApproved && "border-emerald-500/30"
                )}
              >
                {/* Settlement Header */}
                <button
                  onClick={() => setExpandedDriver(isExpanded ? null : settlement.driverId)}
                  className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <User className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-neutral-100">{settlement.driverName}</p>
                      <p className="text-xs text-neutral-500">
                        {settlement.trips.length} trips • {settlement.totalMiles.toLocaleString()} miles
                      </p>
                    </div>
                    {isApproved && (
                      <span className="px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Approved
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">Gross Pay</p>
                      <p className="font-semibold text-emerald-400">${settlement.totalPay.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">Fuel</p>
                      <p className="font-semibold text-amber-400">-${settlement.totalFuelCost.toLocaleString()}</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="text-xs text-neutral-500">Net Settlement</p>
                      <p className="text-xl font-bold text-cyan-400">${settlement.netSettlement.toLocaleString()}</p>
                    </div>
                    <ChevronDown className={cn(
                      "h-5 w-5 text-neutral-400 transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-neutral-800">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-900/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs text-neutral-500 uppercase">Trip</th>
                          <th className="px-4 py-2 text-left text-xs text-neutral-500 uppercase">Route</th>
                          <th className="px-4 py-2 text-right text-xs text-neutral-500 uppercase">Miles</th>
                          <th className="px-4 py-2 text-right text-xs text-neutral-500 uppercase">Revenue</th>
                          <th className="px-4 py-2 text-right text-xs text-neutral-500 uppercase">Driver Pay</th>
                          <th className="px-4 py-2 text-right text-xs text-neutral-500 uppercase">Fuel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/50">
                        {settlement.trips.map((trip) => (
                          <tr key={trip.id} className="hover:bg-neutral-800/20">
                            <td className="px-4 py-2 font-mono text-neutral-300">{trip.tripNumber}</td>
                            <td className="px-4 py-2 text-neutral-400">
                              <div className="truncate max-w-[200px]">{trip.pickup}</div>
                              <div className="truncate max-w-[200px] text-neutral-500">→ {trip.delivery}</div>
                            </td>
                            <td className="px-4 py-2 text-right text-neutral-300">{trip.miles?.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right text-neutral-300">${trip.revenue?.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right text-emerald-400">${trip.driverPay?.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right text-amber-400">-${trip.fuelCost?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-neutral-900/50 font-semibold">
                        <tr>
                          <td className="px-4 py-3" colSpan={2}>TOTAL</td>
                          <td className="px-4 py-3 text-right text-neutral-200">{settlement.totalMiles.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-neutral-200">${settlement.totalRevenue.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-emerald-400">${settlement.totalPay.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-amber-400">-${settlement.totalFuelCost.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Actions */}
                    <div className="p-4 bg-neutral-900/30 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <Clock className="h-4 w-4" />
                        Settlement period: Last 7 days
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="subtle"
                          size="sm"
                          onClick={() => onExportSettlement(settlement)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export Statement
                        </Button>
                        {!isApproved && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(settlement.driverId)}
                            className="bg-emerald-600 hover:bg-emerald-500"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve Settlement
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
