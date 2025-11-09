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
    { name: 'Fixed Costs', value: totals.fixed, color: '#8b5cf6' },
    { name: 'Wage Costs', value: totals.wage, color: '#06b6d4' },
    { name: 'Rolling Costs', value: totals.rolling, color: '#10b981' },
    { name: 'Accessorials', value: totals.accessorials, color: '#f59e0b' },
  ];

  const total = totals.fixed + totals.wage + totals.rolling + totals.accessorials;

  return (
    <Card className="bg-gray-800/30 border-gray-700/50">
      <CardHeader>
        <CardTitle className="text-white">Cost Component Breakdown</CardTitle>
        <CardDescription className="text-gray-400">
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
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#f3f4f6' }}
              itemStyle={{ color: '#d1d5db' }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {pieData.map((item) => (
            <div key={item.name} className="bg-gray-700/30 p-3 rounded-lg border border-gray-600/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-400">{item.name}</span>
              </div>
              <p className="text-lg font-bold text-white">${item.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">
                {((item.value / total) * 100).toFixed(1)}% of total
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-yellow-900/30 rounded-lg border border-yellow-700/50">
          <p className="text-sm text-yellow-400">
            <strong>🤖 Cost Driver Alert:</strong> Wage costs increased 8% this week. 
            Review overtime and rental driver usage.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
