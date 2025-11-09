"use client";

import { useState } from "react";
import LeftNavigationRail from "./components/layout/LeftNavigationRail";
import TopBar from "./components/layout/TopBar";
import PageHeader from "./components/layout/PageHeader";
import GlobalFilters from "./components/layout/GlobalFilters";
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
    <div className="min-h-screen bg-gray-50 flex">
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

            {/* KPI Tiles */}
            <div className="mb-6">
              <EnterpriseKPITiles />
            </div>

            {/* Exceptions Table */}
            <div className="mb-6">
              <ExceptionsTable />
            </div>

            {/* Trend Charts Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Revenue vs Target (MTD)
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <p className="text-sm">Chart component placeholder</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  On-time Delivery Trend
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <p className="text-sm">Chart component placeholder</p>
                </div>
              </div>
            </div>

            {/* Data Freshness Indicator */}
            <div className="text-xs text-gray-500 mt-6">
              Telemetry updated 1m ago • Data refreshes every 30s
            </div>
          </div>

          {/* Right Rail - Action Center (3-4 cols) */}
          <aside className="w-96 border-l border-gray-200 bg-gray-50 overflow-auto">
            <div className="sticky top-0 h-screen">
              <ActionCenter onOpenDetails={handleOpenDetails} />
            </div>
          </aside>
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <p>© {new Date().getFullYear()} FleetOps Enterprise. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-gray-900">Help</a>
              <a href="#" className="hover:text-gray-900">Privacy</a>
              <a href="#" className="hover:text-gray-900">Terms</a>
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
