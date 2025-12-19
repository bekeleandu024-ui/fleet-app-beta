"use client";

import React, { useState } from "react";
import { Check, Database, FileJson, ExternalLink } from "lucide-react";
import { JSONViewer } from "./JSONViewer";

interface ServicePanelProps {
  title: string;
  icon?: React.ReactNode;
  data: any;
  checks: { label: string; value: string | React.ReactNode }[];
  color: "blue" | "green" | "orange" | "purple";
  onViewJson: () => void;
  onViewQuery?: () => void;
}

export function ServicePanel({ title, data, checks, color, onViewJson, onViewQuery }: ServicePanelProps) {
  const colorClasses = {
    blue: "border-blue-500/20 bg-blue-500/5",
    green: "border-green-500/20 bg-green-500/5",
    orange: "border-orange-500/20 bg-orange-500/5",
    purple: "border-purple-500/20 bg-purple-500/5",
  };

  const headerColors = {
    blue: "text-blue-400",
    green: "text-green-400",
    orange: "text-orange-400",
    purple: "text-purple-400",
  };

  return (
    <div className={`rounded-lg border ${colorClasses[color]} p-4 flex flex-col h-full`}>
      <div className={`flex items-center gap-2 mb-4 font-semibold ${headerColors[color]}`}>
        {title}
      </div>

      <div className="space-y-4 flex-1">
        {checks.map((check, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="mt-1">
              <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-500" />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-200">{check.label}</div>
              <div className="text-xs text-slate-400 mt-1">{check.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2 pt-4 border-t border-slate-800">
        <button 
          onClick={onViewJson}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
        >
          <FileJson className="w-3 h-3" />
          View JSON
        </button>
        <button 
          onClick={onViewQuery}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
        >
          <Database className="w-3 h-3" />
          Query
        </button>
      </div>
    </div>
  );
}
