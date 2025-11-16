'use client';

import { Sparkles, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface AIInsightsPanelProps {
  recommendation: string;
  driverRecommendations?: Array<{
    driverName: string;
    driverType: string;
    unit: string;
    estimatedCost: number;
    reason: string;
    totalCpm: number;
  }>;
  costComparison?: Array<{
    type: string;
    driver: string;
    estimatedCost: number;
    pros: string[];
    cons: string[];
  }>;
  insights?: string[];
  totalDistance?: number;
  estimatedTime?: string;
  borderCrossings?: number;
}

export function AIInsightsPanel({
  recommendation,
  driverRecommendations = [],
  costComparison = [],
  insights = [],
  totalDistance,
  estimatedTime,
  borderCrossings,
}: AIInsightsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Main Recommendation */}
      <Card className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-violet-900 dark:text-violet-100 mb-2">
              AI Recommendation
            </h3>
            <p className="text-sm text-violet-700 dark:text-violet-300">
              {recommendation}
            </p>
          </div>
        </div>

        {/* Route Summary */}
        {totalDistance && (
          <div className="mt-4 pt-4 border-t border-violet-200 dark:border-violet-800">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-violet-600 dark:text-violet-400 font-medium">
                  Distance
                </div>
                <div className="text-violet-900 dark:text-violet-100 font-semibold">
                  {totalDistance} mi
                </div>
              </div>
              <div>
                <div className="text-violet-600 dark:text-violet-400 font-medium">
                  Est. Time
                </div>
                <div className="text-violet-900 dark:text-violet-100 font-semibold">
                  {estimatedTime}
                </div>
              </div>
              {borderCrossings !== undefined && (
                <div>
                  <div className="text-violet-600 dark:text-violet-400 font-medium">
                    Border Crossings
                  </div>
                  <div className="text-violet-900 dark:text-violet-100 font-semibold">
                    {borderCrossings} × $150
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Driver Recommendations */}
      {driverRecommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Driver/Truck Configuration Comparison
          </h3>
          <div className="space-y-3">
            {driverRecommendations.map((driver, idx) => (
              <div
                key={driver.driverName}
                className={`p-4 rounded-lg border ${
                  idx === 0
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {idx + 1}. {driver.driverType} DRIVER
                      </span>
                      {idx === 0 && (
                        <Badge variant="default" className="bg-green-600">
                          Most Cost-Effective
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Driver: {driver.driverName} ({driver.unit})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${driver.estimatedCost.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ${driver.totalCpm}/mile
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {driver.reason}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cost Comparison */}
      {costComparison.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Detailed Cost Analysis
          </h3>
          <div className="space-y-4">
            {costComparison.map((comparison, idx) => (
              <div key={comparison.type} className="pb-4 border-b last:border-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {comparison.type} - {comparison.driver}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    ${comparison.estimatedCost.toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-green-600 dark:text-green-400 font-medium mb-1">
                      Pros:
                    </div>
                    <ul className="space-y-1">
                      {comparison.pros.map((pro) => (
                        <li key={pro} className="text-gray-600 dark:text-gray-400">
                          • {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-orange-600 dark:text-orange-400 font-medium mb-1">
                      Cons:
                    </div>
                    <ul className="space-y-1">
                      {comparison.cons.map((con) => (
                        <li key={con} className="text-gray-600 dark:text-gray-400">
                          • {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Key Insights
          </h3>
          <div className="space-y-2">
            {insights.map((insight, idx) => {
              const isWarning = insight.includes('⚠️');
              const isSuccess = insight.includes('✅');
              const isInfo = insight.includes('ℹ️');

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    isWarning
                      ? 'bg-orange-50 dark:bg-orange-950/20'
                      : isSuccess
                      ? 'bg-green-50 dark:bg-green-950/20'
                      : 'bg-blue-50 dark:bg-blue-950/20'
                  }`}
                >
                  {isWarning && (
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  )}
                  {isSuccess && (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                  {isInfo && (
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-sm ${
                      isWarning
                        ? 'text-orange-700 dark:text-orange-300'
                        : isSuccess
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {insight.replace(/[⚠️✅ℹ️]/g, '').trim()}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
