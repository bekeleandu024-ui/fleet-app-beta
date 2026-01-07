"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivitySquare,
  FileCheck,
  LayoutDashboard,
  MapPinned,
  PackageSearch,
  PlusCircle,
  Route,
  Settings2,
  Calendar,
  ClipboardList,
  Archive,
  Building2,
  Receipt,
  Radio,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";

const primaryItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Orders", href: "/orders", icon: PackageSearch },
  { label: "Book Trip", href: "/book", icon: Calendar },
  { label: "Trips", href: "/trips", icon: Route },
  { label: "Closed Trips", href: "/trips/closed", icon: Archive },
  { label: "Billing", href: "/billing/analytics", icon: Receipt },
  { label: "Farm Out", href: "/farm-out", icon: Building2 },
  { label: "Trip Events", href: "/events", icon: ClipboardList },
  { label: "Driver Console", href: "/driver/command-center", icon: Radio },
  { label: "Customs", href: "/customs", icon: FileCheck },
  { label: "Map", href: "/map", icon: MapPinned },
];

const adminItem = { label: "Data Management", href: "/admin", icon: Settings2 };

export function NavigationRail() {
  const pathname = usePathname() ?? "/";
  const AdminIcon = adminItem.icon;
  
  // Initialize from localStorage, default to expanded
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Load saved state on mount
  useEffect(() => {
    const saved = localStorage.getItem("nav-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);
  
  // Save state when it changes
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("nav-collapsed", String(newState));
  };

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "rounded-2xl border border-neutral-900/80 bg-neutral-950/60 p-4 shadow-lg shadow-black/40 transition-all duration-300",
        isCollapsed ? "w-[68px]" : "w-[200px]"
      )}
    >
      {/* Collapse/Expand Toggle */}
      <button
        onClick={toggleCollapsed}
        className="mb-4 flex w-full items-center justify-center rounded-lg p-2 text-neutral-500 hover:bg-neutral-900/60 hover:text-neutral-300 transition"
        aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
      >
        {isCollapsed ? (
          <ChevronRight className="size-4" />
        ) : (
          <ChevronLeft className="size-4" />
        )}
      </button>
      
      <div className="flex flex-col gap-2">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-xl px-3 py-2 text-sm transition",
                isCollapsed ? "justify-center" : "gap-3",
                active
                  ? "bg-neutral-900/80 text-neutral-100"
                  : "text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-100"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>
      <div className="my-4 border-t border-neutral-900/60" aria-hidden="true" />
      <div className="flex flex-col gap-2" aria-label="Administrative">
        <Link
          href={adminItem.href}
          title={isCollapsed ? adminItem.label : undefined}
          className={cn(
            "flex items-center rounded-xl px-3 py-2 text-sm transition",
            isCollapsed ? "justify-center" : "gap-3",
            pathname.startsWith(adminItem.href)
              ? "bg-emerald-500/10 text-emerald-300"
              : "text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-100"
          )}
        >
          <AdminIcon className="size-4 shrink-0" aria-hidden="true" />
          {!isCollapsed && <span className="truncate">{adminItem.label}</span>}
        </Link>
      </div>
    </nav>
  );
}

