"use client";

import { TruckIcon, Users, DollarSign, Gauge, Brain } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

function StatCard({ title, value, icon, trend, subtitle }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last week</span>
            </div>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function HeroStatsBar() {
  // Mock data - in production, this would come from your backend/state management
  const stats = [
    {
      title: "Active Trips",
      value: 24,
      icon: <TruckIcon className="h-6 w-6 text-blue-600" />,
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Available Drivers",
      value: 18,
      icon: <Users className="h-6 w-6 text-green-600" />,
      trend: { value: 5, isPositive: false },
    },
    {
      title: "Today's Revenue",
      value: "$24,580",
      icon: <DollarSign className="h-6 w-6 text-emerald-600" />,
      trend: { value: 8, isPositive: true },
      subtitle: "Target: $30,000",
    },
    {
      title: "Fleet Utilization",
      value: "87%",
      icon: <Gauge className="h-6 w-6 text-purple-600" />,
      trend: { value: 3, isPositive: true },
    },
    {
      title: "AI Health Score",
      value: 92,
      icon: <Brain className="h-6 w-6 text-indigo-600" />,
      subtitle: "Excellent",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
