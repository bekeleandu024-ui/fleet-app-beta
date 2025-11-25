"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TripListItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { enrichTripAction } from "@/app/actions/enrich-trip";

interface TripTicketCardProps {
  trip: TripListItem;
  className?: string;
  onClick?: () => void;
}

export function TripTicketCard({ trip, className, onClick }: TripTicketCardProps) {
  const [enrichedData, setEnrichedData] = useState<{
    distance?: number;
    duration?: number;
    latestStartTime?: string;
  }>({});
  const [isLoadingEnrichment, setIsLoadingEnrichment] = useState(false);

  // Enrich data if missing
  useEffect(() => {
    const needsEnrichment = !trip.distance || !trip.duration;
    
    if (needsEnrichment && !isLoadingEnrichment && !enrichedData.distance) {
      const enrich = async () => {
        setIsLoadingEnrichment(true);
        try {
          const metrics = await enrichTripAction(trip.pickup, trip.delivery);
          if (metrics) {
            // Calculate latest start time if we have a pickup window
            let latestStart: string | undefined;
            // This is a simplified logic - in reality we'd parse the window string
            // For now, we'll just use the metrics
            
            setEnrichedData({
              distance: metrics.distance,
              duration: metrics.duration,
              // We could calculate latest start here if we parsed the window dates
            });
          }
        } catch (err) {
          console.error("Failed to enrich trip card:", err);
        } finally {
          setIsLoadingEnrichment(false);
        }
      };
      
      enrich();
    }
  }, [trip.distance, trip.duration, trip.pickup, trip.delivery]);

  // Merge props with enriched data
  const displayDistance = trip.distance || enrichedData.distance;
  const displayDuration = trip.duration || enrichedData.duration;
  
  // Calculate latest start time dynamically if we have duration and pickup window
  const displayLatestStart = trip.latestStartTime || (() => {
    if (!displayDuration || !trip.pickupWindow) return undefined;
    try {
      // Try to parse the pickup window string (e.g. "11/24/2025, 6:21:07 PM")
      const windowDate = new Date(trip.pickupWindow);
      if (isNaN(windowDate.getTime())) return undefined;
      
      // Subtract duration + buffer (e.g. 1 hour)
      const latest = new Date(windowDate.getTime() - (displayDuration * 60 * 60 * 1000));
      return latest.toLocaleString();
    } catch (e) {
      return undefined;
    }
  })();

  // Format currency
  const formatCurrency = (value?: number) => 
    value ? `$${value.toFixed(2)}` : "--";

  // Format CPM
  const formatCpm = (value?: number) => 
    value ? `$${value.toFixed(2)}` : "--";

  return (
    <Card 
      className={cn(
        "rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-4 transition-all hover:border-zinc-700",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          <div className="min-w-max">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Customer</p>
            <p className="text-sm font-semibold text-white">{trip.customer || "Unknown"}</p>
          </div>
          
          <div className="h-8 w-px bg-zinc-800 shrink-0" />
          
          <div className="min-w-max">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Route</p>
            <p className="text-sm text-zinc-300">{trip.pickup} → {trip.delivery}</p>
          </div>
          
          <div className="h-8 w-px bg-zinc-800 shrink-0" />
          
          <div className="min-w-max">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Pickup Window</p>
            <p className="text-sm text-zinc-300">{trip.pickupWindow || trip.eta || "--"}</p>
          </div>
          
          <div className="h-8 w-px bg-zinc-800 shrink-0" />

          <div className="min-w-max">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Latest Start</p>
            <p className="text-sm text-amber-400 font-medium">
              {isLoadingEnrichment ? (
                <span className="animate-pulse">Calculating...</span>
              ) : (
                displayLatestStart || "--"
              )}
            </p>
          </div>
          
          <div className="h-8 w-px bg-zinc-800 shrink-0" />
          
          <div className="min-w-max">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Distance</p>
            <p className="text-sm text-zinc-300">
              {isLoadingEnrichment ? (
                <span className="animate-pulse">...</span>
              ) : (
                displayDistance ? `${displayDistance} mi` : "--"
              )}
            </p>
          </div>
          
          <div className="h-8 w-px bg-zinc-800 shrink-0" />
          
          <div className="min-w-max">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Duration</p>
            <p className="text-sm text-zinc-300">
              {isLoadingEnrichment ? (
                <span className="animate-pulse">...</span>
              ) : (
                displayDuration ? `${displayDuration} hrs` : "--"
              )}
            </p>
          </div>
          
          {trip.commodity && (
            <>
              <div className="h-8 w-px bg-zinc-800 shrink-0" />
              <div className="min-w-max">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Commodity</p>
                <p className="text-sm text-zinc-300">{trip.commodity}</p>
              </div>
            </>
          )}
          
          <div className="h-8 w-px bg-zinc-800 shrink-0" />
          
          <div className="min-w-max">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Driver / Unit</p>
            <p className="text-sm text-white font-semibold">
              {trip.driver} · {trip.unit}
            </p>
          </div>
          
          {trip.driverType && (
            <>
              <div className="h-8 w-px bg-zinc-800 shrink-0" />
              <div className="min-w-max">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Type</p>
                <p className="text-sm text-blue-400 font-semibold">{trip.driverType}</p>
              </div>
            </>
          )}
          
          {trip.totalCost && (
            <>
              <div className="h-8 w-px bg-zinc-800 shrink-0" />
              <div className="min-w-max">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Total Cost</p>
                <p className="text-sm text-rose-400 font-bold">
                  {formatCurrency(trip.totalCost)}
                  {trip.totalCpm && displayDistance && (
                    <span className="text-[10px] text-zinc-500 ml-1">
                      ({formatCpm(trip.totalCpm)} × {displayDistance} mi)
                    </span>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
        
        {trip.serviceLevel && (
          <span className="px-3 py-1.5 text-xs font-semibold text-white bg-zinc-800 rounded shrink-0 ml-4">
            {trip.serviceLevel.toUpperCase()}
          </span>
        )}
      </div>

      {/* Trip Progress Section */}
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-zinc-400">Trip Progress</p>
            <span className="text-xs font-bold text-blue-400 uppercase">{trip.status}</span>
          </div>
          <span className="text-xs text-zinc-600">Delivered</span>
        </div>
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: getProgressWidth(trip.status) }}
          />
        </div>
      </div>
    </Card>
  );
}

function getProgressWidth(status: string): string {
  const s = status.toLowerCase().replace(/_/g, ' ');
  switch (s) {
    case 'planning': return '5%';
    case 'assigned': return '10%';
    case 'en route to pickup': return '15%';
    case 'at pickup': return '25%';
    case 'departed pickup': return '35%';
    case 'in transit': return '50%';
    case 'at delivery': return '75%';
    case 'delivered': return '90%';
    case 'completed': return '100%';
    default: return '5%';
  }
}
