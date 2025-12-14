"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState, Suspense } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", match: (pathname: string) => pathname === "/" },
  { label: "Analytics", href: "/analytics", match: (pathname: string) => pathname.startsWith("/analytics") },
  { label: "New Order", href: "/orders/new", match: (pathname: string) => pathname === "/orders/new" },
  {
    label: "Orders",
    href: "/orders",
    match: (pathname: string) => pathname.startsWith("/orders") && pathname !== "/orders/new",
  },
  { label: "Book Trip", href: "/book", match: (pathname: string) => pathname.startsWith("/book") },
  { label: "Trips", href: "/trips", match: (pathname: string) => pathname === "/trips" },
  { label: "Closed Trips", href: "/trips/closed", match: (pathname: string) => pathname === "/trips/closed" },
  { label: "Customs", href: "/customs", match: (pathname: string) => pathname.startsWith("/customs") },
  { label: "Costing Dashboard", href: "/costing", match: (pathname: string) => pathname.startsWith("/costing") },
  { label: "Map", href: "/map", match: (pathname: string) => pathname.startsWith("/map") },
  { label: "Trip Event", href: "/events", match: (pathname: string) => pathname.startsWith("/events") },
  { label: "Fleet", href: "/master-data/units", match: (pathname: string) => pathname.startsWith("/master-data/units") },
  { label: "Drivers", href: "/master-data/drivers", match: (pathname: string) => pathname.startsWith("/master-data/drivers") },
  { label: "Rules", href: "/master-data/rules", match: (pathname: string) => pathname.startsWith("/master-data/rules") },
];

export function TopNav() {
  return (
    <Suspense fallback={<div className="h-14 border-b border-zinc-800 bg-black" />}>
      <TopNavContent />
    </Suspense>
  );
}

function TopNavContent() {
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
    <header className="sticky top-0 z-50 border-b border-zinc-800/70 bg-black/95 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-6 py-4 lg:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="text-lg font-bold text-white hover:text-zinc-300 transition-colors">
            Fleet Dispatch
          </Link>
          <div className="ml-auto hidden flex-1 items-center gap-3 md:flex">
            <form className="relative flex-1 max-w-xl" onSubmit={handleSubmit}>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -tranzinc-y-1/2 text-zinc-500" />
              <Input
                type="search"
                placeholder="Search order # / driver / unit / customer"
                className="h-11 w-full pl-10 text-sm bg-zinc-900/60 border-zinc-800/70 text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-600/80 focus:ring-2 focus:ring-zinc-600/30 rounded-xl transition-all"
                aria-label="Global search"
                value={searchTerm}
                onChange={handleInputChange}
                ref={desktopSearchRef}
              />
            </form>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => router.push("/orders/new")}
              className="bg-emerald-500/30 hover:bg-emerald-500/40 text-white border border-emerald-500/50 hover:border-emerald-400/70 rounded-full px-5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              New Order
            </Button>
          </div>
          <div className="flex w-full flex-col gap-3 md:hidden">
            <form className="relative w-full" onSubmit={handleSubmit}>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -tranzinc-y-1/2 text-zinc-500" />
              <Input
                type="search"
                placeholder="Search"
                className="h-11 w-full pl-10 bg-zinc-900/60 border-zinc-800/70 text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-600/80 rounded-xl"
                aria-label="Global search"
                value={searchTerm}
                onChange={handleInputChange}
                ref={mobileSearchRef}
              />
            </form>
            <Button
              variant="primary"
              size="md"
              className="w-full bg-emerald-500/30 hover:bg-emerald-500/40 text-white border border-emerald-500/50 rounded-full"
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
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "border-zinc-600/80 bg-zinc-900/80 text-white shadow-lg shadow-black/40"
                    : "border-transparent text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/50 hover:text-zinc-200"
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

