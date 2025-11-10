"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { mockCostTrends } from "../mockData";

export function CostTrendsChart() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Cost Trends</CardTitle>
        <CardDescription>
          Daily cost breakdown by component
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={mockCostTrends}>
            <defs>
              <linearGradient id="colorFixed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorWage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRolling" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-3)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-chart-3)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAccessorials" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-4)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-chart-4)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }} />
            <Area type="monotone" dataKey="fixed" stackId="1" stroke="var(--color-chart-1)" fillOpacity={1} fill="url(#colorFixed)" name="Fixed" />
            <Area type="monotone" dataKey="wage" stackId="1" stroke="var(--color-chart-2)" fillOpacity={1} fill="url(#colorWage)" name="Wage" />
            <Area type="monotone" dataKey="rolling" stackId="1" stroke="var(--color-chart-3)" fillOpacity={1} fill="url(#colorRolling)" name="Rolling" />
            <Area type="monotone" dataKey="accessorials" stackId="1" stroke="var(--color-chart-4)" fillOpacity={1} fill="url(#colorAccessorials)" name="Accessorials" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
