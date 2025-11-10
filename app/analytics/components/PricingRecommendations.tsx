"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockPricingRecommendations } from "../mockData";
import { AlertTriangle, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

export function PricingRecommendations() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Pricing Recommendations</CardTitle>
        <CardDescription>
          AI-powered pricing suggestions for active orders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockPricingRecommendations.map((rec) => {
          const statusConfig = {
            'under-priced': {
              icon: AlertTriangle,
              chip: 'bg-fleet-danger/10 text-fleet-danger border-fleet-danger/20',
              border: 'border-fleet-danger/20',
              label: 'Under-priced',
              action: 'Increase',
              actionClasses: 'bg-fleet-danger text-white hover:opacity-90',
              riskClasses: 'bg-fleet-danger/10 text-fleet-danger',
            },
            'over-priced': {
              icon: AlertCircle,
              chip: 'bg-fleet-warning/10 text-fleet-warning border-fleet-warning/20',
              border: 'border-fleet-warning/20',
              label: 'Over-priced',
              action: 'Adjust',
              actionClasses: 'border border-fleet-warning/20 bg-transparent text-fleet-warning hover:bg-fleet-warning/10',
              riskClasses: 'bg-fleet-warning/10 text-fleet-warning',
            },
            'optimal': {
              icon: CheckCircle,
              chip: 'bg-fleet-success/10 text-fleet-success border-fleet-success/20',
              border: 'border-fleet-success/20',
              label: 'Optimal',
              action: 'Maintain',
              actionClasses: 'bg-fleet-success text-white hover:opacity-90',
              riskClasses: '',
            },
          } as const;

          const config = statusConfig[rec.status];
          const StatusIcon = config.icon;
          const priceDiff = rec.recommendedPrice - rec.currentPrice;
          const priceDiffPercent = (priceDiff / rec.currentPrice) * 100;

          return (
            <div
              key={rec.orderId}
              className={`bg-muted/40 p-4 rounded-lg border border-border ${config.border} hover:border-fleet-accent/40 transition-colors`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{rec.orderId}</span>
                    <Badge className={`${config.chip} text-xs`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.customer}</p>
                  <p className="text-xs text-muted-foreground/80">{rec.lane}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Margin</p>
                  <p className={`text-lg font-bold ${rec.margin >= 18 ? 'text-fleet-success' : rec.margin >= 15 ? 'text-fleet-warning' : 'text-fleet-danger'}`}>
                    {rec.margin.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded bg-muted/60 p-2">
                  <p className="text-xs text-muted-foreground">Current Price</p>
                  <p className="text-lg font-semibold text-foreground">${rec.currentPrice.toFixed(2)}</p>
                </div>
                <div className="rounded border border-cyan-700/50 bg-muted/60 p-2">
                  <p className="text-xs text-fleet-accent">Recommended</p>
                  <div className="flex items-center gap-1">
                    <p className="text-lg font-semibold text-fleet-accent">${rec.recommendedPrice.toFixed(2)}</p>
                    {priceDiff !== 0 && (
                      <div className={`flex items-center ${priceDiff > 0 ? 'text-fleet-success' : 'text-fleet-danger'}`}>
                        {priceDiff > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span className="text-xs ml-1">{Math.abs(priceDiffPercent).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {rec.status !== 'optimal' && (
                <Button
                  size="sm"
                  className={`w-full ${config.actionClasses}`}
                >
                  {config.action} Price
                </Button>
              )}

              {rec.status === 'under-priced' && (
                <div className={`mt-2 rounded ${config.riskClasses} p-2 text-xs`}>
                  <strong>⚠️ Risk:</strong> Leaving ${((rec.recommendedPrice - rec.currentPrice) * 500).toFixed(0)} on the table (500 mi estimate)
                </div>
              )}

              {rec.status === 'over-priced' && (
                <div className={`mt-2 rounded ${config.riskClasses} p-2 text-xs`}>
                  <strong>⚠️ Risk:</strong> May lose bid to competitor. Market rate is ${rec.recommendedPrice.toFixed(2)}/mi
                </div>
              )}
            </div>
          );
        })}

        <div className="p-3 bg-fleet-accent/10 rounded-lg border border-fleet-accent/20">
          <p className="text-sm text-fleet-accent">
            <strong>🤖 AI Insight:</strong> 40% of orders are under-priced. Adjusting to recommended rates could increase weekly revenue by $8,500.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
