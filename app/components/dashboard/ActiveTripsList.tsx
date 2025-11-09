"use client";

import { MapPin, Clock, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface Trip {
  id: string;
  driver: string;
  status: "loading" | "in-transit" | "delivering" | "completed";
  currentLocation: string;
  destination: string;
  eta: string;
  etaConfidence: number;
  cost: number;
  revenue: number;
  marginPercent: number;
  riskFlags: Array<"late-risk" | "cost-overrun" | "hos-warning">;
}

export default function ActiveTripsList() {
  // Mock trip data - in production, this would come from your backend
  const trips: Trip[] = [
    {
      id: "#1234",
      driver: "John Smith",
      status: "in-transit",
      currentLocation: "Hamilton, ON",
      destination: "Toronto, ON",
      eta: "2:30 PM",
      etaConfidence: 92,
      cost: 450,
      revenue: 650,
      marginPercent: 30.8,
      riskFlags: [],
    },
    {
      id: "#5678",
      driver: "Sarah Johnson",
      status: "loading",
      currentLocation: "Mississauga, ON",
      destination: "Chicago, IL",
      eta: "Tomorrow 10:00 AM",
      etaConfidence: 78,
      cost: 1850,
      revenue: 2100,
      marginPercent: 11.9,
      riskFlags: ["cost-overrun"],
    },
    {
      id: "#9012",
      driver: "Mike Wilson",
      status: "in-transit",
      currentLocation: "London, ON",
      destination: "Detroit, MI",
      eta: "4:15 PM",
      etaConfidence: 65,
      cost: 680,
      revenue: 720,
      marginPercent: 5.6,
      riskFlags: ["late-risk", "hos-warning"],
    },
    {
      id: "#3456",
      driver: "Emily Brown",
      status: "delivering",
      currentLocation: "Brampton, ON",
      destination: "Brampton, ON",
      eta: "1:00 PM",
      etaConfidence: 95,
      cost: 320,
      revenue: 480,
      marginPercent: 33.3,
      riskFlags: [],
    },
    {
      id: "#7890",
      driver: "David Lee",
      status: "in-transit",
      currentLocation: "Kingston, ON",
      destination: "Montreal, QC",
      eta: "5:30 PM",
      etaConfidence: 88,
      cost: 520,
      revenue: 590,
      marginPercent: 11.9,
      riskFlags: [],
    },
  ];

  const getStatusStyles = (status: Trip["status"]) => {
    switch (status) {
      case "loading":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-transit":
        return "bg-green-100 text-green-800 border-green-200";
      case "delivering":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed":
        return "bg-muted text-foreground border-border";
    }
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 15) return "text-green-600";
    if (margin >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getRiskFlagIcon = (flag: Trip["riskFlags"][number]) => {
    switch (flag) {
      case "late-risk":
        return { icon: <Clock className="h-4 w-4" />, label: "Late Risk", color: "text-orange-600" };
      case "cost-overrun":
        return { icon: <TrendingUp className="h-4 w-4" />, label: "Cost Overrun", color: "text-red-600" };
      case "hos-warning":
        return { icon: <AlertTriangle className="h-4 w-4" />, label: "HOS Warning", color: "text-yellow-600" };
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-green-600";
    if (confidence >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="bg-card text-foreground rounded-lg border border-border shadow-sm mt-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">Active Trips</h2>
        <p className="text-sm text-muted-foreground mt-1">{trips.length} trips in progress</p>
      </div>

      {/* Trips List */}
      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">{trip.id}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-foreground">{trip.driver}</span>
              </div>
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusStyles(
                  trip.status
                )}`}
              >
                {trip.status.replace("-", " ")}
              </span>
            </div>

            {/* Location info */}
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="text-sm text-muted-foreground truncate">
                <span className="font-medium">{trip.currentLocation}</span>
                <span className="mx-2">→</span>
                <span>{trip.destination}</span>
              </div>
            </div>

            {/* ETA with confidence */}
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">ETA: {trip.eta}</span>
              <span
                className={`text-xs font-medium ${getConfidenceColor(
                  trip.etaConfidence
                )}`}
              >
                ({trip.etaConfidence}% confident)
              </span>
            </div>

            {/* Cost vs Revenue */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="ml-1 font-medium">
                    ${trip.cost.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Revenue:</span>
                  <span className="ml-1 font-medium">
                    ${trip.revenue.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {trip.marginPercent >= 15 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : trip.marginPercent >= 5 ? (
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-bold ${getMarginColor(trip.marginPercent)}`}
                >
                  {trip.marginPercent.toFixed(1)}% margin
                </span>
              </div>
            </div>

            {/* Risk flags */}
            {trip.riskFlags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {trip.riskFlags.map((flag, index) => {
                  const flagInfo = getRiskFlagIcon(flag);
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted border border-border ${flagInfo.color}`}
                    >
                      {flagInfo.icon}
                      <span className="text-xs font-medium">{flagInfo.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-muted/40 border-t border-border">
        <button className="text-sm text-primary hover:text-primary/80 font-medium">
          View All Trips →
        </button>
      </div>
    </div>
  );
}
