import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Store pings per trip/driver
const pings: Record<string, any[]> = {};

// Accept GPS ping: { tripId?, driverId, lat, lon, ts }
app.post("/pings", (req, res) => {
  const { tripId, driverId, lat, lon, ts } = req.body;
  const key = tripId || driverId || "unknown";
  const arr = pings[key] || [];
  const ping = { lat, lon, ts: ts || new Date().toISOString() };
  arr.push(ping);
  pings[key] = arr;
  // Would publish event 'tracking.ping' in production
  res.status(201).json(ping);
});

app.get("/pings/:key", (req, res) => {
  res.json(pings[req.params.key] || []);
});

const port = process.env.PORT || 4004;
app.listen(port, () => console.log(`tracking service listening on ${port}`));
