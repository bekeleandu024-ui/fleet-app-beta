"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, ZAxis } from "recharts";
import { mockTripMargins } from "../mockData";

export function MarginAnalysisChart() {
  const profitabilityThreshold = 15; // 15% margin threshold

  return (
    <Card className="bg-gray-800/30 border-gray-700/50">
      <CardHeader>
        <CardTitle className="text-white">Margin Analysis</CardTitle>
        <CardDescription className="text-gray-400">
          Cost vs Revenue per trip with profitability threshold
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              type="number" 
              dataKey="cost" 
              name="Cost" 
              unit="$"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
              label={{ value: 'Cost ($)', position: 'insideBottom', offset: -10, fill: '#9ca3af' }}
            />
            <YAxis 
              type="number" 
              dataKey="revenue" 
              name="Revenue" 
              unit="$"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
              label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <ZAxis type="number" dataKey="marginPercentage" range={[50, 400]} name="Margin %" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#f3f4f6' }}
              itemStyle={{ color: '#d1d5db' }}
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                      <p className="text-white font-semibold">{data.id}</p>
                      <p className="text-gray-300 text-sm">{data.driverName} ({data.driverType})</p>
                      <p className="text-gray-400 text-xs mt-1">Cost: ${data.cost}</p>
                      <p className="text-gray-400 text-xs">Revenue: ${data.revenue}</p>
                      <p className={`text-xs font-semibold mt-1 ${data.marginPercentage >= profitabilityThreshold ? 'text-green-400' : 'text-red-400'}`}>
                        Margin: {data.marginPercentage}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ color: '#d1d5db' }} />
            <Scatter 
              name="Profitable Trips" 
              data={mockTripMargins.filter(t => t.marginPercentage >= profitabilityThreshold)} 
              fill="#10b981"
              fillOpacity={0.6}
            />
            <Scatter 
              name="Low Margin Trips" 
              data={mockTripMargins.filter(t => t.marginPercentage < profitabilityThreshold)} 
              fill="#ef4444"
              fillOpacity={0.6}
            />
            <ReferenceLine 
              stroke="#f59e0b" 
              strokeDasharray="5 5" 
              strokeWidth={2}
              segment={[{ x: 600, y: 600 * 1.176 }, { x: 1500, y: 1500 * 1.176 }]}
              label={{ value: '15% Margin Threshold', fill: '#f59e0b', position: 'insideTopRight' }}
            />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-4 p-3 bg-cyan-900/30 rounded-lg border border-cyan-700/50">
          <p className="text-sm text-cyan-400">
            <strong>🤖 AI Insight:</strong> 75% of trips exceed the 15% profitability threshold. 
            Consider reviewing low-margin trips to optimize pricing or driver assignments.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
