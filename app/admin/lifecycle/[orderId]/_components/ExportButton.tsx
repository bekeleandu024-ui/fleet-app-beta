"use client";

import React from "react";
import { Download, FileText, FileJson } from "lucide-react";

export function ExportButton() {
  return (
    <div className="flex items-center gap-2">
      <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm transition-colors border border-slate-700">
        <FileText className="w-4 h-4" />
        Export PDF
      </button>
      <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm transition-colors border border-slate-700">
        <FileJson className="w-4 h-4" />
        Export JSON
      </button>
    </div>
  );
}
