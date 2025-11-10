"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { mockCostTrends } from "../mockData";

export function CostBreakdownChart() {
  // Calculate totals from recent data
  const recentData = mockCostTrends.slice(-7); // Last 7 days
  const totals = recentData.reduce((acc, day) => ({
    fixed: acc.fixed + day.fixed,
    wage: acc.wage + day.wage,
    rolling: acc.rolling + day.rolling,
    accessorials: acc.accessorials + day.accessorials,
  }), { fixed: 0, wage: 0, rolling: 0, accessorials: 0 });

  const pieData = [
    { name: 'Fixed Costs', value: totals.fixed, color: 'var(--color-chart-1)' },
    { name: 'Wage Costs', value: totals.wage, color: 'var(--color-chart-2)' },
    { name: 'Rolling Costs', value: totals.rolling, color: 'var(--color-chart-3)' },
    { name: 'Accessorials', value: totals.accessorials, color: 'var(--color-chart-4)' },
  ];

  const total = totals.fixed + totals.wage + totals.rolling + totals.accessorials;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Cost Component Breakdown</CardTitle>
        <CardDescription>
          Last 7 days - Total: ${total.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(1)}%`}
              outerRadius={100}
              fill="var(--color-chart-1)"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {pieData.map((item) => (
            <div key={item.name} className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
              <p className="text-lg font-bold text-foreground">${item.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground/80">
                {((item.value / total) * 100).toFixed(1)}% of total
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-fleet-warning/10 rounded-lg border border-fleet-warning/20">
          <p className="text-sm text-fleet-warning">
            <strong>🤖 Cost Driver Alert:</strong> Wage costs increased 8% this week. 
            Review overtime and rental driver usage.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
