"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KPICards } from "./components/KPICards";
import { LiveMapPlaceholder } from "./components/LiveMapPlaceholder";
import { AlertsFeed } from "./components/AlertsFeed";
import { DriversStatusList } from "./components/DriversStatusList";
import { FleetUtilizationPlaceholder } from "./components/FleetUtilizationPlaceholder";
import { fleetAssets } from "./mockData";

export default function FleetDriverMonitoringPage() {
  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Fleet & Driver Monitoring</h1>
        <p className="text-sm text-muted-foreground">Real-time view of assets, drivers, utilization, and incidents across your network.</p>
      </header>

      {/* Filters (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filters</CardTitle>
          <CardDescription>Select region, status, and time window to focus your monitoring view.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="h-9 rounded-md border px-3 flex items-center text-sm text-muted-foreground">Region (placeholder)</div>
            <div className="h-9 rounded-md border px-3 flex items-center text-sm text-muted-foreground">Status (placeholder)</div>
            <div className="h-9 rounded-md border px-3 flex items-center text-sm text-muted-foreground">Time Range (placeholder)</div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fleet">Fleet</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <KPICards />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LiveMapPlaceholder />
            </div>
            <div className="space-y-6">
              <AlertsFeed />
              <DriversStatusList />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fleet" className="space-y-6">
          <FleetUtilizationPlaceholder />
          <Card>
            <CardHeader>
              <CardTitle>Fleet Status</CardTitle>
              <CardDescription>High-level asset view with state and ETA when available.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {fleetAssets.map(a => (
                  <div key={a.id} className="rounded-lg border p-4">
                    <div className="font-medium">{a.id}</div>
                    <div className="text-sm text-muted-foreground">{a.location}</div>
                    <div className="text-xs mt-2">Status: <span className="uppercase">{a.status}</span>{a.etaMinutes ? ` · ETA ${a.etaMinutes}m` : ''}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-6">
          <DriversStatusList />
          <Card>
            <CardHeader>
              <CardTitle>Leaderboards (placeholder)</CardTitle>
              <CardDescription>Top on-time drivers, safety streaks, and performance highlights.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 w-full rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground">
                Leaderboards placeholder
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <AlertsFeed />
          <Card>
            <CardHeader>
              <CardTitle>Incident Timeline (placeholder)</CardTitle>
              <CardDescription>Chronological view of notable events with filtering.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground">
                Incident timeline placeholder
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
