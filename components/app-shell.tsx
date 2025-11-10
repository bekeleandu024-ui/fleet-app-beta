"use client";

import { TopNav } from "@/components/top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6">
        {children}
      </main>
    </div>
  );
}
