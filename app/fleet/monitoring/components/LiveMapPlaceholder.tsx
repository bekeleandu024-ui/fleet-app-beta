"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function LiveMapPlaceholder() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Live Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground">
          Map visualization placeholder
        </div>
      </CardContent>
    </Card>
  );
}
