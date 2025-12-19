import { Router, Request, Response } from 'express';
import { costingService } from '../services/costingService';
import { CostCalculationRequest } from '../models/costing';

const router = Router();

/**
 * POST /api/costing/calculate
 * Calculate cost for a trip
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const request: CostCalculationRequest = req.body;

    if (!request.order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    if (!request.miles || request.miles <= 0) {
      return res.status(400).json({ error: 'miles must be greater than 0' });
    }

    if (!request.driver_id && !request.unit_number) {
      return res.status(400).json({ error: 'Either driver_id or unit_number is required' });
    }

    const result = await costingService.calculateCost(request);
    res.json(result);
  } catch (error: any) {
    console.error('Error calculating cost:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/costing/breakdown/:orderId
 * Get cost breakdown for an order
 */
router.get('/breakdown/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const breakdown = await costingService.getCostBreakdown(orderId);
    res.json(breakdown);
  } catch (error: any) {
    console.error('Error getting cost breakdown:', error);
    // If there is no cost record for the order, return 404 instead of 500
    if (error && typeof error.message === 'string' && error.message.startsWith('No cost record found')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/costing/actual/:orderId
 * Update actual costs for completed trip
 */
router.patch('/actual/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { actual_miles, actual_cost } = req.body;

    if (!actual_miles || actual_miles <= 0) {
      return res.status(400).json({ error: 'actual_miles must be greater than 0' });
    }

    if (!actual_cost || actual_cost <= 0) {
      return res.status(400).json({ error: 'actual_cost must be greater than 0' });
    }

    await costingService.updateActualCost(orderId, actual_miles, actual_cost);
    res.json({ message: 'Actual costs updated successfully' });
  } catch (error: any) {
    console.error('Error updating actual costs:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
