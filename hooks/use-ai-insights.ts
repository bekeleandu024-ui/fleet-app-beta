import { useState, useCallback } from 'react';
import { generateBookingInsightsAction } from '@/app/actions/ai';
import { BookingInsights } from '@/lib/types';

export function useAIInsights() {
  const [insights, setInsights] = useState<BookingInsights | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = useCallback(async (tripContext: any) => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateBookingInsightsAction(tripContext);
      if (result) {
        setInsights(result);
      } else {
        setError("Failed to generate insights");
      }
    } catch (err) {
      console.error("Error generating insights:", err);
      setError("Failed to generate insights");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    insights,
    isGenerating,
    error,
    generateInsights
  };
}
