"use client";

import { useState } from "react";
import LeftNavigationRail from "./components/layout/LeftNavigationRail";
import TopBar from "./components/layout/TopBar";
import SmartCommandStrip from "./components/dashboard/SmartCommandStrip";
import EnterpriseKPITiles from "./components/dashboard/EnterpriseKPITiles";
import ExceptionsTable from "./components/dashboard/ExceptionsTable";
import ActionCenter from "./components/dashboard/ActionCenter";
import SlideOver, { InsightDetail } from "./components/layout/SlideOver";

export default function Home() {
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Navigation Rail */}
      <LeftNavigationRail />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 flex">
          {/* Main content */}
          <div className="flex-1 px-6 py-6 overflow-auto">
            <SmartCommandStrip />

            <div className="mb-8">
              <EnterpriseKPITiles />
            </div>

            <div className="mb-8">
              <ExceptionsTable />
            </div>

            <div className="text-xs text-muted-foreground">
              Telemetry updated 1m ago • Data refreshes every 30s
            </div>
          </div>

          {/* Right Rail */}
          <aside className="w-96 overflow-auto border-l border-border bg-card">
            <div className="sticky top-[72px] h-[calc(100vh-72px)]">
              <ActionCenter onOpenDetails={(id) => { setSelectedInsightId(id); setSlideOverOpen(true); }} />
            </div>
          </aside>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card py-4 px-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} FleetOps Enterprise. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-foreground/80 hover:opacity-80">Help</a>
              <a href="#" className="text-foreground/80 hover:opacity-80">Privacy</a>
              <a href="#" className="text-foreground/80 hover:opacity-80">Terms</a>
            </div>
          </div>
        </footer>
      </div>

      <SlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title="Insight Details"
      >
        {selectedInsightId && <InsightDetail insightId={selectedInsightId} />}
      </SlideOver>
    </div>
  );
}
