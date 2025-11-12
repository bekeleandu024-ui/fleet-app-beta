"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", match: (pathname: string) => pathname === "/" },
  { label: "Analytics", href: "/analytics", match: (pathname: string) => pathname.startsWith("/analytics") },
  { label: "Dispatch", href: "/dispatch", match: (pathname: string) => pathname.startsWith("/dispatch") },
  { label: "Orders", href: "/orders", match: (pathname: string) => pathname.startsWith("/orders") },
  { label: "Trips", href: "/trips", match: (pathname: string) => pathname === "/trips" },
  { label: "Trip Detail", href: "/trips/TRP-9001", match: (pathname: string) => pathname.startsWith("/trips/") },
  { label: "Costing Dashboard", href: "/costing", match: (pathname: string) => pathname.startsWith("/costing") },
  { label: "Map", href: "/map", match: (pathname: string) => pathname.startsWith("/map") },
  { label: "Fleet", href: "/master-data/units", match: (pathname: string) => pathname.startsWith("/master-data/units") },
  { label: "Drivers", href: "/master-data/drivers", match: (pathname: string) => pathname.startsWith("/master-data/drivers") },
  { label: "Rules", href: "/master-data/rules", match: (pathname: string) => pathname.startsWith("/master-data/rules") },
  { label: "Events", href: "/master-data/events", match: (pathname: string) => pathname.startsWith("/master-data/events") },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-900/60 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-6 py-4 lg:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="text-lg font-semibold text-white">
            Fleet Console
          </Link>
          <div className="ml-auto hidden flex-1 items-center gap-3 md:flex">
            <div className="relative flex-1 max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <Input
                type="search"
                placeholder="Search order # / driver / unit / customer"
                className="h-11 w-full pl-10 text-sm"
                aria-label="Global search"
              />
            </div>
            <Button variant="primary" size="sm">
              New Order
            </Button>
          </div>
          <div className="flex w-full flex-col gap-3 md:hidden">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
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
                  "rounded-lg border px-3 py-2 text-sm font-medium text-neutral-400 transition",
                  active
                    ? "border-emerald-500/60 bg-neutral-900/80 text-neutral-100 shadow-lg shadow-black/40"
                    : "border-transparent hover:border-neutral-800 hover:bg-neutral-900/50 hover:text-neutral-200"
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
