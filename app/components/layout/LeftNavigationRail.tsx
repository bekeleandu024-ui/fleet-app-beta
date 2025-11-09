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
} from "lucide-react";
import clsx from "clsx";

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
        "h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <span className="text-lg font-semibold text-gray-900">FleetOps</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation groups */}
      <div className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            {!collapsed && (
              <div className="px-4 mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    "w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors",
                    activeItem === item.href
                      ? "bg-blue-50 text-blue-700 border-l-2 border-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute right-1 top-1 h-2 w-2 bg-red-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer - version/help */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <div>Version 2.4.0</div>
            <div className="mt-1">
              <a href="#" className="text-blue-600 hover:underline">
                Help & Support
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
