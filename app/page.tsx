"use client";

import HeroStatsBar from "./components/dashboard/HeroStatsBar";
import LiveMapView from "./components/dashboard/LiveMapView";
import QuickActionsPanel from "./components/dashboard/QuickActionsPanel";
import AIInsightsPanel from "./components/dashboard/AIInsightsPanel";
import ActiveTripsList from "./components/dashboard/ActiveTripsList";
import RecentActivitiesFeed from "./components/dashboard/RecentActivitiesFeed";
import { Search, Bell, User } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
              <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                <a href="/" className="text-blue-600 border-b-2 border-blue-600 pb-1">Dashboard</a>
                <a href="/orders" className="hover:text-gray-900">Orders</a>
                <a href="/dispatch" className="hover:text-gray-900">Dispatch</a>
                <a href="/drivers" className="hover:text-gray-900">Drivers</a>
                <a href="/tracking" className="hover:text-gray-900">Tracking</a>
                <a href="/analytics" className="hover:text-gray-900">Analytics</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Search className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <User className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-[1920px] px-6 py-6">
        {/* Hero Stats Bar */}
        <div className="mb-6">
          <HeroStatsBar />
        </div>

        {/* Main Dashboard Grid - 60/40 Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 60% (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Map View */}
            <LiveMapView />

            {/* Quick Actions Panel */}
            <QuickActionsPanel />
          </div>

          {/* Right Column - 40% (1 column) */}
          <div className="space-y-6">
            {/* AI Insights Panel */}
            <AIInsightsPanel />

            {/* Active Trips List */}
            <ActiveTripsList />

            {/* Recent Activities Feed */}
            <RecentActivitiesFeed />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 px-6 bg-white border-t border-gray-200">
        <div className="mx-auto max-w-[1920px] flex items-center justify-between text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Fleet Management System. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-gray-900">Help</a>
            <a href="#" className="hover:text-gray-900">Privacy</a>
            <a href="#" className="hover:text-gray-900">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
