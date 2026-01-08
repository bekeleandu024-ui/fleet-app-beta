"use client";

import {
  AlertTriangle,
  Box,
  Calendar,
  Clock,
  Copy,
  DollarSign,
  Edit2,
  ExternalLink,
  FileText,
  MapPin,
  Package,
  Scale,
  Snowflake,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/format";

// Status colors
const statusColors: Record<string, string> = {
  New: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Planning: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  "In Transit": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "At Risk": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Delivered: "bg-zinc-500/20 text-zinc-500 border-zinc-500/30",
  Exception: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "Ready to Book": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Fleet Assigned": "bg-violet-500/20 text-violet-400 border-violet-500/30",
  Brokerage: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const priorityColors: Record<string, string> = {
  Critical: "text-rose-400",
  High: "text-amber-400",
  Normal: "text-zinc-400",
  Low: "text-zinc-500",
};

interface FreightItem {
  id: string;
  lineNumber: number;
  commodity: string;
  description?: string;
  quantity: number;
  pieces?: number;
  packagingType: string;
  weightLbs: number;
  dimensions?: string;
  cubicFeet?: number;
  density?: number;
  freightClass?: string;
  nmfcCode?: string;
  isHazmat: boolean;
  hazmatClass?: string;
  unNumber?: string;
  hazmatPackingGroup?: string;
  stackable: boolean;
  temperatureControlled: boolean;
  minTemp?: number;
  maxTemp?: number;
  declaredValue?: number;
}

interface OrderDetailPanelProps {
  order: any;
  onEdit?: () => void;
  onCancel?: () => void;
  onDuplicate?: () => void;
}

export function OrderDetailPanel({
  order,
  onEdit,
  onCancel,
  onDuplicate,
}: OrderDetailPanelProps) {
  if (!order) return null;

  const statusStyle = statusColors[order.status] || "bg-zinc-800 text-zinc-400 border-zinc-700";
  const priorityStyle = priorityColors[order.priority] || "text-zinc-400";
  
  // Extract data with fallbacks
  const quotedRate = order.billing?.quotedRate ?? order.rate ?? 0;
  const targetRate = order.billing?.targetRate;
  const weight = order.cargo?.totalWeightLbs ?? order.weight ?? 0;
  const pallets = order.cargo?.totalPallets ?? 0;
  const pieces = order.cargo?.totalPieces ?? 0;
  const cubicFeet = order.cargo?.totalCubicFeet;
  const linearFeet = order.cargo?.totalLinearFeet;
  const freightItems: FreightItem[] = order.freightItems ?? [];
  const primaryCommodity = freightItems.length > 0 
    ? freightItems[0].commodity 
    : (order.cargo?.commodity ?? order.snapshot?.commodity ?? "General Freight");
  const equipmentType = order.equipment?.type ?? order.equipmentType ?? "Dry Van";
  const equipmentLength = order.equipment?.length;
  const temperatureSetting = order.equipment?.temperatureSetting;
  const laneMiles = order.laneMiles ?? 0;
  const stops = order.snapshot?.stops ?? [];
  const isHazmat = order.cargo?.isHazmat ?? freightItems.some((f: FreightItem) => f.isHazmat);
  const isHighValue = order.cargo?.isHighValue ?? false;
  const stackable = order.cargo?.stackable ?? true;
  const declaredValue = order.cargo?.declaredValue;
  const serviceLevel = order.serviceLevel ?? "Standard";
  const sourceChannel = order.sourceChannel;
  const specialInstructions = order.notes?.special ?? order.snapshot?.notes;
  const internalNotes = order.notes?.internal;
  const billingStatus = order.billing?.status ?? "Pending";

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* Header */}
      <div className="flex-none border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">
              {order.orderNumber || order.reference}
            </h2>
            <p className="text-sm text-zinc-500">
              {order.customer} • {order.lane}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${statusStyle}`}>
              {order.status}
            </span>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
          <span className={`font-medium ${priorityStyle}`}>{order.priority || "Normal"} Priority</span>
          <span>•</span>
          <span>{serviceLevel}</span>
          {sourceChannel && (
            <>
              <span>•</span>
              <span className="capitalize">{sourceChannel}</span>
            </>
          )}
          {order.ageHours !== undefined && (
            <>
              <span>•</span>
              <span>{order.ageHours}h old</span>
            </>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button size="sm" variant="subtle" onClick={onEdit} className="h-8">
              <Edit2 className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
          {onDuplicate && (
            <Button size="sm" variant="subtle" onClick={onDuplicate} className="h-8">
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Duplicate
            </Button>
          )}
          <Link href={`/orders/${order.id}`}>
            <Button size="sm" variant="subtle" className="h-8">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Full Details
            </Button>
          </Link>
          {onCancel && (
            <Button size="sm" variant="subtle" onClick={onCancel} className="h-8 text-rose-400 hover:text-rose-300">
              <XCircle className="h-3.5 w-3.5 mr-1.5" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Content - 3 Column Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Column 1: Route & Stops */}
          <div className="col-span-5 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Route & Stops
              </span>
              {laneMiles > 0 && (
                <span className="ml-auto text-xs text-zinc-400 font-medium">{laneMiles.toLocaleString()} mi</span>
              )}
            </div>

            <div className="space-y-3 mb-4">
              {stops.length > 0 ? (
                stops.map((stop: any, idx: number) => (
                  <div key={stop.id || idx} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      stop.type === "Pickup" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">{stop.type}</p>
                      <p className="text-xs text-zinc-400 truncate">{stop.location}</p>
                      {stop.windowStart && (
                        <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(stop.windowStart)}
                        </p>
                      )}
                      {stop.instructions && (
                        <p className="text-xs text-zinc-500 mt-1 italic">
                          "{stop.instructions}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">Pickup</p>
                      <p className="text-xs text-zinc-400 truncate">{order.lane?.split(" → ")[0] || "TBD"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-rose-500/20 text-rose-400 flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">Delivery</p>
                      <p className="text-xs text-zinc-400 truncate">{order.lane?.split(" → ")[1] || "TBD"}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Rate Per Mile */}
            {laneMiles > 0 && quotedRate > 0 && (
              <>
                <div className="h-px bg-zinc-800 my-4" />
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Rate per Mile</span>
                  <span className="text-emerald-400 font-medium">{formatCurrency(quotedRate / laneMiles)}/mi</span>
                </div>
              </>
            )}

            {/* Notes Section */}
            {(specialInstructions || internalNotes) && (
              <>
                <div className="h-px bg-zinc-800 my-4" />
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Notes
                  </span>
                </div>
                {specialInstructions && (
                  <div className="text-xs text-zinc-400 mb-2">
                    <span className="text-zinc-500">Special:</span> {specialInstructions}
                  </div>
                )}
                {internalNotes && (
                  <div className="text-xs text-amber-400/80">
                    <span className="text-amber-500">Internal:</span> {internalNotes}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Column 2: Cargo & Equipment */}
          <div className="col-span-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
            {/* Freight Items Section */}
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Freight Items
              </span>
              <span className="ml-auto text-xs text-zinc-500">{freightItems.length || 1} item{freightItems.length !== 1 ? "s" : ""}</span>
            </div>

            {freightItems.length > 0 ? (
              <div className="space-y-3 mb-4">
                {freightItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{item.commodity}</p>
                        <p className="text-xs text-zinc-500">{item.packagingType} • {item.quantity} qty</p>
                      </div>
                      {item.isHazmat && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-500/20 rounded text-xs text-rose-400">
                          <AlertTriangle className="h-3 w-3" />
                          HAZ
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1 text-zinc-400">
                        <Scale className="h-3 w-3 text-zinc-500" />
                        {item.weightLbs.toLocaleString()} lbs
                      </div>
                      {item.dimensions && (
                        <div className="flex items-center gap-1 text-zinc-400">
                          <Box className="h-3 w-3 text-zinc-500" />
                          {item.dimensions}
                        </div>
                      )}
                      {item.temperatureControlled && (
                        <div className="flex items-center gap-1 text-cyan-400 col-span-2">
                          <Snowflake className="h-3 w-3" />
                          {item.minTemp && item.maxTemp ? `${item.minTemp}° - ${item.maxTemp}°F` : "Temp Controlled"}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-4">
                <p className="text-sm font-medium text-zinc-200">{primaryCommodity}</p>
                <p className="text-xs text-zinc-500 mt-1">{weight.toLocaleString()} lbs</p>
              </div>
            )}

            {/* Cargo Totals */}
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-zinc-500">Total Weight</span>
                <span className="text-zinc-200 font-medium">{weight.toLocaleString()} lbs</span>
              </div>
              {pallets > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Pallets</span>
                  <span className="text-zinc-200">{pallets}</span>
                </div>
              )}
              {pieces > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Pieces</span>
                  <span className="text-zinc-200">{pieces}</span>
                </div>
              )}
              {cubicFeet && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cubic Feet</span>
                  <span className="text-zinc-200">{cubicFeet} ft³</span>
                </div>
              )}
              {linearFeet && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Linear Feet</span>
                  <span className="text-zinc-200">{linearFeet} ft</span>
                </div>
              )}
            </div>

            {/* Cargo Flags */}
            {(isHazmat || isHighValue || !stackable) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {isHazmat && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-400">
                    <AlertTriangle className="h-3 w-3" />
                    Hazmat
                  </span>
                )}
                {isHighValue && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-400">
                    <DollarSign className="h-3 w-3" />
                    High Value
                  </span>
                )}
                {!stackable && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-500/10 border border-zinc-500/30 rounded text-xs text-zinc-400">
                    <Box className="h-3 w-3" />
                    Non-Stackable
                  </span>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-zinc-800 my-4" />

            {/* Equipment Section */}
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Equipment
              </span>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-zinc-500">Type</span>
                <span className="text-zinc-200">{equipmentType}</span>
              </div>
              {equipmentLength && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Length</span>
                  <span className="text-zinc-200">{equipmentLength}'</span>
                </div>
              )}
              {temperatureSetting && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Temp Setting</span>
                  <span className="text-cyan-400">{temperatureSetting}°F</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-800 my-4" />

            {/* Dispatch Section */}
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Dispatch
              </span>
            </div>

            {order.dispatch?.assignedDriverId || order.tripId ? (
              <div className="space-y-2">
                {order.tripId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Trip</span>
                    <Link href={`/trips/master?id=${order.tripId}`} className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      {order.tripNumber || order.tripId.slice(0, 8)}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
                {order.driverName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Driver</span>
                    <span className="text-zinc-200">{order.driverName}</span>
                  </div>
                )}
                {order.unitNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Unit</span>
                    <span className="text-zinc-200">{order.unitNumber}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-zinc-500 flex items-center gap-1.5">
                <XCircle className="h-4 w-4" />
                Not dispatched
              </div>
            )}
          </div>

          {/* Column 3: Financials */}
          <div className="col-span-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
            {/* Financials Section */}
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Financials
              </span>
            </div>

            <div className="text-center p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 mb-4">
              <p className="text-xs text-zinc-500 mb-1">Quoted Rate</p>
              <p className="text-2xl font-bold text-emerald-400">
                {formatCurrency(quotedRate)}
              </p>
            </div>

            <div className="space-y-2 text-sm mb-4">
              {targetRate && targetRate !== quotedRate && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Target Rate</span>
                  <span className="text-zinc-200">{formatCurrency(targetRate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Billing Status</span>
                <span className={`${
                  billingStatus === "Invoiced" 
                    ? "text-emerald-400" 
                    : billingStatus === "Pending"
                      ? "text-amber-400"
                      : "text-zinc-200"
                }`}>{billingStatus}</span>
              </div>
              {declaredValue && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Declared Value</span>
                  <span className="text-zinc-200">{formatCurrency(declaredValue)}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-800 my-4" />

            {/* Customer Section */}
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Customer
              </span>
            </div>

            <p className="text-sm font-medium text-zinc-200 mb-1">{order.customer}</p>
            {order.customerContact && (
              <p className="text-xs text-zinc-400">{order.customerContact}</p>
            )}
            {order.customerId && (
              <p className="text-xs text-zinc-500 mt-1">ID: {order.customerId.slice(0, 8)}</p>
            )}

            {/* Divider */}
            <div className="h-px bg-zinc-800 my-4" />

            {/* Timestamps */}
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Timeline
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {order.createdAt && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Created</span>
                  <span className="text-zinc-400">{formatDateTime(order.createdAt)}</span>
                </div>
              )}
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Updated</span>
                  <span className="text-zinc-400">{formatDateTime(order.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}