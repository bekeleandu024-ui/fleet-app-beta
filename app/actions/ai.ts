'use server';

import { generateBookingInsights } from '@/lib/claude-api';
import { BookingInsights } from '@/lib/types';

export async function generateBookingInsightsAction(tripContext: any): Promise<BookingInsights | null> {
  try {
    return await generateBookingInsights(tripContext);
  } catch (error) {
    console.error("Error in generateBookingInsightsAction:", error);
    return null;
  }
}
