"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", match: (pathname: string) => pathname === "/" },
  { label: "Analytics", href: "/analytics", match: (pathname: string) => pathname.startsWith("/analytics") },
  { label: "Dispatch", href: "/dispatch", match: (pathname: string) => pathname.startsWith("/dispatch") },
  {
    label: "Orders",
    href: "/orders",
    match: (pathname: string) => pathname.startsWith("/orders") && pathname !== "/orders/new",
  },
  { label: "New Order", href: "/orders/new", match: (pathname: string) => pathname === "/orders/new" },
  { label: "Trips", href: "/trips", match: (pathname: string) => pathname === "/trips" },
  { label: "New Trip", href: "/trips/new", match: (pathname: string) => pathname === "/trips/new" },
  {
    label: "Trip Detail",
    href: "/trips/TRP-9001",
    match: (pathname: string) => pathname.startsWith("/trips/") && pathname !== "/trips" && pathname !== "/trips/new",
  },
  { label: "Customs", href: "/customs", match: (pathname: string) => pathname.startsWith("/customs") },
  { label: "Costing Dashboard", href: "/costing", match: (pathname: string) => pathname.startsWith("/costing") },
  { label: "Map", href: "/map", match: (pathname: string) => pathname.startsWith("/map") },
  { label: "Fleet", href: "/master-data/units", match: (pathname: string) => pathname.startsWith("/master-data/units") },
  { label: "Drivers", href: "/master-data/drivers", match: (pathname: string) => pathname.startsWith("/master-data/drivers") },
  { label: "Rules", href: "/master-data/rules", match: (pathname: string) => pathname.startsWith("/master-data/rules") },
  { label: "Events", href: "/master-data/events", match: (pathname: string) => pathname.startsWith("/master-data/events") },
];

export function TopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const desktopSearchRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchRef = useRef<HTMLInputElement | null>(null);
  const [searchTerm, setSearchTerm] = useState(() => searchParams?.get("q") ?? "");

  useEffect(() => {
    const currentQuery = searchParams?.get("q") ?? "";
    setSearchTerm((previous) => (previous === currentQuery ? previous : currentQuery));
  }, [searchParams]);

  const focusSearchInput = useCallback(() => {
    if (desktopSearchRef.current) {
      desktopSearchRef.current.focus();
      desktopSearchRef.current.select();
      return;
    }

    if (mobileSearchRef.current) {
      mobileSearchRef.current.focus();
      mobileSearchRef.current.select();
    }
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusSearchInput();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusSearchInput]);

  const handleSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();

      if (!trimmed) {
        return;
      }

      setSearchTerm(trimmed);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [router]
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleSearch(searchTerm);
    },
    [handleSearch, searchTerm]
  );

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-900/60 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-6 py-4 lg:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="text-lg font-semibold text-white">
            Fleet Console
          </Link>
          <div className="ml-auto hidden flex-1 items-center gap-3 md:flex">
            <form className="relative flex-1 max-w-xl" onSubmit={handleSubmit}>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <Input
                type="search"
                placeholder="Search order # / driver / unit / customer"
                className="h-11 w-full pl-10 text-sm"
                aria-label="Global search"
                value={searchTerm}
                onChange={handleInputChange}
                ref={desktopSearchRef}
              />
            </form>
            <Button variant="primary" size="sm" onClick={() => router.push("/orders/new")}>
              New Order
            </Button>
          </div>
          <div className="flex w-full flex-col gap-3 md:hidden">
            <form className="relative w-full" onSubmit={handleSubmit}>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <Input
                type="search"
                placeholder="Search"
                className="h-11 w-full pl-10"
                aria-label="Global search"
                value={searchTerm}
                onChange={handleInputChange}
                ref={mobileSearchRef}
              />
            </form>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => router.push("/orders/new")}
            >
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
