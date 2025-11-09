"use client";

import { useState } from "react";
import { Search, Bell, User, Calendar, Moon, Sun, Monitor } from "lucide-react";
import clsx from "clsx";

export default function TopBar() {
  const [theme, setTheme] = useState<"light" | "dark" | "highContrast">("light");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState("Last 7 days");

  const environment = process.env.NEXT_PUBLIC_ENV || "PROD";
  const tenant = "Acme Logistics";

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Left: Environment badge + Tenant name */}
        <div className="flex items-center gap-4">
          <span
            className={clsx(
              "px-2.5 py-1 text-xs font-semibold rounded border",
              environment === "PROD"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
            )}
          >
            {environment}
          </span>
          <span className="text-sm font-medium text-gray-900">{tenant}</span>
        </div>

        {/* Center: Global search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, drivers, trips... (Ctrl+K)"
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Date range picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              <span>{dateRange}</span>
            </button>
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                <div className="space-y-2">
                  {["Today", "Yesterday", "Last 7 days", "Last 30 days", "This month", "Custom range"].map(
                    (option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setDateRange(option);
                          setShowDatePicker(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        {option}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme switcher */}
          <button
            onClick={() =>
              setTheme(theme === "light" ? "dark" : theme === "dark" ? "highContrast" : "light")
            }
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle theme"
          >
            {theme === "light" ? (
              <Sun className="h-5 w-5" />
            ) : theme === "dark" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Monitor className="h-5 w-5" />
            )}
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
          </button>

          {/* User menu */}
          <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-left hidden md:block">
              <div className="text-sm font-medium">John Doe</div>
              <div className="text-xs text-gray-500">Operations Manager</div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
