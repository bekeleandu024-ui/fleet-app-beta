"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getCustomerPricing, aiPricingRecommendations } from "../../mockData";
import { TrendingUp } from "lucide-react";

interface PricingTabProps {
  customerId: string;
}

export function PricingTab({ customerId }: PricingTabProps) {
  const pricingData = getCustomerPricing(customerId);

  return (
    <div className="space-y-6">
      {/* Contract Rates by Lane */}
      {pricingData.map((lane, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle className="text-base">{lane.lane}</CardTitle>
            {lane.contractRate && (
              <CardDescription>
                Contract Rate: <span className="font-semibold">${lane.contractRate.toFixed(2)}/mile</span>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Historical Rates */}
            <div>
              <div className="text-sm font-medium mb-2">Historical Rates</div>
              <div className="space-y-2">
                {lane.historicalRates.map((rate, rIdx) => (
                  <div key={rIdx} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{new Date(rate.date).toLocaleDateString()}</span>
                    <span className="font-medium">${rate.rate.toFixed(2)}/mile</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accessorial Rates */}
            <div>
              <div className="text-sm font-medium mb-2">Accessorial Rates</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(lane.accessorialRates).map(([name, price]) => (
                  <div key={name} className="flex items-center justify-between text-sm p-2 rounded border">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-medium">${price}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* AI Pricing Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            AI Pricing Recommendations
          </CardTitle>
          <CardDescription>Data-driven pricing optimization suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiPricingRecommendations.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium">{rec.lane}</div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current Rate:</span>
                    <span className="font-medium">${rec.currentRate.toFixed(2)}/mile</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Recommended Rate:</span>
                    <span className="font-semibold text-amber-600">${rec.recommendedRate.toFixed(2)}/mile</span>
                  </div>
                  <div className="mt-2 pt-2 border-t text-xs">
                    <strong>Reasoning:</strong> {rec.reasoning}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
