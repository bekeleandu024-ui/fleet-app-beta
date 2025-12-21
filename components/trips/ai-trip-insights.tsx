'use client';

import { useEffect, useState } from 'react';
import { 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface InsightItem {
  priority: number;
  severity: 'critical' | 'warning' | 'info' | 'success';
  category: 'data_integrity' | 'timeline' | 'resources' | 'financial' | 'route' | 'compliance';
  title: string;
  detail: string;
  action: string;
  data_points: Record<string, any>;
}

interface TripInsightsData {
  trip_id: string;
  summary: string;
  insights: InsightItem[];
  positive_indicators: string[];
  missing_data: string[];
  metadata?: {
    generated_at: string;
    data_completeness: Record<string, boolean>;
  };
}

interface AITripInsightsProps {
  tripId: string;
}

export function AITripInsights({ tripId }: AITripInsightsProps) {
  const [insights, setInsights] = useState<TripInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      if (!tripId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/trips/${tripId}/ai-insights`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch insights');
        }
        
        const data = await response.json();
        setInsights(data);
      } catch (err) {
        console.error('Error fetching AI insights:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [tripId]);

  if (loading) {
    return (
      <Card className="bg-neutral-950 border-neutral-800 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">AI Trip Insights</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
            <p className="text-sm text-neutral-400">
              Analyzing trip data with Claude AI...
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
          <h3 className="text-lg font-semibold text-white">AI Insights Error</h3>
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      financial: 'text-green-400',
      resources: 'text-blue-400',
      timeline: 'text-orange-400',
      route: 'text-purple-400',
      compliance: 'text-yellow-400',
      data_integrity: 'text-red-400',
    };
    return colors[category] || 'text-neutral-400';
  };

  return (
    <Card className="bg-neutral-950 border-neutral-800">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">
              AI Trip Insights
            </h3>
          </div>
          {insights.metadata?.generated_at && (
            <span className="text-xs text-neutral-500">
              {new Date(insights.metadata.generated_at).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="border-l-2 border-purple-600 pl-3 py-1">
          <p className="text-sm text-neutral-200">{insights.summary}</p>
        </div>

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
                  className="flex items-start gap-2 text-sm text-neutral-300"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{indicator}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.insights.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Analysis ({insights.insights.length})
            </div>
            <div className="space-y-2">
              {insights.insights
                .sort((a, b) => a.priority - b.priority)
                .map((insight, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 ${getSeverityStyles(insight.severity)}`}
                  >
                    <div className="flex items-start gap-2.5">
                      {getSeverityIcon(insight.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-white">
                            {insight.title}
                          </h4>
                          <span className={`text-xs ${getCategoryColor(insight.category)}`}>
                            {insight.category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 mb-2 leading-relaxed">
                          {insight.detail}
                        </p>
                        {insight.action && insight.action !== 'No action needed' && (
                          <div className="mt-2 pt-2 border-t border-neutral-700/50">
                            <p className="text-xs text-neutral-400">
                              <span className="font-medium">Action:</span> {insight.action}
                            </p>
                          </div>
                        )}
                        {Object.keys(insight.data_points).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(insight.data_points).slice(0, 3).map(([key, value]) => (
                              <div
                                key={key}
                                className="text-xs bg-neutral-900/50 px-2 py-1 rounded border border-neutral-800"
                              >
                                <span className="text-neutral-500">{key}:</span>{' '}
                                <span className="text-neutral-200 font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Missing Data Warning */}
        {insights.missing_data.length > 0 && (
          <div className="border border-orange-900/50 bg-orange-950/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-orange-300 mb-1">
                  Missing Data
                </h4>
                <ul className="text-xs text-orange-200/70 space-y-0.5">
                  {insights.missing_data.map((field, index) => (
                    <li key={index}>• {field}</li>
                  ))}
                </ul>
              </div>
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
