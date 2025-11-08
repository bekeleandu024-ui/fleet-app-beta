import express from "express";
import dispatchRoutes from "./routes/dispatch";
import { runMigrations } from "./db/init";

const app = express();
const PORT = Number(process.env.PORT) || 4003;

app.use(express.json());

app.get("/", (_req, res) => res.json({ ok: true, service: "dispatch" }));
app.get("/healthz", (_req, res) => res.send("ok"));

app.use("/api/dispatch", dispatchRoutes);

// Run migrations and start server
async function start() {
  try {
    await runMigrations();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Dispatch service listening on ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start dispatch service:", error);
    process.exit(1);
  }
}

start();
