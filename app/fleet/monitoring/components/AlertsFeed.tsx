"use client";
import { alerts } from "../mockData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const sevColors: Record<string, string> = {
  critical: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

export function AlertsFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts & Incidents</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {alerts.map(a => (
            <li key={a.id} className="flex items-start justify-between">
              <div>
                <div className={`text-sm font-medium ${sevColors[a.severity]}`}>{a.severity.toUpperCase()}</div>
                <div className="text-sm mt-0.5">{a.message}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
