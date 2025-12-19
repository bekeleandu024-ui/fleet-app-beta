"use client";

import React from "react";
import { CheckCircle, Circle } from "lucide-react";

interface TimelineStep {
  label: string;
  status: "completed" | "current" | "pending";
  service: string;
  timestamp?: string;
}

interface LifecycleTimelineProps {
  statusHistory: { status: string; timestamp: string }[];
  currentStatus: string;
}

export function LifecycleTimeline({ statusHistory, currentStatus }: LifecycleTimelineProps) {
  const steps: TimelineStep[] = [
    { label: "NEW", service: "Orders", status: "completed" },
    { label: "ASSG", service: "Dispatch", status: "completed" },
    { label: "TRAN", service: "Tracking", status: "completed" },
    { label: "DELV", service: "Tracking", status: "completed" },
    { label: "CLSD", service: "Orders", status: "completed" },
  ];

  // Logic to determine status of each step based on currentStatus
  // For demo purposes, we'll assume all are completed if status is Closed
  // In a real app, we'd map statusHistory to these steps

  const getStepStatus = (stepLabel: string, index: number) => {
    // Simple logic for demo
    if (currentStatus === "Closed") return "completed";
    if (currentStatus === "New" && index === 0) return "current";
    // ... more logic
    return "completed"; 
  };

  return (
    <div className="w-full bg-slate-900 p-6 rounded-lg border border-slate-800 mb-6">
      <div className="flex justify-between items-center mb-8 text-slate-400 text-sm">
        <span>12:00 PM</span>
        <span>12:05 PM</span>
        <span>12:10 PM</span>
        <span>2:45 PM</span>
        <span>3:00 PM</span>
      </div>

      <div className="relative flex justify-between items-center">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -z-10 transform -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-0 w-full h-1 bg-green-500/20 -z-10 transform -translate-y-1/2" style={{ width: '100%' }}></div>

        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center gap-2 bg-slate-900 px-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
              step.status === 'completed' ? 'border-green-500 bg-green-500/10 text-green-500' : 
              step.status === 'current' ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 
              'border-slate-700 text-slate-700'
            }`}>
              <span className="text-xs font-bold">{step.label}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400">{step.service}</span>
              {step.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-500 mt-1" />}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm">
        <span className="text-slate-400">Current Step:</span>
        <span className="text-white font-medium">{currentStatus}</span>
        <div className="flex-1 h-2 bg-slate-800 rounded-full ml-4 overflow-hidden">
          <div className="h-full bg-green-500 w-full"></div>
        </div>
        <span className="text-green-500 ml-2">100%</span>
      </div>
    </div>
  );
}
