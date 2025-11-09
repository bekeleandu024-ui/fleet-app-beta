"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Radio,
  MapPin,
  DollarSign,
  Shield,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { darkERPTheme } from "@/app/lib/theme-config";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function LeftNavigationRail() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("/dashboard");

  const navGroups: NavGroup[] = [
    {
      title: "Operations",
      items: [
        { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, href: "/dashboard" },
        { label: "Orders", icon: <FileText className="h-5 w-5" />, href: "/orders", badge: 12 },
      ],
    },
    {
      title: "Dispatch",
      items: [
        { label: "Dispatch Board", icon: <Radio className="h-5 w-5" />, href: "/dispatch", badge: 8 },
        { label: "Driver Assignment", icon: <Radio className="h-5 w-5" />, href: "/dispatch/assignment" },
      ],
    },
    {
      title: "Tracking",
      items: [
        { label: "Live Tracking", icon: <MapPin className="h-5 w-5" />, href: "/tracking" },
        { label: "Fleet Status", icon: <MapPin className="h-5 w-5" />, href: "/tracking/fleet" },
        { label: "Monitoring", icon: <MapPin className="h-5 w-5" />, href: "/fleet/monitoring" },
      ],
    },
    {
      title: "Finance",
      items: [
        { label: "Costing", icon: <DollarSign className="h-5 w-5" />, href: "/finance/costing" },
        { label: "Pricing", icon: <DollarSign className="h-5 w-5" />, href: "/finance/pricing" },
        { label: "Invoicing", icon: <DollarSign className="h-5 w-5" />, href: "/finance/invoicing" },
      ],
    },
    {
      title: "Customers",
      items: [
        { label: "All Customers", icon: <Users className="h-5 w-5" />, href: "/customers" },
      ],
    },
    {
      title: "Safety",
      items: [
        { label: "HOS Compliance", icon: <Shield className="h-5 w-5" />, href: "/safety/hos" },
        { label: "Incidents", icon: <Shield className="h-5 w-5" />, href: "/safety/incidents" },
      ],
    },
    {
      title: "Analytics",
      items: [
        { label: "Reports", icon: <BarChart3 className="h-5 w-5" />, href: "/analytics/reports" },
        { label: "Insights", icon: <BarChart3 className="h-5 w-5" />, href: "/analytics/insights" },
      ],
    },
    {
      title: "Admin",
      items: [
        { label: "Settings", icon: <Settings className="h-5 w-5" />, href: "/admin/settings" },
        { label: "Users", icon: <Settings className="h-5 w-5" />, href: "/admin/users" },
      ],
    },
  ];

  return (
    <nav
      className={clsx(
        "flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo area */}
      <div className="flex h-[72px] items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <span className="text-lg font-semibold text-foreground">
            FleetOps
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1.5 text-muted-foreground transition-opacity hover:opacity-70"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation groups */}
      <div className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
              {!collapsed && (
                <div className="mb-2 px-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {group.title}
                  </span>
                </div>
              )}
            <div className="space-y-1 px-2">
              {group.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={() => setActiveItem(item.href)}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors",
                    activeItem === item.href
                      ? "text-background"
                      : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
                  )}
                  style={
                    activeItem === item.href
                      ? { backgroundColor: darkERPTheme.brandAccent }
                      : undefined
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span
                              className="px-2 py-0.5 text-xs font-semibold rounded-full"
                              style={{
                                backgroundColor: darkERPTheme.severity.breach,
                                color: '#FFFFFF',
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                  {collapsed && item.badge && (
                    <span
                      className="absolute right-1 top-1 h-2 w-2 rounded-full"
                      style={{ backgroundColor: darkERPTheme.severity.breach }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer - version/help */}
      {!collapsed && (
        <div className="border-t border-border p-4">
          <div className="text-xs text-muted-foreground">
            <div>Version 2.4.0</div>
            <div className="mt-1">
              <a
                href="#"
                className="text-foreground hover:underline"
              >
                Help & Support
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
