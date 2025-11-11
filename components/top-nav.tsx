"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", match: (pathname: string) => pathname === "/" },
  { label: "Orders", href: "/orders", match: (pathname: string) => pathname.startsWith("/orders") },
  { label: "Dispatch", href: "/dispatch", match: (pathname: string) => pathname.startsWith("/dispatch") },
  { label: "Trips", href: "/trips", match: (pathname: string) => pathname.startsWith("/trips") },
  { label: "Costing", href: "/costing", match: (pathname: string) => pathname.startsWith("/costing") },
  {
    label: "Master Data",
    href: "/master-data/drivers",
    match: (pathname: string) => pathname.startsWith("/master-data"),
  },
  { label: "Map", href: "/map", match: (pathname: string) => pathname.startsWith("/map") },
  { label: "Analytics", href: "/analytics", match: (pathname: string) => pathname.startsWith("/analytics") },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-1)_94%,transparent)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-6 py-4 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="text-lg font-semibold text-[var(--text)]">
            Fleet Console
          </Link>
          <div className="ml-auto hidden flex-1 items-center gap-3 md:flex">
            <div className="relative flex-1 max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                type="search"
                placeholder="Search order # / driver / unit / customer"
                className="h-11 w-full pl-10"
                aria-label="Global search"
              />
            </div>
            <Button variant="primary" size="sm">
              New Order
            </Button>
          </div>
          <div className="flex w-full flex-col gap-3 md:hidden">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                type="search"
                placeholder="Search"
                className="h-11 w-full pl-10"
                aria-label="Global search"
              />
            </div>
            <Button variant="primary" size="md" className="w-full">
              New Order
            </Button>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2" aria-label="Primary">
          {navItems.map((item) => {
            const active = item.match(pathname ?? "");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-[color-mix(in_srgb,var(--muted)_85%,transparent)] transition-colors",
                  active
                    ? "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] shadow-flat"
                    : "border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
