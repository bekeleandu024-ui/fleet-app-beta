"use client";

import { ChevronRight, RefreshCw } from "lucide-react";

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
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {item.href ? (
              <a href={item.href} className="hover:text-gray-900 transition-colors">
                {item.label}
              </a>
            ) : (
              <span className="text-gray-900 font-medium">{item.label}</span>
            )}
            {index < breadcrumbs.length - 1 && (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>
        ))}
      </nav>

      {/* Page title + description */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <RefreshCw className="h-4 w-4" />
            <span>Last updated {lastUpdated}</span>
          </div>
        )}
      </div>
    </div>
  );
}
