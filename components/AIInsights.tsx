// components/AIInsights.tsx
'use client';

import { useEffect, useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface Insight {
  category: 'TRIP_PROFILE' | 'MARGIN' | 'DRIVER_CHOICE' | 'COST' | 'RISK' | 'URGENCY' | 'DRIVER' | 'UNIT' | 'DISPATCH';
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  action?: string;
}

interface AIInsightsData {
  summary: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  insights: Insight[];
  recommendedDriver?: {
    id: string;
    name: string;
    reason: string;
  };
  recommendedUnit?: {
    id: string;
    number: string;
    reason: string;
  };
}

interface AIInsightsProps {
  type: 'trip' | 'order';
  id: string;
}

export default function AIInsights({ type, id }: AIInsightsProps) {
  const [insights, setInsights] = useState<AIInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        setLoading(true);
        const response = await fetch(`/api/${type}s/${id}/insights`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch insights');
        }
        
        const data = await response.json();
        setInsights(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [type, id]);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">AI {type === 'trip' ? 'Trip' : 'Order'} Insight</h3>
        </div>
        <div className="text-gray-400 text-sm">
          Analyzing {type} data and generating recommendations...
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="bg-gray-900 border border-red-900 rounded-lg p-6">
        <div className="flex items-center space-x-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load AI insights</span>
        </div>
      </div>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-red-900 bg-red-950';
      case 'warning':
        return 'border-yellow-900 bg-yellow-950';
      case 'success':
        return 'border-green-900 bg-green-950';
      default:
        return 'border-blue-900 bg-blue-950';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      TRIP_PROFILE: 'Trip Profile',
      MARGIN: 'Margin',
      DRIVER_CHOICE: 'Driver Choice',
      COST: 'Cost',
      RISK: 'Risk',
      URGENCY: 'Urgency',
      DRIVER: 'Driver',
      UNIT: 'Unit',
      DISPATCH: 'Dispatch',
    };
    return labels[category] || category;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">
          AI {type === 'trip' ? 'Trip' : 'Order'} Insight
        </h3>
      </div>

      {/* Summary */}
      <p className="text-gray-300 text-xs mb-4 border-l-2 border-purple-600 pl-3 py-1">
        {insights.summary}
      </p>

      {/* Recommendations (for orders) */}
      {type === 'order' && insights.recommendedDriver && (
        <div className="mb-4 space-y-2">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-400">DRIVER</span>
              <span className="text-xs text-green-400">✓</span>
            </div>
            <div className="text-white font-medium text-sm">{insights.recommendedDriver.name}</div>
          </div>

          {insights.recommendedUnit && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-400">UNIT</span>
                <span className="text-xs text-green-400">✓</span>
              </div>
              <div className="text-white font-medium text-sm">Unit {insights.recommendedUnit.number}</div>
            </div>
          )}
        </div>
      )}

      {/* Insights */}
      <div className="space-y-2">
        {insights.insights.map((insight, index) => (
          <div
            key={index}
            className={`border rounded-lg p-3 ${getSeverityColor(insight.severity)}`}
          >
            <div className="flex items-start space-x-2">
              <div className="mt-0.5">{getSeverityIcon(insight.severity)}</div>
              <div className="flex-1">
                <div className="text-white font-medium text-xs mb-0.5">{insight.title}</div>
                {insight.action && (
                  <div className="text-xs text-gray-300 mt-1">{insight.action}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

