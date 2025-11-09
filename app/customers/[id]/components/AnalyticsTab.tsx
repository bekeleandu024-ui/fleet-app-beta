"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getCustomerAnalytics } from "../../mockData";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AnalyticsTabProps {
  customerId: string;
}

export function AnalyticsTab({ customerId }: AnalyticsTabProps) {
  const analytics = getCustomerAnalytics(customerId);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Orders/Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold">{analytics.orderFrequency.avgPerMonth}</div>
              <div className="flex items-center gap-1 text-sm text-emerald-600">
                {analytics.orderFrequency.trend === 'up' && <TrendingUp className="h-4 w-4" />}
                {analytics.orderFrequency.trend === 'down' && <TrendingDown className="h-4 w-4" />}
                {analytics.orderFrequency.trend === 'stable' && <Minus className="h-4 w-4" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{analytics.marginAnalysis.avgMargin.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              Best: {analytics.marginAnalysis.bestMargin.toFixed(1)}% · Worst: {analytics.marginAnalysis.worstMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">On-Time Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">{analytics.onTimeRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Monthly revenue over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-2">
            {analytics.revenueByMonth.map((month, idx) => {
              const maxRevenue = Math.max(...analytics.revenueByMonth.map(m => m.revenue));
              const heightPct = (month.revenue / maxRevenue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs font-medium">${(month.revenue / 1000).toFixed(0)}k</div>
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${heightPct}%` }}
                  />
                  <div className="text-xs text-muted-foreground">{month.month}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            AI Insights
          </CardTitle>
          <CardDescription>Automated analysis and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {analytics.aiInsights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <span className="text-blue-600 font-semibold text-sm">•</span>
                <span className="text-sm">{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
