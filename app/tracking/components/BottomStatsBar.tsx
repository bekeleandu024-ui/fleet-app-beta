"use client";

import { NetworkPrediction } from "../types";

interface BottomStatsBarProps {
  totalTrips: number;
  onTimePercent: number;
  averageSpeed: number;
  prediction: NetworkPrediction;
}

export function BottomStatsBar({ totalTrips, onTimePercent, averageSpeed, prediction }: BottomStatsBarProps) {
  return (
    <div className="pointer-events-auto grid w-full grid-cols-1 gap-4 rounded-t-lg border border-border bg-card/95 p-4 text-foreground shadow-[0_-20px_40px_rgba(4,6,12,0.65)] backdrop-blur lg:grid-cols-4">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Total Active Trips</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">{totalTrips}</p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">On-Time %</p>
        <p className="mt-1 text-2xl font-semibold text-emerald-300">{onTimePercent.toFixed(0)}%</p>
        <p className="text-xs text-muted-foreground">Blend of on-time vs at-risk segments.</p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Average Speed</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">{averageSpeed.toFixed(0)} mph</p>
        <p className="text-xs text-muted-foreground">Rolling 15-minute average across all tractors.</p>
      </div>
      <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
        <p className="text-[11px] uppercase tracking-widest text-emerald-200">AI Prediction</p>
        <p className="mt-1 text-sm text-emerald-100">Expected completion by <span className="font-semibold text-emerald-50">{prediction.expectedCompletion}</span></p>
        <p className="mt-1 text-xs text-emerald-200">Confidence {Math.round(prediction.confidence * 100)}%</p>
        <p className="mt-2 text-xs text-emerald-100/80">{prediction.narrative}</p>
      </div>
    </div>
  );
}
