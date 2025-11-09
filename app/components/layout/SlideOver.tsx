"use client";

import { useEffect } from "react";
import { X, Clock } from "lucide-react";
import clsx from "clsx";

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
          "fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {/* Footer - Audit trail link */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
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
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Context</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
          <p>
            Driver John Smith is currently on Trip #1234, en route from Toronto to Chicago. Based
            on current HOS data, he will exceed the 11-hour daily drive limit by 14 minutes if he
            continues without rest.
          </p>
        </div>
      </div>

      {/* Impact analysis */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Impact Analysis</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-xs font-medium text-red-700 uppercase mb-1">ETA Impact</div>
            <div className="text-lg font-bold text-red-900">+25 minutes</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-xs font-medium text-orange-700 uppercase mb-1">Compliance Risk</div>
            <div className="text-lg font-bold text-orange-900">High</div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Recommended Action</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-medium text-blue-900 mb-2">Reassign to Driver Sarah Johnson</p>
          <ul className="space-y-1 list-disc list-inside text-blue-800">
            <li>Currently available in Hamilton, ON (18 miles from pickup)</li>
            <li>8.5 hours HOS remaining</li>
            <li>Can maintain on-time delivery</li>
            <li>No additional cost impact</li>
          </ul>
        </div>
      </div>

      {/* Why this recommendation */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Why This Recommendation (92% Confidence)
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 bg-gray-400 rounded-full mt-2" />
            <p>Driver availability model predicts Sarah will be closest available driver for 6+ hours</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 bg-gray-400 rounded-full mt-2" />
            <p>Historical data shows 95% on-time delivery for this reassignment pattern</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 bg-gray-400 rounded-full mt-2" />
            <p>Weather and traffic conditions are favorable for the alternate route</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          Reassign to Sarah
        </button>
        <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  );
}
