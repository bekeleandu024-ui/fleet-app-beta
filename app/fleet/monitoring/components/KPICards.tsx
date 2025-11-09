"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { kpiSnapshot } from "../mockData";

export function KPICards() {
  const items = [
    { label: 'On-Time %', value: kpiSnapshot.onTimePct.toFixed(1) + '%' },
    { label: 'Utilization %', value: kpiSnapshot.utilizationPct.toFixed(1) + '%' },
    { label: 'Avg Delay (min)', value: kpiSnapshot.avgDelayMin.toString() },
    { label: 'Active Drivers', value: kpiSnapshot.activeDrivers.toString() },
  ];
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      {items.map(i => (
        <Card key={i.label} className="py-4">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{i.label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl font-semibold tracking-tight">{i.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
