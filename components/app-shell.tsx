"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { LeftAiInsights } from "@/components/left-ai-insights";
import { NavigationRail } from "@/components/navigation-rail";
import { RightContextInsights } from "@/components/right-context-insights";
import { TopNav } from "@/components/top-nav";
import { FleetAIPanel } from "@/components/fleet-ai-panel";
import { AICommandBar, useCommandBar } from "@/components/ai-command-bar";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAIPanelOpen, setIsAIPanelOpen] = React.useState(false);
  const commandBar = useCommandBar();
  
  const isMapPage = pathname?.startsWith("/map");
  const isDispatchPage = pathname?.startsWith("/dispatch");
  const isOrdersListPage = pathname === "/orders" || pathname?.startsWith("/orders/master");
  const isTripsPage = pathname?.startsWith("/trips");
  const isFarmOutPage = pathname?.startsWith("/farm-out");
  const isFullWidthPage = isMapPage || isDispatchPage || isOrdersListPage || isTripsPage || isFarmOutPage;

  // Determine current page context for AI
  const aiContext = React.useMemo(() => {
    if (pathname?.startsWith("/orders")) return { currentPage: "Orders" };
    if (pathname?.startsWith("/trips")) return { currentPage: "Trips" };
    if (pathname?.startsWith("/dispatch")) return { currentPage: "Dispatch" };
    if (pathname?.startsWith("/farm-out")) return { currentPage: "Farm Out" };
    if (pathname?.startsWith("/map")) return { currentPage: "Map" };
    if (pathname?.startsWith("/costing")) return { currentPage: "Costing" };
    if (pathname?.startsWith("/analytics")) return { currentPage: "Analytics" };
    if (pathname === "/") return { currentPage: "Dashboard" };
    return { currentPage: "Fleet Operations" };
  }, [pathname]);

  return (
    <div className={cn(
      "bg-black",
      isFullWidthPage ? "flex flex-col h-screen overflow-hidden" : "min-h-screen"
    )}>
      <TopNav onCommandBarOpen={commandBar.open} />
      <main className={cn(
        "w-full",
        !isFullWidthPage && "mx-auto max-w-[1600px] px-6 py-6",
        isFullWidthPage && "flex-1 relative overflow-hidden"
      )}>
        {children}
      </main>
      
      {/* Global AI Assistant Panel - Temporarily removed per request
      <FleetAIPanel 
        isOpen={isAIPanelOpen} 
        onToggle={() => setIsAIPanelOpen(!isAIPanelOpen)}
        context={aiContext}
      />
      */}
      
      {/* Global AI Command Bar */}
      <AICommandBar 
        isOpen={commandBar.isOpen} 
        onClose={commandBar.close} 
      />
    </div>
  );
}

