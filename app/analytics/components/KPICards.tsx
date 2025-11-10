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
          <Card key={index} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-fleet-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              {kpi.period && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {kpi.period} <span className={kpi.trend === "up" ? "text-fleet-success" : "text-fleet-danger"}>{kpi.change}</span>
                </p>
              )}
              {kpi.subtitle && (
                <p
                  className={`mt-1 text-xs ${
                    kpi.aiInsight
                      ? "text-fleet-accent bg-fleet-accent/10 border border-fleet-accent/20 px-2 py-1 rounded"
                      : "text-muted-foreground"
                  }`}
                >
                  {kpi.aiInsight && "🤖 AI: "}
                  {kpi.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
