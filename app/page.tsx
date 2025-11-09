"use client";

import { useState } from "react";
import LeftNavigationRail from "./components/layout/LeftNavigationRail";
import TopBar from "./components/layout/TopBar";
import PageHeader from "./components/layout/PageHeader";
import GlobalFilters from "./components/layout/GlobalFilters";
import SmartCommandStrip from "./components/dashboard/SmartCommandStrip";
import EnterpriseKPITiles from "./components/dashboard/EnterpriseKPITiles";
import ExceptionsTable from "./components/dashboard/ExceptionsTable";
import ActionCenter from "./components/dashboard/ActionCenter";
import SlideOver, { InsightDetail } from "./components/layout/SlideOver";
import { darkERPTheme } from "./lib/theme-config";

export default function Home() {
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);

  const handleOpenDetails = (insightId: string) => {
    setSelectedInsightId(insightId);
    setSlideOverOpen(true);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: darkERPTheme.bg }}>
      {/* Left Navigation Rail */}
      <LeftNavigationRail />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <TopBar />

        {/* Page Content */}
        <main className="flex-1 flex">
          {/* Main content area (8-9 cols) */}
          <div className="flex-1 px-6 py-6 overflow-auto">
            {/* Page Header with Breadcrumb */}
            <PageHeader
              breadcrumbs={[
                { label: "Operations", href: "/operations" },
                { label: "Dashboard" },
              ]}
              title="Dashboard"
              description="Real-time operational overview and key performance indicators"
              lastUpdated="2m ago"
            />

            {/* Global Filters */}
            <GlobalFilters />

            {/* Smart Command Strip */}
            <SmartCommandStrip />

            {/* KPI Tiles */}
            <div className="mb-6">
              <EnterpriseKPITiles />
            </div>

            {/* Exceptions Table */}
            <div className="mb-6">
              <ExceptionsTable />
            </div>

            {/* Data Freshness Indicator */}
            <div className="text-xs mt-6" style={{ color: darkERPTheme.textMuted }}>
              Telemetry updated 1m ago • Data refreshes every 30s
            </div>
          </div>

          {/* Right Rail - Action Center (3-4 cols) */}
          <aside
            className="w-96 overflow-auto"
            style={{
              borderLeft: `1px solid ${darkERPTheme.border}`,
              backgroundColor: darkERPTheme.bg,
            }}
          >
            <div className="sticky top-0 h-screen">
              <ActionCenter onOpenDetails={handleOpenDetails} />
            </div>
          </aside>
        </main>

        {/* Footer */}
        <footer
          className="py-4 px-6"
          style={{
            backgroundColor: darkERPTheme.surface,
            borderTop: `1px solid ${darkERPTheme.border}`,
          }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: darkERPTheme.textMuted }}>
            <p>© {new Date().getFullYear()} FleetOps Enterprise. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:opacity-80" style={{ color: darkERPTheme.brandAccent }}>
                Help
              </a>
              <a href="#" className="hover:opacity-80" style={{ color: darkERPTheme.brandAccent }}>
                Privacy
              </a>
              <a href="#" className="hover:opacity-80" style={{ color: darkERPTheme.brandAccent }}>
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
