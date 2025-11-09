"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { mockMarketRates } from "../mockData";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function MarketRateDashboard() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Market Rate Intelligence</CardTitle>
        <CardDescription>
          Live pricing data and historical trends by lane
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockMarketRates.map((lane, index) => {
          const trendIcon = lane.trend === 'up' ? TrendingUp : lane.trend === 'down' ? TrendingDown : Minus;
          const trendColor = lane.trend === 'up' ? 'text-green-400' : lane.trend === 'down' ? 'text-red-400' : 'text-muted-foreground';
          const TrendIcon = trendIcon;

          return (
            <div key={index} className="bg-muted/40 p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{lane.lane}</h4>
                  <p className="text-xs text-muted-foreground mt-1">Current Rate</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">${lane.currentRate}</p>
                  <div className={`flex items-center gap-1 justify-end ${trendColor}`}>
                    <TrendIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">{lane.trend}</span>
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={lane.historicalRates}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    hide
                  />
                  <YAxis hide domain={['dataMin - 0.1', 'dataMax + 0.1']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}/mi`, 'Rate']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-3 p-2 bg-cyan-900/30 rounded border border-cyan-700/50">
                <p className="text-xs text-cyan-400">
                  <strong>🤖 30-Day Forecast:</strong> ${lane.predictedRate.toFixed(2)}/mi
                  <span className="ml-2 text-muted-foreground">
                    ({lane.predictedRate > lane.currentRate ? '+' : ''}{((lane.predictedRate - lane.currentRate) / lane.currentRate * 100).toFixed(1)}%)
                  </span>
                </p>
              </div>
            </div>
          );
        })}

        <div className="p-3 bg-purple-900/30 rounded-lg border border-purple-700/50">
          <p className="text-sm text-purple-400">
            <strong>🤖 Seasonal Pattern:</strong> Rates typically increase 15-20% during Q4 holiday season. 
            Consider booking commitments now.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
