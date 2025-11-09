"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICards } from "./components/KPICards";
import { CostTrendsChart } from "./components/CostTrendsChart";
import { MarginAnalysisChart } from "./components/MarginAnalysisChart";
import { DriverTypeComparisonChart } from "./components/DriverTypeComparisonChart";
import { LaneAnalysisChart } from "./components/LaneAnalysisChart";
import { CostBreakdownChart } from "./components/CostBreakdownChart";
import { CostCalculator } from "./components/CostCalculator";
import { MarketRateDashboard } from "./components/MarketRateDashboard";
import { PricingRecommendations } from "./components/PricingRecommendations";

export default function AnalyticsPage() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Costing & Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive cost analysis, pricing intelligence, and AI-powered insights.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Charts Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="cost-trends" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5 bg-muted/60 border border-border">
              <TabsTrigger value="cost-trends">Cost Trends</TabsTrigger>
              <TabsTrigger value="margin">Margin</TabsTrigger>
              <TabsTrigger value="driver-type">Driver Type</TabsTrigger>
              <TabsTrigger value="lanes">Lanes</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            </TabsList>
            <TabsContent value="cost-trends" className="space-y-4">
              <CostTrendsChart />
            </TabsContent>
            <TabsContent value="margin" className="space-y-4">
              <MarginAnalysisChart />
            </TabsContent>
            <TabsContent value="driver-type" className="space-y-4">
              <DriverTypeComparisonChart />
            </TabsContent>
            <TabsContent value="lanes" className="space-y-4">
              <LaneAnalysisChart />
            </TabsContent>
            <TabsContent value="breakdown" className="space-y-4">
              <CostBreakdownChart />
            </TabsContent>
          </Tabs>
        </div>

        {/* Cost Calculator Widget */}
        <div className="lg:col-span-1">
          <CostCalculator />
        </div>
      </div>

      {/* Pricing Intelligence Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <MarketRateDashboard />
        <PricingRecommendations />
      </div>
    </div>
  );
}
