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

  return (
    <div className={cn(
      "bg-black",
      isMapPage ? "flex flex-col h-screen overflow-hidden" : "min-h-screen"
    )}>
      <TopNav />
      <main className={cn(
        "w-full",
        !isMapPage && "mx-auto max-w-[1600px] px-6 py-6",
        isMapPage && "flex-1 relative overflow-hidden"
      )}>
        {children}
      </main>
    </div>
  );
}

