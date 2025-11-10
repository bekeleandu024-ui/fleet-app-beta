"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, ZAxis } from "recharts";
import { mockTripMargins } from "../mockData";

export function MarginAnalysisChart() {
  const profitabilityThreshold = 15; // 15% margin threshold

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Margin Analysis</CardTitle>
        <CardDescription>
          Cost vs Revenue per trip with profitability threshold
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number" 
              dataKey="cost" 
              name="Cost" 
              unit="$"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'Cost ($)', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              type="number" 
              dataKey="revenue" 
              name="Revenue" 
              unit="$"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
            />
            <ZAxis type="number" dataKey="marginPercentage" range={[50, 400]} name="Margin %" />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border bg-card p-3">
                      <p className="font-semibold text-foreground">{data.id}</p>
                      <p className="text-sm text-muted-foreground">{data.driverName} ({data.driverType})</p>
                      <p className="mt-1 text-xs text-muted-foreground">Cost: ${data.cost}</p>
                      <p className="text-xs text-muted-foreground">Revenue: ${data.revenue}</p>
                      <p className={`text-xs font-semibold mt-1 ${data.marginPercentage >= profitabilityThreshold ? 'text-fleet-success' : 'text-fleet-danger'}`}>
                        Margin: {data.marginPercentage}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }} />
            <Scatter 
              name="Profitable Trips" 
              data={mockTripMargins.filter(t => t.marginPercentage >= profitabilityThreshold)} 
              fill="var(--color-chart-3)"
              fillOpacity={0.6}
            />
            <Scatter 
              name="Low Margin Trips" 
              data={mockTripMargins.filter(t => t.marginPercentage < profitabilityThreshold)} 
              fill="var(--fleet-danger)"
              fillOpacity={0.6}
            />
            <ReferenceLine 
              stroke="var(--fleet-warning)" 
              strokeDasharray="5 5" 
              strokeWidth={2}
              segment={[{ x: 600, y: 600 * 1.176 }, { x: 1500, y: 1500 * 1.176 }]}
              label={{ value: '15% Margin Threshold', fill: 'var(--fleet-warning)', position: 'insideTopRight' }}
            />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-4 p-3 bg-fleet-accent/10 rounded-lg border border-fleet-accent/20">
          <p className="text-sm text-fleet-accent">
            <strong>🤖 AI Insight:</strong> 75% of trips exceed the 15% profitability threshold. 
            Consider reviewing low-margin trips to optimize pricing or driver assignments.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
