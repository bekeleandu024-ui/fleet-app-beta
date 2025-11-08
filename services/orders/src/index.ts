import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const orders: Record<string, any> = {};

app.get("/orders", (req: Request, res: Response) => res.json(Object.values(orders)));

app.post("/orders", (req: Request, res: Response) => {
  const id = uuidv4();
  const order = { id, status: "created", createdAt: new Date().toISOString(), ...req.body };
  orders[id] = order;
  // In a real system we'd publish an event to Kafka here
  res.status(201).json(order);
});

app.get("/orders/:id", (req: Request, res: Response) => {
  const o = orders[req.params.id];
  if (!o) return res.status(404).json({ message: "not found" });
  res.json(o);
});

app.put("/orders/:id", (req: Request, res: Response) => {
  const o = orders[req.params.id];
  if (!o) return res.status(404).json({ message: "not found" });
  orders[req.params.id] = { ...o, ...req.body };
  res.json(orders[req.params.id]);
});

app.delete("/orders/:id", (req: Request, res: Response) => {
  delete orders[req.params.id];
  res.status(204).send();
});

const port = process.env.PORT || 4002;
app.listen(port, () => console.log(`orders service listening on ${port}`));
