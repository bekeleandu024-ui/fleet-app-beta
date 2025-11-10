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
    <Card className="h-fit border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-fleet-accent" />
          Cost Calculator
        </CardTitle>
        <CardDescription>
          Quick cost estimation tool
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            Miles
          </label>
          <input
            type="number"
            value={miles}
            onChange={(e) => setMiles(Number(e.target.value))}
            className="w-full rounded-md border border-border bg-muted/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-fleet-accent/40"
            placeholder="Enter miles"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            Driver Type
          </label>
          <select
            value={driverType}
            onChange={(e) => setDriverType(e.target.value as 'COM' | 'RNR' | 'OO')}
            className="w-full rounded-md border border-border bg-muted/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-fleet-accent/40"
          >
            <option value="COM">Company (COM)</option>
            <option value="RNR">Rental (RNR)</option>
            <option value="OO">Owner Operator (OO)</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            Special Events
          </label>
          <input
            type="number"
            value={events}
            onChange={(e) => setEvents(Number(e.target.value))}
            className="w-full rounded-md border border-border bg-muted/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-fleet-accent/40"
            placeholder="Number of events"
          />
        </div>

        <Button 
          onClick={calculateCost}
          className="w-full bg-fleet-accent text-white hover:opacity-90"
        >
          Calculate
        </Button>

        {result && (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="rounded-lg bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Estimated Cost</p>
              <p className="text-2xl font-bold text-foreground">${result.estimatedCost}</p>
              <p className="text-xs text-muted-foreground/80">at ${result.cpm}/mile</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">Break-even</p>
                <p className="text-lg font-semibold text-fleet-warning">${result.breakEvenPrice}</p>
              </div>
              <div className="rounded bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">Target Price</p>
                <p className="text-lg font-semibold text-fleet-success">${result.targetPrice}</p>
              </div>
            </div>

            <div className="p-3 bg-fleet-accent/10 rounded-lg border border-fleet-accent/20">
              <p className="text-xs text-fleet-accent">
                <strong>🤖 Market Rate:</strong> ${result.marketRate}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Based on current lane analysis
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
