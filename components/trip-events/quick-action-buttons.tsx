"use client";

import {
  Play,
  Package,
  LogOut,
  MapPin,
  Flag,
  Navigation,
  Anchor,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuickActionButtonsProps {
  onAction: (eventType: string, label: string) => void;
  disabled?: boolean;
  className?: string;
}

const quickActions = [
  {
    eventType: "TRIP_START",
    label: "Start Trip",
    icon: Play,
    color: "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30",
  },
  {
    eventType: "ARRIVED_PICKUP",
    label: "Arrived Pickup",
    icon: MapPin,
    color: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30",
  },
  {
    eventType: "LEFT_PICKUP",
    label: "Left Pickup",
    icon: Package,
    color: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/30",
  },
  {
    eventType: "ARRIVED_DELIVERY",
    label: "Arrived Delivery",
    icon: Flag,
    color: "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30",
  },
  {
    eventType: "LEFT_DELIVERY",
    label: "Left Delivery",
    icon: LogOut,
    color: "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border-cyan-500/30",
  },
  {
    eventType: "CROSSED_BORDER",
    label: "Crossed Border",
    icon: Navigation,
    color: "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30",
  },
  {
    eventType: "DROP_HOOK",
    label: "Drop & Hook",
    icon: Anchor,
    color: "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 border-pink-500/30",
  },
  {
    eventType: "TRIP_FINISHED",
    label: "Trip Finished",
    icon: CheckCircle2,
    color: "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30",
  },
];

export function QuickActionButtons({
  onAction,
  disabled = false,
  className = "",
}: QuickActionButtonsProps) {
  return (
    <Card className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 ${className}`}>
      <h3 className="mb-3 text-sm font-semibold text-neutral-200">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.eventType}
              type="button"
              onClick={() => onAction(action.eventType, action.label)}
              disabled={disabled}
              className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${action.color}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-center text-xs font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>

      {disabled && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          Select a trip to enable quick actions
        </div>
      )}
    </Card>
  );
}
