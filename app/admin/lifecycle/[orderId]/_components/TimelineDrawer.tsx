"use client";

import React, { useState } from "react";
import { ChevronUp, ChevronDown, Clock, Database } from "lucide-react";

interface TimelineEvent {
  timestamp: string;
  service: "orders" | "tracking" | "dispatch" | "master-data";
  action: "INSERT" | "UPDATE" | "SELECT";
  description: string;
  details: string;
}

interface TimelineDrawerProps {
  events: TimelineEvent[];
}

export function TimelineDrawer({ events }: TimelineDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getServiceColor = (service: string) => {
    switch (service) {
      case "orders": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "tracking": return "text-green-400 bg-green-500/10 border-green-500/20";
      case "dispatch": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "master-data": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 transition-all duration-300 z-40 ${isOpen ? "h-96" : "h-12"}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 flex items-center justify-between px-6 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Clock className="w-4 h-4" />
          <span>Operation Log ({events.length} events)</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="h-[calc(100%-3rem)] overflow-auto p-6">
          <div className="space-y-4 max-w-5xl mx-auto">
            {events.map((event, idx) => (
              <div key={idx} className="flex gap-4 group">
                <div className="w-32 text-xs text-slate-500 font-mono pt-1 text-right">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
                <div className="relative flex-1 pb-4 border-l border-slate-800 pl-6 last:border-0">
                  <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-slate-700 -translate-x-[5px] group-hover:bg-white transition-colors"></div>
                  <div className="flex items-start justify-between bg-slate-800/50 p-3 rounded border border-slate-800 hover:border-slate-700 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded border ${getServiceColor(event.service)} uppercase font-bold`}>
                          {event.service}
                        </span>
                        <span className="text-xs font-mono text-slate-500">{event.action}</span>
                      </div>
                      <div className="text-sm font-medium text-slate-200">{event.description}</div>
                      <div className="text-xs text-slate-400 mt-1">{event.details}</div>
                    </div>
                    <Database className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
