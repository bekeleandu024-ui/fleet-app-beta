import React from 'react';
import { Truck, TrendingUp, AlertTriangle } from 'lucide-react';
export const AIInsights = () => {
  const insights = [{
    icon: Truck,
    title: 'LTL Opportunities',
    description: '12 LTL loads available in the Windsor area. 4 heading to Brampton, 3 to Toronto, 2 to Hamilton, and 3 to Ottawa. Estimated revenue opportunity: $8,400. Recommend consolidating Windsor-Brampton routes for maximum efficiency.',
    color: 'text-green-400',
    bgColor: 'bg-green-900 bg-opacity-20',
    borderColor: 'border-green-700'
  }, {
    icon: AlertTriangle,
    title: 'Route Optimization Alert',
    description: 'Current market shows high demand on Toronto-Montreal corridor (+23% above normal). 3 units within 50mi proximity could be consolidated. Traffic delays detected on Highway 401 (30min average). Weather advisory: Heavy snow expected in Quebec region affecting 2 active routes.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-900 bg-opacity-20',
    borderColor: 'border-amber-700'
  }];
  return <div className="mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        AI Insights & Recommendations
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => <div key={index} className={`${insight.bgColor} rounded-lg p-6 border ${insight.borderColor}`}>
            <div className="flex items-start space-x-4">
              <div className={`${insight.color} mt-1`}>
                <insight.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className={`text-base font-semibold ${insight.color} mb-2`}>
                  {insight.title}
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>)}
      </div>
    </div>;
};