import { Router } from "express";
import {
  createTrip,
  listTrips,
  getTrip,
  updateTripStatus,
  updateTripFields,
} from "../services/tripService";
import { getTripEvents, recordNote } from "../services/tripEventService";
import {
  getActiveExceptions,
  raiseException,
  resolveException,
} from "../services/tripExceptionService";
import { TripStatus, ExceptionType } from "../models/tracking";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { status, driverId, dispatchId, orderId } = req.query;
    const trips = await listTrips({
      status: parseStatus(status as string),
      driverId: driverId as string,
      dispatchId: dispatchId as string,
      orderId: orderId as string,
    });
    res.json(trips);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const trip = await createTrip(req.body);
    res.status(201).json(trip);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const trip = await getTrip(req.params.id);
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    res.json(trip);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status, triggeredBy, reason } = req.body;
    const parsedStatus = parseStatus(status);
    if (!parsedStatus) {
      res.status(400).json({ error: "status is required" });
      return;
    }
    const updated = await updateTripStatus(req.params.id, parsedStatus, {
      triggeredBy,
      reason,
    });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const updated = await updateTripFields(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/:id/events", async (req, res) => {
  try {
    const events = await getTripEvents(req.params.id);
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/events", async (req, res) => {
  try {
    const { note, triggeredBy } = req.body;
    if (!note) {
      res.status(400).json({ error: "note is required" });
      return;
    }
    const event = await recordNote(req.params.id, note, triggeredBy);
    res.status(201).json(event);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/:id/exceptions", async (req, res) => {
  try {
    const exceptions = await getActiveExceptions(req.params.id);
    res.json(exceptions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/exceptions", async (req, res) => {
  try {
    const { type, severity, message } = req.body;
    const parsedType = parseExceptionType(type);
    if (!parsedType || !severity || !message) {
      res.status(400).json({ error: "type, severity, and message are required" });
      return;
    }
    const exception = await raiseException({
      tripId: req.params.id,
      type: parsedType,
      severity,
      message,
    });
    res.status(201).json(exception);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/exceptions/:exceptionId/resolve", async (req, res) => {
  try {
    const exception = await resolveException(req.params.exceptionId);
    res.json(exception);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

function parseStatus(value?: string): TripStatus | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  const match = (Object.values(TripStatus) as string[]).find(
    (status) => status === normalized
  );
  return match as TripStatus | undefined;
}

function parseExceptionType(value?: string): ExceptionType | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  const match = (Object.values(ExceptionType) as string[]).find(
    (type) => type === normalized
  );
  return match as ExceptionType | undefined;
}

export default router;
