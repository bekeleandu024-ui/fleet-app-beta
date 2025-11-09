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

  const handleOpenDetails = (insightId: string) => {
    setSelectedInsightId(insightId);
    setSlideOverOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Navigation Rail */}
      <LeftNavigationRail />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Banner */}
        <TopBar />

        {/* Page Content */}
        <main className="flex-1 flex">
          {/* Main content area (8-9 cols) */}
          <div className="flex-1 px-6 py-6 overflow-auto">
            {/* Smart Command Strip pinned just below the banner */}
            <SmartCommandStrip />

            {/* KPI Tiles */}
            <div className="mb-8">
              <EnterpriseKPITiles />
            </div>

            {/* Exceptions Table */}
            <div className="mb-8">
              <ExceptionsTable />
            </div>

            {/* Data Freshness Indicator */}
            <div className="text-xs text-slate-500">
              Telemetry updated 1m ago • Data refreshes every 30s
            </div>
          </div>

          {/* Right Rail - Action Center (3-4 cols) */}
          <aside className="w-96 overflow-auto border-l border-slate-800 bg-slate-950">
            <div className="sticky" style={{ top: '72px', height: 'calc(100vh - 72px)' }}>
              <ActionCenter onOpenDetails={handleOpenDetails} />
            </div>
          </aside>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-900 py-4 px-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <p>© {new Date().getFullYear()} FleetOps Enterprise. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-300 hover:opacity-80">
                Help
              </a>
              <a href="#" className="text-slate-300 hover:opacity-80">
                Privacy
              </a>
              <a href="#" className="text-slate-300 hover:opacity-80">
                Terms
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Slide-over Panel */}
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
