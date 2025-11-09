import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DriversView } from "./components/DriversView";
import { UnitsView } from "./components/UnitsView";

export default function FleetManagementPage() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fleet Management</h2>
          <p className="text-muted-foreground">
            Manage your drivers, units, and fleet performance.
          </p>
        </div>
      </div>
      <Tabs defaultValue="drivers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
        </TabsList>
        <TabsContent value="drivers" className="space-y-4">
          <DriversView />
        </TabsContent>
        <TabsContent value="units" className="space-y-4">
          <UnitsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
