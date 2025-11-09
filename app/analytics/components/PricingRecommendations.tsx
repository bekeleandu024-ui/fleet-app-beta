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
              color: 'text-red-400',
              bg: 'bg-red-500/20',
              border: 'border-red-500/30',
              label: 'Under-priced',
              action: 'Increase',
              actionColor: 'bg-red-600 hover:bg-red-700',
            },
            'over-priced': {
              icon: AlertCircle,
              color: 'text-yellow-400',
              bg: 'bg-yellow-500/20',
              border: 'border-yellow-500/30',
              label: 'Over-priced',
              action: 'Adjust',
              actionColor: 'bg-yellow-600 hover:bg-yellow-700',
            },
            'optimal': {
              icon: CheckCircle,
              color: 'text-green-400',
              bg: 'bg-green-500/20',
              border: 'border-green-500/30',
              label: 'Optimal',
              action: 'Maintain',
              actionColor: 'bg-green-600 hover:bg-green-700',
            },
          };

          const config = statusConfig[rec.status];
          const StatusIcon = config.icon;
          const priceDiff = rec.recommendedPrice - rec.currentPrice;
          const priceDiffPercent = (priceDiff / rec.currentPrice) * 100;

          return (
            <div
              key={rec.orderId}
              className={`bg-muted/40 p-4 rounded-lg border ${config.border} hover:border-cyan-500/50 transition-colors`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{rec.orderId}</span>
                    <Badge className={`${config.bg} ${config.color} border-0 text-xs`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.customer}</p>
                  <p className="text-xs text-muted-foreground/80">{rec.lane}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Margin</p>
                  <p className={`text-lg font-bold ${rec.margin >= 18 ? 'text-green-400' : rec.margin >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
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
                  <p className="text-xs text-cyan-400">Recommended</p>
                  <div className="flex items-center gap-1">
                    <p className="text-lg font-semibold text-cyan-400">${rec.recommendedPrice.toFixed(2)}</p>
                    {priceDiff !== 0 && (
                      <div className={`flex items-center ${priceDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
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
                  className={`w-full ${config.actionColor} text-white`}
                >
                  {config.action} Price
                </Button>
              )}

              {rec.status === 'under-priced' && (
                <div className="mt-2 rounded bg-red-900/30 p-2 text-xs text-red-400">
                  <strong>⚠️ Risk:</strong> Leaving ${((rec.recommendedPrice - rec.currentPrice) * 500).toFixed(0)} on the table (500 mi estimate)
                </div>
              )}

              {rec.status === 'over-priced' && (
                <div className="mt-2 rounded bg-yellow-900/30 p-2 text-xs text-yellow-400">
                  <strong>⚠️ Risk:</strong> May lose bid to competitor. Market rate is ${rec.recommendedPrice.toFixed(2)}/mi
                </div>
              )}
            </div>
          );
        })}

        <div className="p-3 bg-cyan-900/30 rounded-lg border border-cyan-700/50">
          <p className="text-sm text-cyan-400">
            <strong>🤖 AI Insight:</strong> 40% of orders are under-priced. Adjusting to recommended rates could increase weekly revenue by $8,500.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
