"use client";

import { useState } from "react";
import { Search, Bell, User, Calendar, Moon, Sun, Monitor } from "lucide-react";
import clsx from "clsx";
import { darkERPTheme } from "@/app/lib/theme-config";

export default function TopBar() {
  const [theme, setTheme] = useState<"light" | "dark" | "highContrast">("dark");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState("Last 7 days");

  const environment = process.env.NEXT_PUBLIC_ENV || "PROD";
  const tenant = "Acme Logistics";

  return (
    <header
      className="h-16 sticky top-0 z-50"
      style={{
        backgroundColor: darkERPTheme.surface,
        borderBottom: `1px solid ${darkERPTheme.border}`,
      }}
    >
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Left: Environment badge + Tenant name */}
        <div className="flex items-center gap-4">
          <span
            className="px-2.5 py-1 text-xs font-semibold rounded"
            style={{
              backgroundColor: environment === "PROD" ? darkERPTheme.severity.good : darkERPTheme.severity.watch,
              color: environment === "PROD" ? '#000000' : '#000000',
            }}
          >
            {environment}
          </span>
          <span className="text-sm font-medium" style={{ color: darkERPTheme.textPrimary }}>
            {tenant}
          </span>
        </div>

        {/* Center: Global search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: darkERPTheme.textMuted }}
            />
            <input
              type="text"
              placeholder="Search orders, drivers, trips... (Ctrl+K)"
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
              style={{
                backgroundColor: darkERPTheme.surface2,
                border: `1px solid ${darkERPTheme.border}`,
                color: darkERPTheme.textPrimary,
              }}
            />
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Date range picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:opacity-90"
              style={{
                color: darkERPTheme.textPrimary,
                border: `1px solid ${darkERPTheme.border}`,
                backgroundColor: darkERPTheme.surface2,
              }}
            >
              <Calendar className="h-4 w-4" />
              <span>{dateRange}</span>
            </button>
            {showDatePicker && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg p-3"
                style={{
                  backgroundColor: darkERPTheme.surface2,
                  border: `1px solid ${darkERPTheme.border}`,
                }}
              >
                <div className="space-y-2">
                  {["Today", "Yesterday", "Last 7 days", "Last 30 days", "This month", "Custom range"].map(
                    (option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setDateRange(option);
                          setShowDatePicker(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded transition-opacity hover:opacity-80"
                        style={{
                          color: darkERPTheme.textPrimary,
                          backgroundColor: darkERPTheme.surface,
                        }}
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
            className="p-2 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: darkERPTheme.textMuted }}
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
          <button
            className="relative p-2 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: darkERPTheme.textMuted }}
          >
            <Bell className="h-5 w-5" />
            <span
              className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: darkERPTheme.severity.breach }}
            />
          </button>

          {/* User menu */}
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: darkERPTheme.surface2 }}
          >
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: darkERPTheme.surface }}
            >
              <User className="h-4 w-4" style={{ color: darkERPTheme.textMuted }} />
            </div>
            <div className="text-left hidden md:block">
              <div className="text-sm font-medium" style={{ color: darkERPTheme.textPrimary }}>
                John Doe
              </div>
              <div className="text-xs" style={{ color: darkERPTheme.textMuted }}>
                Operations Manager
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
