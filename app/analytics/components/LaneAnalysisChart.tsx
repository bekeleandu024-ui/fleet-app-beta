"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockLaneData } from "../mockData";
import { ArrowRight } from "lucide-react";

export function LaneAnalysisChart() {
  const maxVolume = Math.max(...mockLaneData.map(l => l.tripCount));
  const maxMargin = Math.max(...mockLaneData.map(l => l.avgMargin));

  return (
    <Card className="bg-gray-800/30 border-gray-700/50">
      <CardHeader>
        <CardTitle className="text-white">Lane Analysis</CardTitle>
        <CardDescription className="text-gray-400">
          Cost, margin, and volume by origin-destination pairs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockLaneData.map((lane, index) => {
            const volumePercent = (lane.tripCount / maxVolume) * 100;
            const marginColor = lane.avgMargin >= 18 ? 'bg-green-500' : lane.avgMargin >= 15 ? 'bg-yellow-500' : 'bg-red-500';
            
            return (
              <div key={index} className="bg-gray-700/30 p-4 rounded-lg border border-gray-600/50 hover:border-cyan-500/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-white font-medium text-sm">{lane.origin}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span className="text-white font-medium text-sm">{lane.destination}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{lane.tripCount} trips</span>
                    <div className={`${marginColor} text-white text-xs font-bold px-2 py-1 rounded`}>
                      {lane.avgMargin.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-xs text-gray-400 mb-2">
                  <div>
                    <span className="block text-gray-500">Avg Cost</span>
                    <span className="text-white font-medium">${lane.avgCost}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Avg Revenue</span>
                    <span className="text-white font-medium">${lane.avgRevenue}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Margin</span>
                    <span className="text-white font-medium">${(lane.avgRevenue - lane.avgCost).toFixed(0)}</span>
                  </div>
                </div>
                
                {/* Volume bar */}
                <div className="w-full bg-gray-600/30 rounded-full h-2">
                  <div 
                    className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
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
