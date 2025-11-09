import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, PieChart } from "lucide-react";

export function KPICards() {
  const kpis = [
    {
      title: "Total Fleet Costs",
      value: "$168,420",
      period: "This Month",
      change: "+2.5%",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Average CPM",
      value: "$1.87",
      subtitle: "12% below industry avg",
      icon: TrendingUp,
      trend: "down",
      aiInsight: true,
    },
    {
      title: "Cost per Driver Type",
      value: "COM: $1.85",
      subtitle: "RNR: $1.72 | OO: $2.35",
      icon: Users,
    },
    {
      title: "Fixed vs Variable",
      value: "33% / 67%",
      subtitle: "Healthy ratio",
      icon: PieChart,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card key={index} className="bg-gray-800/30 border-gray-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                {kpi.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{kpi.value}</div>
              {kpi.period && (
                <p className="text-xs text-gray-400 mt-1">
                  {kpi.period} <span className={kpi.trend === "up" ? "text-green-400" : "text-red-400"}>{kpi.change}</span>
                </p>
              )}
              {kpi.subtitle && (
                <p className={`text-xs mt-1 ${kpi.aiInsight ? "text-cyan-400 bg-cyan-900/30 p-1 rounded" : "text-gray-400"}`}>
                  {kpi.aiInsight && "🤖 AI: "}{kpi.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
