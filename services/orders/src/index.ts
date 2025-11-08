import express from "express";
import orderRoutes from "./routes/orders";
import { runMigrations } from "./db/init";

const app = express();
const PORT = Number(process.env.PORT) || 4002;

app.use(express.json());

app.get("/", (_req, res) => res.json({ ok: true, service: "orders" }));
app.get("/healthz", (_req, res) => res.send("ok"));

app.use("/api/orders", orderRoutes);

async function start() {
  try {
    await runMigrations();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Orders service listening on ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start orders service:", error);
    process.exit(1);
  }
}

start();
