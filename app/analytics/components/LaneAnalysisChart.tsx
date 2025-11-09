"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockLaneData } from "../mockData";
import { ArrowRight } from "lucide-react";

export function LaneAnalysisChart() {
  const maxVolume = Math.max(...mockLaneData.map(l => l.tripCount));
  const maxMargin = Math.max(...mockLaneData.map(l => l.avgMargin));

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Lane Analysis</CardTitle>
        <CardDescription>
          Cost, margin, and volume by origin-destination pairs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockLaneData.map((lane, index) => {
            const volumePercent = (lane.tripCount / maxVolume) * 100;
            const marginColor = lane.avgMargin >= 18 ? 'bg-green-500' : lane.avgMargin >= 15 ? 'bg-yellow-500' : 'bg-red-500';
            
            return (
              <div key={index} className="bg-muted/40 p-4 rounded-lg border border-border hover:border-cyan-500/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-medium text-foreground">{lane.origin}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{lane.destination}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{lane.tripCount} trips</span>
                    <div className={`${marginColor} rounded px-2 py-1 text-xs font-bold text-white`}>
                      {lane.avgMargin.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="mb-2 grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                  <div>
                    <span className="block text-muted-foreground/80">Avg Cost</span>
                    <span className="font-medium text-foreground">${lane.avgCost}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground/80">Avg Revenue</span>
                    <span className="font-medium text-foreground">${lane.avgRevenue}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground/80">Margin</span>
                    <span className="font-medium text-foreground">${(lane.avgRevenue - lane.avgCost).toFixed(0)}</span>
                  </div>
                </div>
                
                {/* Volume bar */}
                <div className="h-2 w-full rounded-full bg-muted/50">
                  <div 
                    className="h-2 rounded-full bg-cyan-500 transition-all duration-500"
                    style={{ width: `${volumePercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-cyan-900/30 rounded-lg border border-cyan-700/50">
          <p className="text-sm text-cyan-400">
            <strong>🤖 AI Recommendation:</strong> Focus on Toronto → Chicago lane (24 trips, 17.4% margin). 
            Consider increasing rates on Toronto → Detroit (+8% potential).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
