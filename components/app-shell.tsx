"use client";

import { TopNav } from "@/components/top-nav";

interface AppShellProps {
  children: React.ReactNode;
  insights?: React.ReactNode;
  context?: React.ReactNode;
}

function PanelPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--surface-2)_70%,transparent)] p-4 text-sm text-[var(--muted)]">
      <span className="font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</span>
      <p>Supply this panel via the AppShell props.</p>
    </div>
  );
}

export function AppShell({ children, insights, context }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--app)] text-[var(--text)]">
      <TopNav />

      <div className="flex-1 py-6">
        <div className="mx-auto w-full max-w-[1600px] px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr_360px] lg:gap-8">
            <aside className="order-2 flex flex-col gap-4 lg:order-none">
              {insights ?? <PanelPlaceholder label="AI Insights" />}
            </aside>

            <main className="order-1 flex flex-col gap-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 shadow-flat lg:order-none lg:p-8">
              {children}
            </main>

            <aside className="order-3 flex flex-col gap-4 lg:order-none">
              {context ?? <PanelPlaceholder label="Context" />}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
