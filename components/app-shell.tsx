"use client";

import { LeftAiInsights } from "@/components/left-ai-insights";
import { RightContextInsights } from "@/components/right-context-insights";
import { TopNav } from "@/components/top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--app)] text-[var(--text)]">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,280px)] xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,320px)]">
          <div className="order-2 flex flex-col gap-6 lg:order-1">
            <LeftAiInsights />
          </div>
          <div className="order-1 flex min-w-0 flex-col gap-6 lg:order-2">{children}</div>
          <div className="order-3 flex flex-col gap-6">
            <RightContextInsights />
          </div>
        </div>
      </main>
    </div>
  );
}
