"use client";
import { driverStatuses } from "../mockData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const dutyColors: Record<string,string> = {
  'driving': 'bg-emerald-500',
  'on-duty': 'bg-blue-500',
  'rest-break': 'bg-yellow-500',
  'off-duty': 'bg-gray-500',
};

export function DriversStatusList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Drivers</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {driverStatuses.map(d => (
            <li key={d.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${dutyColors[d.duty]}`} />
                <span className="font-medium text-sm">{d.name}</span>
                <span className="text-xs text-muted-foreground">{d.duty.replace('-', ' ')}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {d.currentTrip ? d.currentTrip : '—'} · Violations: {d.violationsToday}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
