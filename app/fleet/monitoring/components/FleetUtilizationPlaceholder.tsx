"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function FleetUtilizationPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground">
          Utilization chart placeholder
        </div>
      </CardContent>
    </Card>
  );
}
