import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory stores for MVP
const drivers: Record<string, any> = {};
const units: Record<string, any> = {};
const trailers: Record<string, any> = {};

// Drivers
app.get("/drivers", (req, res) => {
  res.json(Object.values(drivers));
});

app.post("/drivers", (req, res) => {
  const id = uuidv4();
  const body = req.body;
  const driver = { id, ...body };
  drivers[id] = driver;
  res.status(201).json(driver);
});

app.get("/drivers/:id", (req, res) => {
  const d = drivers[req.params.id];
  if (!d) return res.status(404).json({ message: "not found" });
  res.json(d);
});

app.put("/drivers/:id", (req, res) => {
  const d = drivers[req.params.id];
  if (!d) return res.status(404).json({ message: "not found" });
  drivers[req.params.id] = { ...d, ...req.body };
  res.json(drivers[req.params.id]);
});

app.delete("/drivers/:id", (req, res) => {
  delete drivers[req.params.id];
  res.status(204).send();
});

// Units (vehicles)
app.get("/units", (req, res) => res.json(Object.values(units)));
app.post("/units", (req, res) => {
  const id = uuidv4();
  const unit = { id, ...req.body };
  units[id] = unit;
  res.status(201).json(unit);
});

// Trailers
app.get("/trailers", (req, res) => res.json(Object.values(trailers)));
app.post("/trailers", (req, res) => {
  const id = uuidv4();
  const trailer = { id, ...req.body };
  trailers[id] = trailer;
  res.status(201).json(trailer);
});

const port = process.env.PORT || 4001;
app.listen(port, () => {
  console.log(`master-data service listening on ${port}`);
});
