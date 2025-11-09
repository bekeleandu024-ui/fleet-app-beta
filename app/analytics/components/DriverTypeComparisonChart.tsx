"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { mockDriverTypeCosts } from "../mockData";

export function DriverTypeComparisonChart() {
  return (
    <Card className="bg-gray-800/30 border-gray-700/50">
      <CardHeader>
        <CardTitle className="text-white">Driver Type Comparison</CardTitle>
        <CardDescription className="text-gray-400">
          Average CPM, margin, and utilization by driver type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={mockDriverTypeCosts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="type" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis 
              yAxisId="left"
              stroke="#9ca3af" 
              tick={{ fill: '#9ca3af' }}
              label={{ value: 'CPM ($)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af" 
              tick={{ fill: '#9ca3af' }}
              label={{ value: 'Margin (%) / Utilization (%)', angle: 90, position: 'insideRight', fill: '#9ca3af' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#f3f4f6' }}
              itemStyle={{ color: '#d1d5db' }}
            />
            <Legend wrapperStyle={{ color: '#d1d5db' }} />
            <Bar yAxisId="left" dataKey="avgCPM" fill="#06b6d4" name="Avg CPM ($)" />
            <Bar yAxisId="right" dataKey="avgMargin" fill="#10b981" name="Avg Margin (%)" />
            <Bar yAxisId="right" dataKey="utilization" fill="#8b5cf6" name="Utilization (%)" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          {mockDriverTypeCosts.map((driver) => (
            <div key={driver.type} className="bg-gray-700/30 p-3 rounded-lg border border-gray-600/50">
              <p className="font-semibold text-white">{driver.type}</p>
              <p className="text-gray-400 text-xs mt-1">Trips: {driver.tripCount}</p>
              <p className="text-gray-400 text-xs">CPM: ${driver.avgCPM}</p>
              <p className="text-gray-400 text-xs">Margin: {driver.avgMargin}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
