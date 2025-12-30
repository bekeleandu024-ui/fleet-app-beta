import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

const shimmerClass = "animate-pulse bg-gradient-to-r from-zinc-800/50 via-zinc-700/50 to-zinc-800/50";

export function AIAnalysisSkeleton() {
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
