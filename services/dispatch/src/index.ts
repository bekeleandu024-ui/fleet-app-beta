import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const trips: Record<string, any> = {};

app.post("/trips", (req, res) => {
  // Create a trip from order(s)
  const id = uuidv4();
  const trip = { id, status: "planned", createdAt: new Date().toISOString(), ...req.body };
  trips[id] = trip;
  // In a real system we'd publish 'trip.created' to the event bus
  res.status(201).json(trip);
});

app.get("/trips", (req, res) => res.json(Object.values(trips)));
app.get("/trips/:id", (req, res) => {
  const t = trips[req.params.id];
  if (!t) return res.status(404).json({ message: "not found" });
  res.json(t);
});

const port = process.env.PORT || 4003;
app.listen(port, () => console.log(`dispatch service listening on ${port}`));
