import { Router } from "express";
import { assignDriver, getDispatch, updateDispatchStatus } from "../services/dispatchService";

const router = Router();

// Assign a driver to an order
router.post("/assign", async (req, res) => {
  try {
    const { orderId, driverId } = req.body;
    const dispatch = await assignDriver(orderId, driverId);
    res.json(dispatch);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get dispatch by ID
router.get("/:id", async (req, res) => {
  try {
    const dispatch = await getDispatch(req.params.id);
    if (!dispatch) {
      return res.status(404).json({ error: "Dispatch not found" });
    }
    res.json(dispatch);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update dispatch status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const dispatch = await updateDispatchStatus(req.params.id, status);
    res.json(dispatch);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
