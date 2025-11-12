"use client";

import * as React from "react";

import { LeftAiInsights } from "@/components/left-ai-insights";
import { RightContextInsights } from "@/components/right-context-insights";
import { TopNav } from "@/components/top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <TopNav />
      <main className="mx-auto w-full max-w-[1600px] px-6 pb-12 pt-8 lg:px-10">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[320px_1fr_360px]">
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
