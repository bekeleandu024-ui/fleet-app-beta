"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Calculator,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LifeBuoy,
  Map,
  Menu,
  Package,
  Plus,
  Route,
  Search,
  Send,
  Truck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HealthDot } from "@/components/health-dot";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Orders", href: "/orders", icon: Package },
  { label: "Dispatch", href: "/dispatch", icon: Send },
  { label: "Trips", href: "/trips", icon: Route },
  { label: "Costing", href: "/costing", icon: Calculator },
  { label: "Units", href: "/master-data/units", icon: Truck },
  { label: "Drivers", href: "/master-data/drivers", icon: Users },
  { label: "Map", href: "/map", icon: Map },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
] as const;

const segmentLabel: Record<string, string> = {
  orders: "Orders",
  dispatch: "Dispatch Console",
  trips: "Trips",
  costing: "Costing Workbench",
  map: "Map Planner",
  analytics: "Analytics",
  "master-data": "Master Data",
  units: "Units",
  drivers: "Drivers",
  rules: "Rules",
  events: "Events",
};

function deriveTitle(pathname: string) {
  if (pathname === "/") {
    return "Dashboard";
  }

  if (pathname.startsWith("/orders/")) {
    return "Order Detail";
  }

  if (pathname.startsWith("/trips/")) {
    return "Trip Detail";
  }

  if (pathname.startsWith("/master-data")) {
    const [, , leaf] = pathname.split("/");
    if (leaf === "drivers") return "Drivers";
    if (leaf === "units") return "Units";
    if (leaf === "rules") return "Rules";
    if (leaf === "events") return "Events";
    return "Master Data";
  }

  const match = navItems.find((item) => item.href === pathname);
  return match?.label ?? "Workspace";
}

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [
      {
        href: "/",
        label: "Dashboard",
      },
    ];
  }

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const baseLabel = segmentLabel[segment] ?? decodeURIComponent(segment);
    return { href, label: baseLabel };
  });

  return [{ href: "/", label: "Dashboard" }, ...crumbs];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const title = useMemo(() => deriveTitle(pathname), [pathname]);
  const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const nav = (
    <div className="flex h-full flex-col border-r border-subtle bg-surface-1/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-4">
        <span
          className={cn(
            "text-sm font-semibold uppercase tracking-wide text-muted",
            collapsed && "sr-only"
          )}
        >
          FleetOps
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          className="text-muted hover:text-[var(--text)]"
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2" aria-label="Primary">
        <ul className="flex flex-col gap-1 pb-6">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors focus-ring-brand",
                    active
                      ? "bg-surface-2 text-[var(--text)] shadow-soft"
                      : "text-muted hover:bg-surface-2/70 hover:text-[var(--text)]"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="size-4 shrink-0 text-[var(--brand)]" />
                  <span className={cn("font-medium", collapsed && "sr-only")}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={cn("px-4 pb-6", collapsed && "sr-only")}
      >
        <div className="rounded-xl border border-subtle bg-surface-2 p-4 text-xs text-muted">
          <p className="font-semibold text-[var(--text)]">Support</p>
          <p className="mt-1 leading-5">
            Coverage 24/7 • <a href="mailto:support@fleetops.io">support@fleetops.io</a>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <aside
        className={cn(
          "hidden h-screen lg:flex lg:flex-col lg:transition-[width] lg:duration-200",
          collapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        {nav}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-72 max-w-[80vw] bg-surface-1 shadow-soft">
            {nav}
          </div>
          <button
            aria-label="Close navigation"
            className="flex-1 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-subtle bg-surface-1/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-3 sm:px-4 lg:px-6">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-tight text-[var(--text)]">{title}</h1>
              <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
                <HealthDot status="ok" aria-label="Services nominal" />
                Network stable
              </div>
            </div>
            <div className="ml-auto hidden items-center gap-3 md:flex">
              <div className="relative w-80 max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  placeholder="Search Order # / Driver / Unit / Customer"
                  className="focus-ring-brand w-full rounded-xl border border-subtle bg-surface-2 px-10 py-2 text-sm text-[var(--text)] placeholder:text-muted"
                  aria-label="Global search"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="View alerts"
                className="text-muted hover:text-[var(--text)]"
              >
                <Bell className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Contact support"
                className="text-muted hover:text-[var(--text)]"
              >
                <LifeBuoy className="size-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xl border border-subtle bg-surface-2 text-xs font-semibold uppercase tracking-wide text-[var(--text)]"
              >
                <Plus className="size-4" />
                <span className="ml-1">New Order</span>
              </Button>
            </div>
          </div>
          <div className="px-3 pb-4 sm:px-4 lg:px-6">
            <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.href} className="flex items-center gap-2">
                    {index !== 0 && <span className="text-muted">/</span>}
                    <Link href={crumb.href} className="text-muted hover:text-[var(--text)]">
                      {crumb.label}
                    </Link>
                  </span>
                ))}
              </div>
              <div className="md:hidden">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    placeholder="Search Order # / Driver / Unit / Customer"
                    className="focus-ring-brand w-full rounded-xl border border-subtle bg-surface-2 px-10 py-2 text-sm text-[var(--text)] placeholder:text-muted"
                    aria-label="Global search"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-4 lg:px-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
