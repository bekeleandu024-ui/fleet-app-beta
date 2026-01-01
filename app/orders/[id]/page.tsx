"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { 
  Gauge, 
  CheckCircle2, 
  AlertCircle,
  MapPin,
  Truck,
  Clock,
  ExternalLink,
  Layers,
  ArrowRight,
  Package,
  FileText,
  User,
} from "lucide-react";
import { useEffect } from "react";

import { AIOrderInsights } from "@/components/orders/ai-order-insights";
import { StatChip } from "@/components/stat-chip";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { fetchOrderDetail, updateOrderStatus } from "@/lib/api";
import { formatDurationHours } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import { cn } from "@/lib/utils";

// ============================================================================
// FULFILLMENT STATUS WIDGET
// ============================================================================

interface FulfillmentStatusProps {
  status: string;
  tripId?: string | null;
  tripNumber?: string | null;
  driverName?: string | null;
  dispatchStatus?: string;
}

function FulfillmentStatus({ 
  status, 
  tripId, 
  tripNumber, 
  driverName,
  dispatchStatus 
}: FulfillmentStatusProps) {
  const isPlanned = tripId || dispatchStatus === "PLANNED" || dispatchStatus === "FLEET_DISPATCH";
  const isInTransit = status === "In Transit";
  const isDelivered = status === "Delivered" || status === "Completed";

  if (isDelivered) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-400">Delivered</h3>
              <p className="text-xs text-emerald-400/70">Order has been completed successfully</p>
            </div>
          </div>
          {tripId && (
            <Link href={`/trips/${tripId}`}>
              <Button size="sm" variant="subtle" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">
                <FileText className="h-4 w-4 mr-2" />
                View Trip Details
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (isInTransit) {
    return (
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Truck className="h-5 w-5 text-blue-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-400">In Transit</h3>
              <p className="text-xs text-blue-400/70">
                {driverName ? `Assigned to ${driverName}` : "Currently being transported"}
                {tripNumber && ` - Trip ${tripNumber}`}
              </p>
            </div>
          </div>
          {tripId && (
            <Link href={`/trips/${tripId}`}>
              <Button size="sm" variant="subtle" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20">
                <MapPin className="h-4 w-4 mr-2" />
                Track Shipment
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (isPlanned) {
    return (
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <Layers className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-violet-400">Assigned to Trip</h3>
              <p className="text-xs text-violet-400/70">
                {tripNumber ? `Trip #${tripNumber}` : "Assigned to a planned trip"}
                {driverName && ` - ${driverName}`}
              </p>
            </div>
          </div>
          {tripId ? (
            <Link href={`/trips/${tripId}`}>
              <Button size="sm" variant="subtle" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/20">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Trip
              </Button>
            </Link>
          ) : (
            <Link href="/dispatch">
              <Button size="sm" variant="subtle" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/20">
                <Layers className="h-4 w-4 mr-2" />
                View on Dispatch Board
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Unplanned / Pending Dispatch
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-400">Pending Dispatch</h3>
            <p className="text-xs text-amber-400/70">This order has not been assigned to a trip yet</p>
          </div>
        </div>
        <Link href="/dispatch">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
            <ArrowRight className="h-4 w-4 mr-2" />
            Go to Dispatch Board
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// STATUS VARIANT CONFIG
// ============================================================================

const statusVariant: Record<string, "default" | "ok" | "warn" | "alert"> = {
  "In Transit": "ok",
  "Delivered": "default",
  "Completed": "default",
  "Planning": "default",
  "New": "default",
  "Exception": "alert",
  "At Risk": "warn",
};

// ============================================================================
// MAIN ORDER DETAIL PAGE
// ============================================================================

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params?.id ?? "";
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrderDetail(orderId),
    enabled: Boolean(orderId),
    retry: 2,
    retryDelay: 500,
  });

  useEffect(() => {
    if (isError) {
      console.error("Order fetch error:", error);
    }
  }, [isError, error]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status");
    }
  };

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (isError || !data) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return (
      <section className="col-span-12 rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-3 py-12">
          <AlertCircle className="h-12 w-12 text-red-400/70" />
          <div>
            <h2 className="text-lg font-semibold text-neutral-200 mb-1">Unable to load order</h2>
            <p className="text-sm text-neutral-500">Order ID: <code className="text-xs bg-neutral-800 px-2 py-0.5 rounded">{orderId}</code></p>
            {isError && (
              <p className="text-xs text-red-400/70 mt-2">Error: {errorMessage}</p>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => router.push("/orders")} variant="outline" size="sm">
              Back to Orders
            </Button>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) })} size="sm">
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const headerChips = [
    { label: `${formatDurationHours(data.ageHours)} old` },
    { label: `${data.laneMiles} lane mi` },
  ];

  const progressSteps = [
    { label: "Created", active: true },
    { label: "Dispatched", active: data.status !== "New" && data.status !== "Planning" },
    { label: "In Transit", active: data.status === "In Transit" || data.status === "Delivered" || data.status === "Completed" },
    { label: "Delivered", active: data.status === "Delivered" || data.status === "Completed" },
  ];

  return (
    <div className="col-span-12 max-w-[1440px] mx-auto">
      {/* Fulfillment Status Banner */}
      <div className="mb-4">
        <FulfillmentStatus 
          status={data.status}
          tripId={data.tripId}
          tripNumber={data.tripNumber}
          driverName={data.driverName}
          dispatchStatus={data.dispatchStatus}
        />
      </div>

      {/* Header */}
      <header className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-lg font-semibold text-neutral-200">Order {data.reference}</h1>
            <p className="text-xs text-neutral-500">ID: {data.id} - {data.lane}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none z-10 ${
                statusVariant[data.status] === "ok" ? "bg-emerald-500" :
                statusVariant[data.status] === "warn" ? "bg-amber-500" :
                statusVariant[data.status] === "alert" ? "bg-rose-500" :
                "bg-neutral-500"
              }`} />
              <Select 
                value={data.status} 
                onChange={(e) => handleStatusChange(e.target.value)}
                className="h-7 w-[130px] text-xs bg-neutral-900 border-neutral-800 pl-6 py-0"
              >
                {["New", "Planning", "In Transit", "At Risk", "Delivered", "Exception", "Completed"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </Select>
            </div>
            {headerChips.map((chip) => (
              <StatChip key={chip.label} label={chip.label} variant="default" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {progressSteps.map((step, idx) => (
            <div key={step.label} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-1 rounded text-xs ${
                step.active 
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" 
                  : "bg-neutral-800/50 text-neutral-500"
              }`}>
                {step.active && <CheckCircle2 className="w-3 h-3" />}
                {step.label}
              </div>
              {idx < progressSteps.length - 1 && (
                <div className="w-4 h-px bg-neutral-700 mx-1" />
              )}
            </div>
          ))}
        </div>
      </header>

      {/* 2-Column Layout */}
      <section className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <AIOrderInsights orderId={orderId} />
        </div>
        <div className="col-span-12 lg:col-span-7 space-y-4">
          {/* Order Summary */}
          <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500">Customer</p>
                  <p className="font-semibold text-neutral-200">{data.customer}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Service Level</p>
                  <p className="text-neutral-200">{data.serviceLevel}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500">Commodity</p>
                  <p className="text-neutral-200">{data.snapshot?.commodity || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Equipment</p>
                  <p className="text-neutral-200">{data.equipmentType || "Van"}</p>
                </div>
              </div>
            </div>
          </article>

          {/* Route & Stops */}
          <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Route & Stops
            </h2>
            <ul className="space-y-3">
              {data.snapshot?.stops?.map((stop: any, idx: number) => (
                <li key={stop.id || idx} className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      stop.type === "Pickup" ? "bg-emerald-500/20" : "bg-red-500/20"
                    )}>
                      <MapPin className={cn(
                        "h-4 w-4",
                        stop.type === "Pickup" ? "text-emerald-400" : "text-red-400"
                      )} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <Badge className={cn(
                          "text-xs",
                          stop.type === "Pickup" 
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        )}>
                          {stop.type}
                        </Badge>
                        <div className="text-xs text-neutral-500">
                          {stop.windowStart && new Date(stop.windowStart).toLocaleDateString([], { month: "short", day: "numeric" })}
                          {" "}
                          {stop.windowStart && new Date(stop.windowStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <p className="text-sm text-neutral-200">{stop.location}</p>
                      {stop.instructions && (
                        <p className="text-xs text-neutral-500 mt-1">{stop.instructions}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          {/* Pricing Summary */}
          <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide flex items-center gap-2 mb-3">
              <Gauge className="h-4 w-4" />
              Pricing Summary
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <dt className="text-xs text-neutral-500">Quoted Rate</dt>
                <dd className="font-semibold text-emerald-400">${data.cost?.toLocaleString() || "---"}</dd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <dt className="text-xs text-neutral-500">Lane Miles</dt>
                <dd className="text-neutral-200">{data.laneMiles} mi</dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-xs text-neutral-500">Rate per Mile</dt>
                <dd className="text-neutral-200">
                  ${data.cost && data.laneMiles ? (data.cost / data.laneMiles).toFixed(2) : "---"}/mi
                </dd>
              </div>
            </dl>
          </article>

          {/* Assignment Info */}
          {(data.driverName || data.tripNumber) && (
            <article className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
              <h2 className="text-sm font-medium text-violet-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Assignment Details
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {data.tripNumber && (
                  <div>
                    <p className="text-xs text-violet-400/70">Trip Number</p>
                    <p className="font-semibold text-violet-300">{data.tripNumber}</p>
                  </div>
                )}
                {data.driverName && (
                  <div>
                    <p className="text-xs text-violet-400/70">Driver</p>
                    <p className="text-violet-300">{data.driverName}</p>
                  </div>
                )}
                {data.unitNumber && (
                  <div>
                    <p className="text-xs text-violet-400/70">Unit</p>
                    <p className="text-violet-300">{data.unitNumber}</p>
                  </div>
                )}
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="col-span-12 max-w-[1440px] mx-auto">
      <div className="h-20 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60 mb-4" />
      <header className="h-24 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60 mb-4" />
      <section className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="h-64 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
        </div>
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <div className="h-40 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
          <div className="h-56 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
          <div className="h-32 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
        </div>
      </section>
    </div>
  );
}
