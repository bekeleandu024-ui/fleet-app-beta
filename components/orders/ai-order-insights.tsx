'use client';

import { useEffect, useState } from 'react';
import { 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle,
  TrendingUp,
  Loader2,
  Truck,
  DollarSign,
  User
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface InsightItem {
  priority: number;
  severity: 'critical' | 'warning' | 'info' | 'success';
  category: 'booking' | 'cost' | 'timeline' | 'capacity' | 'compliance';
  title: string;
  detail: string;
  action: string;
  data_points: Record<string, any>;
}

interface CostComparison {
  driver_type: string;
  total_cost: number;
  margin_pct: number;
  recommendation: string;
}

interface OrderInsightsData {
  order_id: string;
  summary: string;
  can_dispatch: boolean;
  recommended_driver: {
    id: string | null;
    name: string;
    type: string;
    reason: string;
    estimated_cost: number;
    margin_pct: number;
  };
  recommended_unit: {
    id: string | null;
    number: string;
    type: string;
    reason: string;
  };
  insights: InsightItem[];
  cost_comparison: CostComparison[];
  booking_blockers: string[];
  positive_indicators: string[];
  metadata?: {
    generated_at: string;
    data_completeness: Record<string, boolean>;
  };
}

interface AIOrderInsightsProps {
  orderId: string;
}

export function AIOrderInsights({ orderId }: AIOrderInsightsProps) {
  const [insights, setInsights] = useState<OrderInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    async function fetchInsights() {
      if (!orderId) return;
      
      try {
        // Check localStorage for cached data first
        const cacheKey = `ai-order-insights-${orderId}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            const cacheAge = Date.now() - new Date(cachedData.metadata?.generated_at || 0).getTime();
            
            // Use cache if less than 5 minutes old
            if (cacheAge < 5 * 60 * 1000) {
              setInsights(cachedData);
              setLoading(false);
              setIsStale(true); // Mark as stale so we fetch fresh data in background
            }
          } catch (e) {
            console.warn('Failed to parse cached insights:', e);
          }
        }
        
        setError(null);
        
        const response = await fetch(`/api/orders/${orderId}/ai-insights`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch insights');
        }
        
        const data = await response.json();
        setInsights(data);
        setIsStale(false);
        
        // Cache the response
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (err) {
        console.error('Error fetching AI order insights:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [orderId]);

  if (loading) {
    return (
      <Card className="bg-neutral-950 border-neutral-800 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">AI Booking Assistant</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
            <p className="text-sm text-neutral-400">
              Analyzing order and finding best driver/unit match...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !insights) {
    return (
      <Card className="bg-neutral-950 border-red-900/50 p-6">
        <div className="flex items-center space-x-3 mb-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Booking Assistant Error</h3>
        </div>
        <p className="text-sm text-red-300/70">{error || 'Failed to load insights'}</p>
      </Card>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-900/50 bg-red-950/30';
      case 'warning':
        return 'border-yellow-900/50 bg-yellow-950/30';
      case 'success':
        return 'border-green-900/50 bg-green-950/30';
      default:
        return 'border-blue-900/50 bg-blue-950/30';
    }
  };

  return (
    <Card className="bg-neutral-950 border-neutral-800">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">
              AI Booking Assistant
            </h3>
            {isStale && (
              <p className="text-xs text-neutral-500 mt-0.5">Updating...</p>
            )}
          </div>
          {insights.can_dispatch && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-950/30 border border-green-900/50 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Ready to Book
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="border-l-2 border-purple-600 pl-3 py-1">
          <p className="text-sm text-neutral-200">{insights.summary}</p>
        </div>

        {/* Recommended Driver */}
        {insights.recommended_driver.id && (
          <div className="border border-green-900/50 bg-green-950/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium text-green-400 uppercase tracking-wider">
                Recommended Driver
              </span>
              <span className="ml-auto text-xs text-green-300">
                {insights.recommended_driver.margin_pct.toFixed(1)}% margin
              </span>
            </div>
            <div className="text-sm font-semibold text-white mb-1">
              {insights.recommended_driver.name}
              <span className="ml-2 text-xs font-normal text-neutral-400">
                ({insights.recommended_driver.type})
              </span>
            </div>
            <p className="text-xs text-neutral-300 mb-2">
              {insights.recommended_driver.reason}
            </p>
            <div className="text-xs text-neutral-400">
              Est. Cost: <span className="text-green-300 font-medium">
                ${insights.recommended_driver.estimated_cost.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Recommended Unit */}
        {insights.recommended_unit.id && (
          <div className="border border-blue-900/50 bg-blue-950/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                Recommended Unit
              </span>
            </div>
            <div className="text-sm font-semibold text-white mb-1">
              Unit {insights.recommended_unit.number}
              <span className="ml-2 text-xs font-normal text-neutral-400">
                ({insights.recommended_unit.type})
              </span>
            </div>
            <p className="text-xs text-neutral-300">
              {insights.recommended_unit.reason}
            </p>
          </div>
        )}

        {/* Cost Comparison */}
        {insights.cost_comparison.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Cost Comparison
            </div>
            <div className="space-y-1.5">
              {insights.cost_comparison.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between text-xs p-2 rounded border ${
                    index === 0 ? 'border-emerald-900/50 bg-emerald-950/20' : 'border-neutral-800 bg-neutral-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-200">{option.driver_type}</span>
                    <span className={`${
                      option.margin_pct >= 15 ? 'text-green-400' : option.margin_pct >= 10 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {option.margin_pct.toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-neutral-400">
                    ${option.total_cost.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Blockers */}
        {insights.booking_blockers.length > 0 && (
          <div className="border border-red-900/50 bg-red-950/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-300 mb-1.5">
                  Booking Blockers
                </h4>
                <ul className="text-xs text-red-200/70 space-y-1">
                  {insights.booking_blockers.map((blocker, index) => (
                    <li key={index}>• {blocker}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Positive Indicators */}
        {insights.positive_indicators.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              Positive Indicators
            </div>
            <div className="space-y-1.5">
              {insights.positive_indicators.map((indicator, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-xs text-neutral-300"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{indicator}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Insights */}
        {insights.insights.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Detailed Analysis ({insights.insights.length})
            </div>
            <div className="space-y-2">
              {insights.insights
                .sort((a, b) => a.priority - b.priority)
                .slice(0, 3) // Show top 3 insights
                .map((insight, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-2.5 ${getSeverityStyles(insight.severity)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getSeverityIcon(insight.severity)}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          {insight.detail}
                        </p>
                        {insight.action && insight.action !== 'No action needed' && (
                          <div className="mt-1.5 pt-1.5 border-t border-neutral-700/50">
                            <p className="text-xs text-neutral-400">
                              <span className="font-medium">Action:</span> {insight.action}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Data Completeness Footer */}
        {insights.metadata?.data_completeness && (
          <div className="pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Data Sources:</span>
              <div className="flex gap-2">
                {Object.entries(insights.metadata.data_completeness).map(([key, complete]) => (
                  <span
                    key={key}
                    className={`px-1.5 py-0.5 rounded ${
                      complete
                        ? 'bg-green-950/30 text-green-400 border border-green-900/50'
                        : 'bg-neutral-900/50 text-neutral-500 border border-neutral-800'
                    }`}
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
