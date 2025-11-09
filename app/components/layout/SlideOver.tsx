"use client";

import { useEffect } from "react";
import { X, Clock } from "lucide-react";
import clsx from "clsx";
import { darkERPTheme } from "@/app/lib/theme-config";

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function SlideOver({ isOpen, onClose, title, children }: SlideOverProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={clsx(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col transform border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-opacity hover:opacity-70"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {/* Footer - Audit trail link */}
        <div className="border-t border-border bg-card px-6 py-4">
          <button
            className="flex items-center gap-2 text-sm font-medium hover:opacity-80"
            style={{ color: darkERPTheme.brandAccent }}
          >
            <Clock className="h-4 w-4" />
            View audit log
          </button>
        </div>
      </div>
    </>
  );
}

// Example detail content component
export function InsightDetail({ insightId }: { insightId: string }) {
  return (
    <div className="space-y-6">
      {/* Context */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Context
        </h3>
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <p>
            Driver John Smith is currently on Trip #1234, en route from Toronto to Chicago. Based
            on current HOS data, he will exceed the 11-hour daily drive limit by 14 minutes if he
            continues without rest.
          </p>
        </div>
      </div>

      {/* Impact analysis */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Impact Analysis
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-lg border-2 border-transparent bg-card p-3"
            style={{ borderColor: darkERPTheme.severity.breach }}
          >
            <div
              className="text-xs font-medium uppercase mb-1"
              style={{ color: darkERPTheme.severity.breach }}
            >
              ETA Impact
            </div>
            <div className="text-lg font-bold text-foreground">
              +25 minutes
            </div>
          </div>
          <div
            className="rounded-lg border-2 border-transparent bg-card p-3"
            style={{ borderColor: darkERPTheme.severity.risk }}
          >
            <div
              className="text-xs font-medium uppercase mb-1"
              style={{ color: darkERPTheme.severity.risk }}
            >
              Compliance Risk
            </div>
            <div className="text-lg font-bold text-foreground">
              High
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Recommended Action
        </h3>
        <div
          className="rounded-lg border border-transparent bg-card p-4 text-sm text-muted-foreground"
          style={{ borderColor: darkERPTheme.brandAccent }}
        >
          <p className="mb-2 font-medium" style={{ color: darkERPTheme.brandAccent }}>
            Reassign to Driver Sarah Johnson
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>Currently available in Hamilton, ON (18 miles from pickup)</li>
            <li>8.5 hours HOS remaining</li>
            <li>Can maintain on-time delivery</li>
            <li>No additional cost impact</li>
          </ul>
        </div>
      </div>

      {/* Why this recommendation */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Why This Recommendation (92% Confidence)
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div
              className="w-1 h-1 rounded-full mt-2"
              style={{ backgroundColor: darkERPTheme.brandAccent }}
            />
            <p>Driver availability model predicts Sarah will be closest available driver for 6+ hours</p>
          </div>
          <div className="flex items-start gap-2">
            <div
              className="w-1 h-1 rounded-full mt-2"
              style={{ backgroundColor: darkERPTheme.brandAccent }}
            />
            <p>Historical data shows 95% on-time delivery for this reassignment pattern</p>
          </div>
          <div className="flex items-start gap-2">
            <div
              className="w-1 h-1 rounded-full mt-2"
              style={{ backgroundColor: darkERPTheme.brandAccent }}
            />
            <p>Weather and traffic conditions are favorable for the alternate route</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          className="flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: darkERPTheme.brandAccent }}
        >
          Reassign to Sarah
        </button>
        <button
          className="px-4 py-2 text-sm font-medium text-foreground rounded-lg border border-border bg-card transition-colors hover:opacity-80"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
