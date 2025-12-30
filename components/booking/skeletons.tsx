/**
 * Skeleton components for Trip Book page
 * These provide stable, fixed-size placeholders during loading states
 */

import { Card } from '@/components/ui/card';
import { Sparkles, Package, TrendingUp, User, DollarSign } from 'lucide-react';

/**
 * Shimmer animation for skeleton loaders
 */
const shimmerClass = "animate-pulse bg-gradient-to-r from-zinc-800/50 via-zinc-700/50 to-zinc-800/50";

/**
 * AI Insights Panel Skeleton - Matches exact final dimensions
 * Height: 720px (fixed)
 */
export function AIInsightsPanelSkeleton() {
  return (
    <div className="space-y-4 h-[720px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
        <div className={`h-4 w-48 rounded ${shimmerClass}`}></div>
      </div>

      {/* Resource Recommendation Card */}
      <Card className="p-4 bg-zinc-900/40 border-zinc-800 h-[180px]">
        <div className="flex items-start gap-3 h-full">
          <div className={`p-2 rounded-lg shrink-0 w-9 h-9 ${shimmerClass}`}></div>
          <div className="flex-1 space-y-3">
            <div className={`h-4 w-32 rounded ${shimmerClass}`}></div>
            
            {/* Driver section */}
            <div className="space-y-2">
              <div className={`h-3 w-16 rounded ${shimmerClass}`}></div>
              <div className={`h-4 w-40 rounded ${shimmerClass}`}></div>
              <div className={`h-3 w-full rounded ${shimmerClass}`}></div>
            </div>

            {/* Unit section */}
            <div className="space-y-2">
              <div className={`h-3 w-12 rounded ${shimmerClass}`}></div>
              <div className={`h-4 w-28 rounded ${shimmerClass}`}></div>
              <div className={`h-3 w-full rounded ${shimmerClass}`}></div>
            </div>

            {/* Button */}
            <div className={`h-8 w-full rounded ${shimmerClass}`}></div>
          </div>
        </div>
      </Card>

      {/* Revenue & Timing Card */}
      <div className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50 h-[160px]">
        <div className={`h-3 w-56 rounded mb-3 ${shimmerClass}`}></div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className={`h-3 w-24 rounded ${shimmerClass}`}></div>
            <div className={`h-3 w-12 rounded ${shimmerClass}`}></div>
          </div>
          <div className="flex items-center justify-between">
            <div className={`h-3 w-28 rounded ${shimmerClass}`}></div>
            <div className={`h-3 w-20 rounded ${shimmerClass}`}></div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
            <div className={`h-3 w-20 rounded ${shimmerClass}`}></div>
            <div className={`h-3 w-24 rounded ${shimmerClass}`}></div>
          </div>
        </div>
        
        <div className={`h-10 rounded mt-2 pt-2 border-t border-zinc-800 ${shimmerClass}`}></div>
      </div>

      {/* Additional info placeholder */}
      <div className={`h-[80px] rounded-lg ${shimmerClass}`}></div>
    </div>
  );
}

/**
 * Order Snapshot Skeleton - Matches horizontal card dimensions
 */
export function OrderSnapshotSkeleton() {
  return (
    <Card className="mb-4 rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-4 h-[72px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <div className="h-8 w-px bg-zinc-800" />}
              <div className="space-y-1">
                <div className={`h-2 w-16 rounded ${shimmerClass}`}></div>
                <div className={`h-3 w-24 rounded ${shimmerClass}`}></div>
              </div>
            </div>
          ))}
        </div>
        <div className={`h-6 w-20 rounded ${shimmerClass}`}></div>
      </div>
    </Card>
  );
}

/**
 * Booking Form Skeleton - Matches form card dimensions
 */
export function BookingFormSkeleton() {
  return (
    <Card className="rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-5 min-h-[680px]">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-blue-400" />
        <div className={`h-5 w-40 rounded ${shimmerClass}`}></div>
      </div>
      
      {/* Driver Type Cards */}
      <div className="mb-4">
        <div className={`h-3 w-48 rounded mb-3 ${shimmerClass}`}></div>
        <div className="grid grid-cols-1 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`h-[120px] rounded-lg border border-zinc-800 p-4 ${shimmerClass}`}>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Revenue Input */}
      <div className="mt-4">
        <div className={`h-3 w-40 rounded mb-2 ${shimmerClass}`}></div>
        <div className={`h-10 w-full rounded-lg ${shimmerClass}`}></div>
      </div>

      {/* Trip Start Date */}
      <div className="mt-4">
        <div className={`h-3 w-36 rounded mb-2 ${shimmerClass}`}></div>
        <div className={`h-10 w-full rounded-lg ${shimmerClass}`}></div>
      </div>

      {/* Submit Button */}
      <div className={`h-12 w-full rounded mt-4 ${shimmerClass}`}></div>
    </Card>
  );
}

/**
 * Resource List Skeleton - Matches side panel dimensions
 */
export function ResourceListSkeleton({ title, icon: Icon, itemCount = 5 }: { 
  title: string; 
  icon: typeof Package; 
  itemCount?: number;
}) {
  return (
    <Card className="rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-3 h-[240px]">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-zinc-400" />
        <div className={`h-3 w-32 rounded ${shimmerClass}`}></div>
      </div>
      <div className="space-y-2 overflow-hidden">
        {[...Array(itemCount)].map((_, i) => (
          <div key={i} className={`rounded p-2.5 border border-zinc-800/50 h-[48px] ${shimmerClass}`}>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Empty State Placeholder - Shown when no order selected
 */
export function EmptyStatePlaceholder() {
  return (
    <div className="mb-4 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20 p-6 text-center h-[72px] flex items-center justify-center">
      <p className="text-sm text-zinc-400">Select a qualified order from the right panel to begin booking</p>
    </div>
  );
}
