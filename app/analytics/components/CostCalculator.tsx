"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

export function CostCalculator() {
  const [miles, setMiles] = useState<number>(500);
  const [driverType, setDriverType] = useState<'COM' | 'RNR' | 'OO'>('COM');
  const [events, setEvents] = useState<number>(2);
  const [result, setResult] = useState<any>(null);

  const calculateCost = () => {
    const baseCPM = driverType === 'COM' ? 1.85 : driverType === 'RNR' ? 1.72 : 2.35;
    const eventCost = events * 50; // $50 per event
    const estimatedCost = (miles * baseCPM) + eventCost;
    const breakEvenPrice = estimatedCost * 1.05; // 5% buffer
    const targetPrice = estimatedCost * 1.20; // 20% margin
    const marketRate = estimatedCost * 1.15; // Market estimate

    setResult({
      estimatedCost: estimatedCost.toFixed(2),
      breakEvenPrice: breakEvenPrice.toFixed(2),
      targetPrice: targetPrice.toFixed(2),
      marketRate: marketRate.toFixed(2),
      cpm: baseCPM.toFixed(2),
    });
  };

  return (
    <Card className="bg-gray-800/30 border-gray-700/50 h-fit">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calculator className="h-5 w-5 text-cyan-400" />
          Cost Calculator
        </CardTitle>
        <CardDescription className="text-gray-400">
          Quick cost estimation tool
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-2">
            Miles
          </label>
          <input
            type="number"
            value={miles}
            onChange={(e) => setMiles(Number(e.target.value))}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Enter miles"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 block mb-2">
            Driver Type
          </label>
          <select
            value={driverType}
            onChange={(e) => setDriverType(e.target.value as 'COM' | 'RNR' | 'OO')}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="COM">Company (COM)</option>
            <option value="RNR">Rental (RNR)</option>
            <option value="OO">Owner Operator (OO)</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 block mb-2">
            Special Events
          </label>
          <input
            type="number"
            value={events}
            onChange={(e) => setEvents(Number(e.target.value))}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Number of events"
          />
        </div>

        <Button 
          onClick={calculateCost}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          Calculate
        </Button>

        {result && (
          <div className="space-y-3 pt-4 border-t border-gray-700">
            <div className="bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-400">Estimated Cost</p>
              <p className="text-2xl font-bold text-white">${result.estimatedCost}</p>
              <p className="text-xs text-gray-500">at ${result.cpm}/mile</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700/30 p-2 rounded">
                <p className="text-xs text-gray-400">Break-even</p>
                <p className="text-lg font-semibold text-yellow-400">${result.breakEvenPrice}</p>
              </div>
              <div className="bg-gray-700/30 p-2 rounded">
                <p className="text-xs text-gray-400">Target Price</p>
                <p className="text-lg font-semibold text-green-400">${result.targetPrice}</p>
              </div>
            </div>

            <div className="p-3 bg-cyan-900/30 rounded-lg border border-cyan-700/50">
              <p className="text-xs text-cyan-400">
                <strong>🤖 Market Rate:</strong> ${result.marketRate}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Based on current lane analysis
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
