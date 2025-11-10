"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Plus, Search, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchDashboard } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", match: (pathname) => pathname === "/" },
  { label: "Orders", href: "/orders", match: (pathname) => pathname.startsWith("/orders") },
  { label: "Dispatch", href: "/dispatch", match: (pathname) => pathname.startsWith("/dispatch") },
  { label: "Trips", href: "/trips", match: (pathname) => pathname.startsWith("/trips") },
  { label: "Costing", href: "/costing", match: (pathname) => pathname.startsWith("/costing") },
  {
    label: "Master Data",
    href: "/master-data/drivers",
    match: (pathname) => pathname.startsWith("/master-data"),
  },
  { label: "Map", href: "/map", match: (pathname) => pathname.startsWith("/map") },
  { label: "Analytics", href: "/analytics", match: (pathname) => pathname.startsWith("/analytics") },
];

const segmentLabel: Record<string, string> = {
  orders: "Orders",
  dispatch: "Dispatch",
  trips: "Trips",
  costing: "Costing",
  map: "Map",
  analytics: "Analytics",
  "master-data": "Master Data",
  drivers: "Drivers",
  units: "Units",
  rules: "Rules",
  events: "Events",
};

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [{ href: "/", label: "Dashboard" }];
  }

  return [
    { href: "/", label: "Dashboard" },
    ...segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      return { href, label: segmentLabel[segment] ?? decodeURIComponent(segment) };
    }),
  ];
}

function SearchField({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
      <input
        type="search"
        placeholder="Search order # / driver / unit / customer"
        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] py-2 pl-10 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)]"
        aria-label="Global search"
      />
    </div>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);
  const { data: dashboardData } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboard,
    staleTime: 1000 * 60 * 5,
  });

  const statusMeta = useMemo(() => {
    const services = dashboardData?.serviceHealth ?? [];
    const hasAlert = services.some((service) => service.status === "error");
    const hasWarn = services.some((service) => service.status === "warn");

    if (hasAlert) {
      return { label: "Network critical", tone: "alert" as const };
    }
    if (hasWarn) {
      return { label: "Network degraded", tone: "warn" as const };
    }
    if (services.length > 0) {
      return { label: "Network stable", tone: "ok" as const };
    }
    return { label: "Status unknown", tone: "warn" as const };
  }, [dashboardData?.serviceHealth]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-1)_92%,transparent)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="text-lg font-semibold text-[var(--text)]">
            Fleet Console
          </Link>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[var(--muted)]">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-2">
                  {index !== 0 ? <span className="text-[var(--muted)]">/</span> : null}
                  {isLast ? (
                    <span className="font-medium text-[var(--text)]">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-[var(--text)]">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
          <div className="ml-auto hidden flex-1 items-center gap-3 md:flex">
            <SearchField className="max-w-xl flex-1" />
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs font-medium",
                statusMeta.tone === "ok" && "text-[var(--text)]",
                statusMeta.tone === "warn" && "text-[var(--warn)]",
                statusMeta.tone === "alert" && "text-[var(--alert)]"
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  statusMeta.tone === "ok" && "bg-[var(--ok)]",
                  statusMeta.tone === "warn" && "bg-[var(--warn)]",
                  statusMeta.tone === "alert" && "bg-[var(--alert)]"
                )}
              />
              {statusMeta.label}
            </span>
            <Button variant="ghost" size="icon-sm" className="text-[var(--muted)] hover:text-[var(--text)]" aria-label="Notifications">
              <Bell className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="text-[var(--muted)] hover:text-[var(--text)]" aria-label="Profile">
              <User className="size-4" />
            </Button>
            <Button className="rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black">
              <Plus className="size-4" />
              New Order
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <nav className="flex flex-wrap items-center gap-1" aria-label="Primary">
            {navItems.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md border border-transparent px-3 py-2 text-sm font-medium text-[var(--muted)] transition-colors",
                    active && "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-3 md:hidden">
            <div className="flex items-center gap-2">
              <SearchField className="flex-1" />
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs font-medium",
                  statusMeta.tone === "ok" && "text-[var(--text)]",
                  statusMeta.tone === "warn" && "text-[var(--warn)]",
                  statusMeta.tone === "alert" && "text-[var(--alert)]"
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    statusMeta.tone === "ok" && "bg-[var(--ok)]",
                    statusMeta.tone === "warn" && "bg-[var(--warn)]",
                    statusMeta.tone === "alert" && "bg-[var(--alert)]"
                  )}
                />
                {statusMeta.label}
              </span>
              <Button variant="ghost" size="icon-sm" className="text-[var(--muted)] hover:text-[var(--text)]" aria-label="Notifications">
                <Bell className="size-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" className="text-[var(--muted)] hover:text-[var(--text)]" aria-label="Profile">
                <User className="size-4" />
              </Button>
              <Button className="flex-1 rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black">
                <Plus className="size-4" />
                New Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
