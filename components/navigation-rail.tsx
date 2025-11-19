"use client";

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
} from "lucide-react";

import { cn } from "@/lib/utils";

const primaryItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Orders", href: "/orders", icon: PackageSearch },
  { label: "Book Trip", href: "/book", icon: Calendar },
  { label: "Trips", href: "/trips", icon: Route },
  { label: "Create Trip", href: "/trips/new", icon: PlusCircle },
  { label: "Trip Events", href: "/events", icon: ClipboardList },
  { label: "Customs", href: "/customs", icon: FileCheck },
  { label: "Dispatch", href: "/dispatch", icon: ActivitySquare },
  { label: "Map", href: "/map", icon: MapPinned },
];

const adminItem = { label: "Data Management", href: "/admin", icon: Settings2 };

export function NavigationRail() {
  const pathname = usePathname() ?? "/";
  const AdminIcon = adminItem.icon;

  return (
    <nav
      aria-label="Primary navigation"
      className="rounded-2xl border border-neutral-900/80 bg-neutral-950/60 p-4 shadow-lg shadow-black/40"
    >
      <div className="flex flex-col gap-2">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                active
                  ? "bg-neutral-900/80 text-neutral-100"
                  : "text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-100"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="my-4 border-t border-neutral-900/60" aria-hidden="true" />
      <div className="flex flex-col gap-2" aria-label="Administrative">
        <Link
          href={adminItem.href}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
            pathname.startsWith(adminItem.href)
              ? "bg-emerald-500/10 text-emerald-300"
              : "text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-100"
          )}
        >
          <AdminIcon className="size-4" aria-hidden="true" />
          <span>{adminItem.label}</span>
        </Link>
      </div>
    </nav>
  );
}
