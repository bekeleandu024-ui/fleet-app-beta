"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { LeftAiInsights } from "@/components/left-ai-insights";
import { NavigationRail } from "@/components/navigation-rail";
import { RightContextInsights } from "@/components/right-context-insights";
import { TopNav } from "@/components/top-nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMapPage = pathname?.startsWith("/map");
  const isDispatchPage = pathname?.startsWith("/dispatch");
  const isOrdersListPage = pathname === "/orders";
  const isTripsPage = pathname?.startsWith("/trips");
  const isFarmOutPage = pathname?.startsWith("/farm-out");
  const isFullWidthPage = isMapPage || isDispatchPage || isOrdersListPage || isTripsPage || isFarmOutPage;

  return (
    <div className={cn(
      "bg-black",
      isFullWidthPage ? "flex flex-col h-screen overflow-hidden" : "min-h-screen"
    )}>
      <TopNav />
      <main className={cn(
        "w-full",
        !isFullWidthPage && "mx-auto max-w-[1600px] px-6 py-6",
        isFullWidthPage && "flex-1 relative overflow-hidden"
      )}>
        {children}
      </main>
    </div>
  );
}

