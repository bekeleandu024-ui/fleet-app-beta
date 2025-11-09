import { UnitsView } from "./components/UnitsView";

export default function FleetManagementPage() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fleet Manager Pro</h2>
          <p className="text-muted-foreground">
            AI-powered insights for your entire fleet.
          </p>
        </div>
      </div>
      <UnitsView />
    </div>
  );
}
