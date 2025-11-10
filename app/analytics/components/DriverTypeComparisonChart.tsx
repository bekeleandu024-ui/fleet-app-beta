"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { mockDriverTypeCosts } from "../mockData";

export function DriverTypeComparisonChart() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Driver Type Comparison</CardTitle>
        <CardDescription>
          Average CPM, margin, and utilization by driver type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={mockDriverTypeCosts}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="type" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'CPM ($)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'Margin (%) / Utilization (%)', angle: 90, position: 'insideRight', fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }} />
            <Bar yAxisId="left" dataKey="avgCPM" fill="var(--color-chart-2)" name="Avg CPM ($)" />
            <Bar yAxisId="right" dataKey="avgMargin" fill="var(--color-chart-3)" name="Avg Margin (%)" />
            <Bar yAxisId="right" dataKey="utilization" fill="var(--color-chart-1)" name="Utilization (%)" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          {mockDriverTypeCosts.map((driver) => (
            <div key={driver.type} className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="font-semibold text-foreground">{driver.type}</p>
              <p className="mt-1 text-xs text-muted-foreground">Trips: {driver.tripCount}</p>
              <p className="text-xs text-muted-foreground">CPM: ${driver.avgCPM}</p>
              <p className="text-xs text-muted-foreground">Margin: {driver.avgMargin}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
