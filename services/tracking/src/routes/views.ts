import { Router } from "express";
import {
  getDispatchView,
  getDriverViewForDriver,
  getCustomerViewForOrder,
} from "../services/viewService";

const router = Router();

router.get("/dispatch", async (_req, res) => {
  try {
    const view = await getDispatchView();
    res.json(view);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/driver/:driverId", async (req, res) => {
  try {
    const view = await getDriverViewForDriver(req.params.driverId);
    if (!view) {
      res.status(404).json({ error: "No active trip for driver" });
      return;
    }
    res.json(view);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/customer/:orderId", async (req, res) => {
  try {
    const view = await getCustomerViewForOrder(req.params.orderId);
    if (!view) {
      res.status(404).json({ error: "No trip found for order" });
      return;
    }
    res.json(view);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
