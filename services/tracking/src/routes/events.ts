import { Router } from "express";
import { getAllEvents, getTripEvents, recordEvent } from "../services/tripEventService";

const router = Router();

// GET /trip-events?tripId=...
router.get("/", async (req, res) => {
  try {
    const { tripId, limit } = req.query;
    
    if (tripId) {
      const events = await getTripEvents(tripId as string);
      // Frontend expects { events: [...] }
      res.json({ events });
    } else {
      const max = limit ? parseInt(limit as string) : 50;
      const events = await getAllEvents(max);
      res.json({ events });
    }
  } catch (error: any) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /trip-events
router.post("/", async (req, res) => {
  try {
    const { tripId, eventType, eventLabel, location, coordinates, notes, actor, actorType, timestamp } = req.body;

    if (!tripId || !eventType) {
      res.status(400).json({ error: "tripId and eventType are required" });
      return;
    }

    const payload = {
      eventLabel,
      location,
      coordinates,
      notes,
      actor,
      actorType,
    };

    const event = await recordEvent(tripId, eventType, {
      payload,
      occurredAt: timestamp ? new Date(timestamp) : new Date(),
      source: "api",
    });

    res.status(201).json(event);
  } catch (error: any) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
