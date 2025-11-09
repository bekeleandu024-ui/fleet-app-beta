"use client";

import { ChevronRight, RefreshCw } from "lucide-react";
import { darkERPTheme } from "@/app/lib/theme-config";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  description: string;
  lastUpdated?: string;
}

export default function PageHeader({
  breadcrumbs,
  title,
  description,
  lastUpdated = "2m ago",
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-2" style={{ color: darkERPTheme.textMuted }}>
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {item.href ? (
              <a href={item.href} className="hover:opacity-80 transition-opacity">
                {item.label}
              </a>
            ) : (
              <span className="font-medium" style={{ color: darkERPTheme.textPrimary }}>
                {item.label}
              </span>
            )}
            {index < breadcrumbs.length - 1 && (
              <ChevronRight className="h-4 w-4" style={{ color: darkERPTheme.textMuted }} />
            )}
          </div>
        ))}
      </nav>

      {/* Page title + description */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: darkERPTheme.textPrimary }}>
            {title}
          </h1>
          <p className="text-sm mt-1" style={{ color: darkERPTheme.textMuted }}>
            {description}
          </p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-sm" style={{ color: darkERPTheme.textMuted }}>
            <RefreshCw className="h-4 w-4" />
            <span>Last updated {lastUpdated}</span>
          </div>
        )}
      </div>
    </div>
  );
}
