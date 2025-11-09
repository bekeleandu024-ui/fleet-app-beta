"use client";

import {
  FileText,
  UserCheck,
  Calculator,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

interface Activity {
  id: string;
  type: "order" | "driver" | "cost" | "status" | "system";
  title: string;
  description: string;
  timestamp: string;
  priority: "normal" | "important" | "urgent";
}

export default function RecentActivitiesFeed() {
  // Mock activity data
  const activities: Activity[] = [
    {
      id: "1",
      type: "order",
      title: "New Order Created",
      description: "Order #1234 created for Toronto → Chicago",
      timestamp: "2 minutes ago",
      priority: "normal",
    },
    {
      id: "2",
      type: "driver",
      title: "Driver Assigned",
      description: "John Smith assigned to Order #5678",
      timestamp: "5 minutes ago",
      priority: "normal",
    },
    {
      id: "3",
      type: "status",
      title: "Trip Status Update",
      description: "Order #9012 marked as In Transit",
      timestamp: "8 minutes ago",
      priority: "normal",
    },
    {
      id: "4",
      type: "cost",
      title: "Cost Calculated",
      description: "Order #3456 cost: $450 (Margin: 28%)",
      timestamp: "12 minutes ago",
      priority: "normal",
    },
    {
      id: "5",
      type: "system",
      title: "AI Alert Generated",
      description: "HOS violation risk detected for Driver Mike",
      timestamp: "15 minutes ago",
      priority: "urgent",
    },
    {
      id: "6",
      type: "status",
      title: "Delivery Completed",
      description: "Order #7890 successfully delivered",
      timestamp: "20 minutes ago",
      priority: "important",
    },
    {
      id: "7",
      type: "driver",
      title: "Driver Available",
      description: "Sarah Johnson is now available for assignment",
      timestamp: "25 minutes ago",
      priority: "normal",
    },
    {
      id: "8",
      type: "order",
      title: "Order Updated",
      description: "Order #2345 pickup time changed to 3:00 PM",
      timestamp: "30 minutes ago",
      priority: "normal",
    },
  ];

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "order":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "driver":
        return <UserCheck className="h-5 w-5 text-green-600" />;
      case "cost":
        return <Calculator className="h-5 w-5 text-purple-600" />;
      case "status":
        return <RefreshCw className="h-5 w-5 text-orange-600" />;
      case "system":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getPriorityIndicator = (priority: Activity["priority"]) => {
    switch (priority) {
      case "urgent":
        return <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />;
      case "important":
        return <div className="h-2 w-2 rounded-full bg-yellow-500" />;
      case "normal":
        return <div className="h-2 w-2 rounded-full bg-border" />;
    }
  };

  return (
  <div className="mt-6 rounded-lg border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Activities</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </button>
        </div>
      </div>

      {/* Activities List */}
      <div className="max-h-[600px] overflow-y-auto divide-y divide-border">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="px-6 py-4 transition-colors hover:bg-card/95"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80">
                  {getActivityIcon(activity.type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getPriorityIndicator(activity.priority)}
                    <h3 className="text-sm font-semibold text-foreground">
                      {activity.title}
                    </h3>
                  </div>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {activity.timestamp}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer - Real-time indicator */}
      <div className="border-t border-border bg-card/90 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Live updates active</span>
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
