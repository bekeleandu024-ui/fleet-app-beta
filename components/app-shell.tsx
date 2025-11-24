"use client";

import * as React from "react";

import { LeftAiInsights } from "@/components/left-ai-insights";
import { NavigationRail } from "@/components/navigation-rail";
import { RightContextInsights } from "@/components/right-context-insights";
import { TopNav } from "@/components/top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <TopNav />
      <main className="mx-auto w-full max-w-[1600px] px-6 py-6">
        {children}
      </main>
    </div>
  );
}

